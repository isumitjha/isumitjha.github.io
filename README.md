# Sumit Jha — Portfolio

My personal portfolio website, live at **[isumit.in](https://isumit.in)**.

A modern, single-page site with a warm, minimal editorial aesthetic — cream and ink tones,
terracotta / blue / green accents, Poppins + Lora typography, and tasteful scroll/3D
animations with a light/dark theme toggle.

## Tech

- Static **HTML + CSS + JavaScript** — no framework, no build step
- **GSAP + ScrollTrigger** (animations), **Lenis** (smooth scroll), **Three.js** (hero accent)
- Progressive enhancement: renders without JavaScript, and `prefers-reduced-motion` is respected

## Sections

Hero · About · Experience · Skills · Projects · Open Source · Talks · Certificates ·
Education · Uses · Contact.

## Local development

No tooling required — just serve the folder:

```bash
python3 -m http.server 8000   # then open http://localhost:8000
```

## Deployment

Hosted on **GitHub Pages** from `main` (repo root); the custom domain is set via `CNAME`.

---

© Sumit Jha
