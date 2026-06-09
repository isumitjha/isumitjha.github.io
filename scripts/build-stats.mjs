// Builds assets/data/stats.json with aggregated GitHub stats (public + private).
// Runs in GitHub Actions with a secret token — the token never reaches the browser.
//
// Token (secret GH_STATS_TOKEN): use a READ-ONLY, fine-grained PAT —
//   Repository access: All repositories
//   Repository permissions: Contents -> Read-only, Metadata -> Read-only
// Set an expiry and rotate it. A read-only token can only READ repos (incl. private
// code); it cannot push, delete, or change settings — keep the blast radius small.
// (A classic token with `repo` + `read:user` also works but is read+WRITE to every
// repo, so it's NOT recommended.)
//
// `cloc` must be installed for the lines-of-code count.

import { writeFileSync, mkdirSync, mkdtempSync, rmSync, existsSync, readFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

// Load .env for local runs (CI provides these as env vars directly; .env is gitignored).
if (existsSync('.env')) {
  for (const line of readFileSync('.env', 'utf8').split('\n')) {
    const m = line.match(/^\s*([\w.-]+)\s*=\s*(.*?)\s*$/);
    if (m && m[1] && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
}

const USER = process.env.GH_USER || 'isumitjha';
const TOKEN = process.env.GH_TOKEN;
if (!TOKEN) { console.log('No GH_STATS_TOKEN set — skipping (site will use public API).'); process.exit(0); }

const H = { Authorization: `bearer ${TOKEN}`, 'User-Agent': USER };

async function gql(query, variables) {
  const r = await fetch('https://api.github.com/graphql', {
    method: 'POST', headers: { ...H, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables })
  });
  const j = await r.json();
  if (j.errors) throw new Error(JSON.stringify(j.errors));
  return j.data;
}
async function rest(path) {
  const r = await fetch(`https://api.github.com${path}`, { headers: { ...H, Accept: 'application/vnd.github+json' } });
  if (!r.ok) throw new Error(`${path}: ${r.status}`);
  return r.json();
}
const issueCount = (q) => gql(`query($q:String!){search(query:$q,type:ISSUE){issueCount}}`, { q }).then(d => d.search.issueCount);
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
async function searchCount(kind, q) {
  const url = `https://api.github.com/search/${kind}?q=${encodeURIComponent(q)}&per_page=1`;
  const headers = { ...H, Accept: kind === 'commits' ? 'application/vnd.github.cloak-preview+json' : 'application/vnd.github+json' };
  for (let a = 0; a < 3; a++) {
    try {
      const r = await fetch(url, { headers });
      if (r.status === 403) { await sleep(12000); continue; }      // secondary rate limit — wait
      if (!r.ok) return null;
      return (await r.json()).total_count;
    } catch { await sleep(2500); }
  }
  return null;
}

// --- account info ---
const u = (await gql(`query($l:String!){user(login:$l){createdAt followers{totalCount}}}`, { l: USER })).user;
const startYear = new Date(u.createdAt).getFullYear();
const thisYear = new Date().getUTCFullYear();

// --- lifetime contributions incl. private (sum per-year contribution windows) ---
let commits = 0, contributions = 0;
const byYear = [];
for (let y = startYear; y <= thisYear; y++) {
  const d = await gql(
    `query($l:String!,$f:DateTime!,$t:DateTime!){user(login:$l){contributionsCollection(from:$f,to:$t){totalCommitContributions restrictedContributionsCount contributionCalendar{totalContributions}}}}`,
    { l: USER, f: `${y}-01-01T00:00:00Z`, t: `${y}-12-31T23:59:59Z` }
  );
  const c = d.user.contributionsCollection;
  commits += c.totalCommitContributions + c.restrictedContributionsCount;
  contributions += c.contributionCalendar.totalContributions;
  byYear.push({ year: y, contributions: c.contributionCalendar.totalContributions });
}

// --- contribution calendar (last 12 months, incl. private) ---
let calendar = [];
try {
  const cal = await gql(`query($l:String!){user(login:$l){contributionsCollection{contributionCalendar{weeks{contributionDays{date contributionCount}}}}}}`, { l: USER });
  calendar = cal.user.contributionsCollection.contributionCalendar.weeks.map(w => w.contributionDays.map(x => ({ d: x.date, c: x.contributionCount })));
} catch {}

// --- repos contributed to (incl. others' repos) ---
const reposContributedTo = (await gql(
  `query($l:String!){user(login:$l){repositoriesContributedTo(contributionTypes:[COMMIT,PULL_REQUEST,ISSUE,PULL_REQUEST_REVIEW]){totalCount}}}`,
  { l: USER }
)).user.repositoriesContributedTo.totalCount;

// --- PRs / merged / issues (search sees private repos the token can access) ---
const prs = await issueCount(`author:${USER} type:pr`);
const merged = await issueCount(`author:${USER} type:pr is:merged`);
const issues = await issueCount(`author:${USER} type:issue`);

// --- repos incl. private (owner) ---
let repos = [], page = 1;
for (;;) {
  const batch = await rest(`/user/repos?per_page=100&page=${page}&affiliation=owner&visibility=all`);
  repos = repos.concat(batch);
  if (batch.length < 100) break;
  page++;
}

// --- language breakdown incl. private ---
const langBytes = {};
for (const r of repos) {
  if (r.fork) continue;
  try {
    const L = await rest(`/repos/${r.full_name}/languages`);
    for (const [k, v] of Object.entries(L)) langBytes[k] = (langBytes[k] || 0) + v;
  } catch {}
}
const totalBytes = Object.values(langBytes).reduce((a, b) => a + b, 0) || 1;
const langCount = Object.keys(langBytes).length;
const langs = Object.entries(langBytes).sort((a, b) => b[1] - a[1]).slice(0, 6)
  .map(([name, bytes]) => ({ name, pct: +(bytes / totalBytes * 100).toFixed(1) }));
const topLang = langs[0]?.name || '—';

// --- lines of code via cloc over cloned repos (incl. private, excl. forks) ---
let loc = null;
let hasCloc = false;
try { execSync('cloc --version', { stdio: 'ignore' }); hasCloc = true; } catch {}
if (hasCloc) try {
  let total = 0;
  for (const r of repos) {
    if (r.fork) continue;
    const dir = mkdtempSync(join(tmpdir(), 'repo-'));
    try {
      execSync(`git clone --depth 1 --quiet https://x-access-token:${TOKEN}@github.com/${r.full_name}.git "${dir}"`, { stdio: 'ignore', timeout: 120000 });
      const out = execSync(`cloc --json --quiet "${dir}" 2>/dev/null || true`, { encoding: 'utf8', maxBuffer: 1e8 });
      const j = JSON.parse(out || '{}');
      if (j.SUM && j.SUM.code) total += j.SUM.code;
    } catch {} finally { rmSync(dir, { recursive: true, force: true }); }
  }
  loc = total;
} catch { loc = null; }

// --- per-repo open-source contribution data (for hover/click cards) ---
const OSS_REPOS = [
  'conda-incubator/jupyterlab-conda-store',
  'sympy/sympy.github.com',
  'educational-technology-collective/jupyterlab-pioneer',
  'nebari-dev/nebari',
  'nebari-dev/nebari-docs',
  'holoviz/panel',
  'niivue/niivue',
  'essentiasoftserv/openbharatocr'
];
const oss = {};
for (const full of OSS_REPOS) {
  let info = {};
  try { info = await rest(`/repos/${full}`); } catch { try { await sleep(2500); info = await rest(`/repos/${full}`); } catch {} }
  let repoLangs = [];
  try {
    const L = await rest(`/repos/${full}/languages`);
    const tot = Object.values(L).reduce((a, b) => a + b, 0) || 1;
    repoLangs = Object.entries(L).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([name, bytes]) => ({ name, pct: +(bytes / tot * 100).toFixed(1) }));
  } catch {}
  const commitsR = await searchCount('commits', `repo:${full} author:${USER}`); await sleep(1500);
  const prsR = await searchCount('issues', `repo:${full} author:${USER} type:pr`); await sleep(1500);
  const mergedR = await searchCount('issues', `repo:${full} author:${USER} type:pr is:merged`); await sleep(1500);
  // lines changed by me (best-effort; the endpoint may return 202 while computing)
  let additions = null, deletions = null;
  try {
    let stats = null;
    for (let a = 0; a < 4; a++) {
      const r = await fetch(`https://api.github.com/repos/${full}/stats/contributors`, { headers: { ...H, Accept: 'application/vnd.github+json' } });
      if (r.status === 202) { await sleep(4000); continue; }
      if (r.ok) { stats = await r.json(); }
      break;
    }
    if (Array.isArray(stats)) {
      const mine = stats.find(s => s.author && s.author.login && s.author.login.toLowerCase() === USER.toLowerCase());
      if (mine) { additions = 0; deletions = 0; mine.weeks.forEach(w => { additions += w.a; deletions += w.d; }); }
    }
  } catch {}
  // Always record the entry (even if one call hiccupped) so the pill gets a card.
  oss[full] = { repo: full, name: full.split('/')[1], commits: commitsR, prs: prsR, merged: mergedR, additions, deletions, language: info.language || null, stars: info.stargazers_count != null ? info.stargazers_count : null, langs: repoLangs };
}

const data = {
  generatedAt: new Date().toISOString(),
  commits, contributions, prs, merged, issues, loc, reposContributedTo, langCount, topLang, langs, byYear, calendar, oss
};

// Safety guard: never overwrite good data with an incomplete or regressed run.
// commits/contributions are lifetime sums (monotonic) — a null or a big drop means
// a partial API failure this run, so keep the previously committed file instead.
let prev = null;
try { prev = JSON.parse(readFileSync('assets/data/stats.json', 'utf8')); } catch {}
const regressed =
  data.commits == null || data.contributions == null ||
  (prev && prev.commits && data.commits < prev.commits * 0.8) ||
  (prev && prev.contributions && data.contributions < prev.contributions * 0.8);
if (regressed) {
  console.log('New stats look incomplete or regressed — keeping existing stats.json and exiting.');
  process.exit(0);
}

mkdirSync('assets/data', { recursive: true });
writeFileSync('assets/data/stats.json', JSON.stringify(data, null, 2) + '\n');
console.log('Wrote assets/data/stats.json:', JSON.stringify({ ...data, oss: Object.keys(oss).length + ' repos', langs: data.langs.length + ' langs' }));
