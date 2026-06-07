# Sumit Jha — Portfolio

My personal portfolio website, live at **[isumit.in](https://isumit.in)**.

A modern, single-page site built in the **Anthropic / Claude design language** — warm cream
and ink tones, terracotta / blue / green accents, Poppins + Lora typography, minimal chrome,
and tasteful scroll animations with a light/dark theme toggle.

## Tech

- **Static HTML + CSS + JavaScript** — no framework, no build step
- **[GSAP](https://gsap.com/) + ScrollTrigger** — scroll-reveal animations (via CDN)
- **[Lenis](https://github.com/darkroomengineering/lenis)** — smooth scrolling (via CDN)
- **Google Fonts** — Poppins (headings), Lora (body), JetBrains Mono (accents)
- Progressive enhancement: all content renders without JavaScript, and
  `prefers-reduced-motion` is respected.

## Structure

```
.
├── index.html            # the whole page (semantic, content inline)
├── assets/
│   ├── css/main.css      # design tokens, layout, components, animations, theming
│   └── js/main.js        # theme toggle, smooth scroll, reveals, counters, nav
├── images/               # profile photo + certificate logos
├── Sumit_Jha_Resume.pdf  # downloadable CV
├── favicon.png
├── CNAME                 # custom domain (isumit.in)
└── .nojekyll             # serve assets/ verbatim on GitHub Pages
```

## Sections

Hero · About · Experience · Skills · Projects · Open Source · Talks · Certificates ·
Education · Contact.

## Local development

No tooling required — just serve the folder:

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

## Deployment

Hosted on **GitHub Pages** from the `main` branch (repo root). Pushing to `main`
publishes automatically; the custom domain is configured via `CNAME`.

---

© Sumit Jha
