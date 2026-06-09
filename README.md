# Sumit Jha — Portfolio

My personal portfolio website, live at **[isumit.in](https://isumit.in)**.

A modern, single-page site built in the **Anthropic / Claude design language** — warm cream
and ink tones, terracotta / blue / green accents, Poppins + Lora typography, minimal chrome,
and tasteful scroll animations with a light/dark theme toggle.

## Tech

- **Static HTML + CSS + JavaScript** — no framework, no build step
- **[GSAP](https://gsap.com/) + ScrollTrigger** — scroll-reveal & 3D animations (via CDN)
- **[Lenis](https://github.com/darkroomengineering/lenis)** — smooth scrolling (via CDN)
- **[Three.js](https://threejs.org/)** — ambient WebGL accent in the hero (via CDN, optional)
- **Google Fonts** — Poppins (headings), Lora (body), JetBrains Mono + Caveat (accents)
- **Live GitHub stats** — a daily GitHub Action writes a static JSON the page reads
  (see below); no runtime backend
- Progressive enhancement: all content renders without JavaScript, and
  `prefers-reduced-motion` is respected.

## Structure

```
.
├── index.html                     # the whole page (semantic, content inline)
├── assets/
│   ├── css/main.css               # design tokens, layout, components, animations, theming
│   ├── js/main.js                 # theme toggle, smooth scroll, reveals, counters, nav, 3D
│   └── data/stats.json            # generated GitHub stats (committed by CI; see below)
├── scripts/build-stats.mjs        # CI script that generates stats.json
├── .github/workflows/
│   └── github-stats.yml           # daily Action that runs the script + commits stats.json
├── images/                        # profile photo + certificate logos
├── Sumit_Jha_Resume.pdf           # downloadable CV
├── favicon.png · manifest.json · sitemap.xml · robots.txt
├── CNAME                          # custom domain (isumit.in)
└── .nojekyll                      # serve assets/ verbatim on GitHub Pages
```

## Sections

Hero · About · Experience · Skills · Projects · Open Source · Talks · Certificates ·
Education · Uses · Contact.

## Local development

No tooling required — just serve the folder:

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

## Live GitHub stats (no backend)

The Open Source / "Always shipping" sections show real numbers (commits, PRs,
contributions, lines of code, languages, contribution calendar) **including private
repos** — without any runtime server or exposing a token to visitors.

How it works:

1. **`.github/workflows/github-stats.yml`** runs daily (and on manual dispatch).
2. It runs **`scripts/build-stats.mjs`** with a secret token, which queries the
   GitHub API and writes **`assets/data/stats.json`**.
3. The workflow commits that file back to `main`. The browser just fetches the static
   JSON — no API calls or token in the client. If the file/token is missing, the page
   falls back to the public (public-only) GitHub API.

### Setup

- Add a repo secret **`GH_STATS_TOKEN`** (Settings → Secrets and variables → Actions).
- Use a **read-only, fine-grained PAT** — `Contents: Read` + `Metadata: Read`, all
  repositories, with an expiry. A read-only token can only *read* repos (incl. private
  code); it can't push, delete, or change settings.

### Security notes (public repo)

- The secret is encrypted and **masked in logs**; the script never prints it.
- Workflows triggered by **fork pull requests do not receive secrets**, and this
  workflow only runs on `schedule` / `workflow_dispatch` (not on PRs) — so a malicious
  PR editing the workflow can't read the token.
- **Do not merge untrusted PRs that touch `.github/` or `scripts/`**, and don't grant
  write access to people you don't trust — that's what protects the secret.
- `stats.json` contains only **aggregate numbers + public repo names + language names** —
  no private repo names, paths, or code.
- The daily commit is pushed by the ephemeral, repo-scoped `GITHUB_TOKEN`
  (`permissions: contents: write`), not the PAT. If you enable branch protection on
  `main`, allow this Action to bypass it (or the daily push will fail).

### Run locally

Production uses the GitHub Actions secret — no env file is committed. To regenerate
`stats.json` on your machine, pass a read-only token inline (or put it in a local,
gitignored `.env` with `GH_TOKEN=` / `GH_USER=`):

```bash
# needs `cloc` installed for the lines-of-code count
GH_TOKEN=<your-read-only-token> GH_USER=isumitjha node scripts/build-stats.mjs
```

## Deployment

Hosted on **GitHub Pages** from the `main` branch (repo root). Pushing to `main`
publishes automatically; the custom domain is configured via `CNAME`.

The daily stats workflow also pushes to `main`. It only triggers on `schedule` /
`workflow_dispatch` (never on `push`), so its own commit can't re-trigger it — and the
commit publishes through Pages normally so the live numbers stay current.

---

© Sumit Jha
