// Builds assets/data/stats.json with aggregated GitHub stats (public + private).
// Runs in GitHub Actions with a secret token — the token never reaches the browser.
// Requires: a classic PAT with `repo` + `read:user` scopes in secret GH_STATS_TOKEN.
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

// --- account info ---
const u = (await gql(`query($l:String!){user(login:$l){createdAt followers{totalCount}}}`, { l: USER })).user;
const startYear = new Date(u.createdAt).getFullYear();
const thisYear = new Date().getUTCFullYear();

// --- lifetime contributions incl. private (sum per-year contribution windows) ---
let commits = 0;
for (let y = startYear; y <= thisYear; y++) {
  const d = await gql(
    `query($l:String!,$f:DateTime!,$t:DateTime!){user(login:$l){contributionsCollection(from:$f,to:$t){totalCommitContributions restrictedContributionsCount}}}`,
    { l: USER, f: `${y}-01-01T00:00:00Z`, t: `${y}-12-31T23:59:59Z` }
  );
  const c = d.user.contributionsCollection;
  commits += c.totalCommitContributions + c.restrictedContributionsCount;
}

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
const publicRepos = repos.filter(r => !r.private).length;
const stars = repos.reduce((s, r) => s + (r.stargazers_count || 0), 0);

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
const langs = Object.entries(langBytes).sort((a, b) => b[1] - a[1]).slice(0, 6)
  .map(([name, bytes]) => ({ name, pct: +(bytes / totalBytes * 100).toFixed(1) }));
const topLang = langs[0]?.name || '—';

// --- top public repos by stars ---
const top = repos.filter(r => !r.private && !r.fork)
  .sort((a, b) => b.stargazers_count - a.stargazers_count).slice(0, 4)
  .map(r => ({ name: r.name, html_url: r.html_url, stargazers_count: r.stargazers_count, language: r.language }));

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

const data = {
  generatedAt: new Date().toISOString(),
  commits, prs, merged, issues,
  public_repos: publicRepos, repos: repos.length, stars,
  followers: u.followers.totalCount, topLang, loc, langs, top
};
mkdirSync('assets/data', { recursive: true });
writeFileSync('assets/data/stats.json', JSON.stringify(data, null, 2) + '\n');
console.log('Wrote assets/data/stats.json:', data);
