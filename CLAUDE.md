# CLAUDE.md — DontTouchMyPic

Privacy-first, **client-side only** image tools. The site is a static bundle
hosted on Cloudflare Pages. There is no backend; all image processing happens
in the browser via `heic2any` (libheif WASM), the Canvas API, and `JSZip`.

Sister site to **DontTouchMyDoc** (`../donttouchmydoc/`). Same brand family,
same design system (`global.css` was ported verbatim), same load-bearing
"nothing uploads" promise — applied to images instead of PDFs.

## The promise, load-bearing
Files never leave the user's device. If you're about to add anything that
uploads, fetches remote resources from inside the tool flow, or creates a
backend endpoint — **stop and check with the user first**. The copy, the CSP,
and the brand all depend on this staying true.

## Stack at a glance
- Astro 5 with `output: 'static'` and `compressHTML: true`
- Tailwind v4 via `@tailwindcss/vite` (pinned to `~4.1.14`; Tailwind 4.2 pulls
  Vite 8 which needs Node ≥20.19 — upgrade both together)
- `heic2any` for HEIC → other-format decoding (libheif compiled to WASM)
- Canvas 2D for re-encoding to JPG/PNG and (planned) for adjustments
- `JSZip` for packing batch outputs into a single download
- Sitemap via `@astrojs/sitemap`
- `vite.worker.format: 'es'` is set in anticipation of moving heavy decoding
  off the main thread; not used yet

## Commands
- `npm run dev` — dev server (http://localhost:4321)
- `npm run build` — static build into `./dist`
- `npm run preview` — serve the built `./dist`
- `npm run deploy` — build + `wrangler pages deploy ./dist --project-name=donttouchmypic`
  (manual fallback; day-to-day deploys go via GitHub Actions on push to `main`
  — but see "Deploy status" below)

## Routes
**Live now:** `/`, `/heic-to-jpg`, `/about`, plus sitemap + robots.

**Teased on the homepage as "coming soon" cards:** Convert, Compress, Resize,
Crop, Rotate. Each is a future page under its own URL once built.

## Architecture
- `src/layouts/BaseLayout.astro` — head, OG / JSON-LD, skip link, conditional
  AdSense + Cloudflare Analytics script injection. Mirrors the sibling.
- `src/components/` — shared UI: `Header`, `Footer`, `Hero`, `ToolGrid`,
  `Faq`, `HowItWorks`, `RelatedTools`, `PrivacyBadge`, `AdSlot`,
  `TrustSection`, `ToolHeader`. All ported from `donttouchmydoc` and
  re-skinned for image tooling.
- `src/components/tools/*.astro` — one component per tool. Each is a
  self-contained island with an inline `<script>` that lazy-imports `heic2any`
  / `jszip`. Only `HeicToJpgTool.astro` exists today.
- `src/lib/constants.ts` — `SITE_NAME`, `SITE_URL`, `SITE_TAGLINE`,
  `GITHUB_REPO`, `SIBLING_SITES`. Extracted from day one to avoid the
  three-places-hardcoded mess the sibling site had. **Keep adding here**
  rather than hardcoding URLs in components.
- `src/lib/format.ts` — `formatBytes`, `downloadBlob`, etc.
- `src/styles/global.css` — design system (paper/navy palette, `.strike-red`
  underline pattern, drop targets, file-list "stamp" rows). Imported verbatim
  from the sibling — keep them in sync where the visual language overlaps.
- `public/_headers` — Cloudflare Pages security headers + CSP.

### Layout quirk worth knowing
`html, body { overflow-x: clip }` is set globally to keep decorative elements
(marquee strips, ghost watermark) from leaking past the mobile viewport.
Don't replace with `overflow-x: hidden` — `clip` doesn't create a containing
block for `position: fixed`, which the header relies on.

## How this differs from DontTouchMyDoc
| Aspect | donttouchmydoc | donttouchmypic |
| --- | --- | --- |
| Heavy libs | `pdf-lib`, `pdfjs-dist`, `JSZip` | `heic2any` (libheif WASM), Canvas, `JSZip` |
| Manual chunks | `pdf-lib`, `pdfjs` | `heic2any` |
| Site constants | hardcoded in 3 places | extracted to `src/lib/constants.ts` from day one |
| Tools live | 6 (merge / split / organize / compress / redact / remove-line-numbers) | 1 (heic-to-jpg) + 5 teasers |
| Workflow | 6 commits, deploy live, repo public | repo public at NickPax/donttouchmypic, deploy live |

If a fix or refactor would benefit both sites (design tokens, CSP, security
headers, the `AdSlot` component, etc.) — flag it so we can mirror it across.

## Runtime feature flags (env vars, all `PUBLIC_*`)
All default to off. Same scheme as the sibling.

| Var                           | Purpose                                                   |
| ----------------------------- | --------------------------------------------------------- |
| `PUBLIC_ADS_ENABLED`          | `placeholder` shows dashed ad-slot stripes for dev; `true` renders real AdSense (also needs `PUBLIC_ADSENSE_CLIENT` + per-slot `slot=` props). |
| `PUBLIC_ADSENSE_CLIENT`       | `ca-pub-…` client id. Only read when `PUBLIC_ADS_ENABLED=true`. |
| `PUBLIC_CF_ANALYTICS_TOKEN`   | Cloudflare Web Analytics beacon token. Cookieless, no banner. |

`BaseLayout.astro` reads these via `import.meta.env`. With wrangler direct
upload, they only get baked in if passed inline at build time, e.g.:
```
PUBLIC_CF_ANALYTICS_TOKEN=<token> npm run deploy
```

## Deploy status (read this before assuming pushes ship)
- `.github/workflows/deploy.yml` is committed. It expects GitHub Secrets:
  `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`,
  `PUBLIC_CF_ANALYTICS_TOKEN`, `PUBLIC_ADS_ENABLED`, `PUBLIC_ADSENSE_CLIENT`.
  Whether those secrets are actually set in the repo is a separate
  question — check the Actions tab after a push to confirm a run started
  and went green before assuming a push has shipped.
- The remote is configured: `origin` points at
  `https://github.com/NickPax/donttouchmypic.git` (matches the URL
  hardcoded in `constants.ts` and referenced in homepage copy).
- Manual `npm run deploy` from a laptop with `wrangler login` is the
  reliable fallback path. Day-to-day pushes *should* trigger the
  workflow, but the wrangler path always works.
- The Cloudflare Pages project itself also needs to exist with the name
  `donttouchmypic` for `wrangler pages deploy` to succeed (it does).

## CSP
Defined in `public/_headers`. The load-bearing directive is
`connect-src 'self' https://cloudflareinsights.com;` — it browser-enforces
the "no uploads" promise. If a new tool needs an external fetch, the change
is significant: tell the user, and update the CSP at the same time.

Current allow-lists:
- script-src: `'self' 'unsafe-inline' https://static.cloudflareinsights.com`
- style-src: `'self' 'unsafe-inline'`
- img-src: `'self' data: blob:` (blob URLs are how we hand the user the
  converted JPG — don't tighten this)
- font-src: `'self' https://fonts.gstatic.com https://cdn.jsdelivr.net`
- connect-src: `'self' https://cloudflareinsights.com`
- worker-src: `'self' blob:` (heic2any spawns its libheif worker from a blob)
- When ads go live, script-src needs `https://pagead2.googlesyndication.com`
  and connect / frame need `https://*.doubleclick.net` etc.

## Adding a new tool — the recipe
1. `src/components/tools/NewTool.astro` — self-contained island, inline
   `<script>` with lazy imports, uses the existing `drop-target`, `bar`,
   `stamp` etc. classes from `global.css`.
2. `src/pages/new-tool.astro` — wraps the tool with `BaseLayout`,
   `ToolHeader`, `HowItWorks`, `Faq`, `RelatedTools`, `AdSlot`s.
   Include FAQ + WebApplication JSON-LD schema.
3. Add the route to `Header.astro`, `Footer.astro`, `Hero.astro` quick-jump,
   `ToolGrid.astro`, and extend the `current` type in `RelatedTools.astro`.
4. If the tool uses a new heavy library, add it to `astro.config.mjs`
   (`vite.optimizeDeps.include` and a `manualChunks` entry).
5. Rebuild, hit the route, push.

## Planned features (not yet built)
- **Preview + adjustments on tool pages** — show the converted image in the
  tab and offer brightness / contrast / saturation / hue / crop / rotate
  controls before download. Must stay client-side: CSS `filter` for the live
  preview, baked into a canvas via `ctx.filter` at export. For batch jobs,
  apply to a downscaled preview, re-render at full-res only at export.
  Move heavy work to a Web Worker (config is already prepared:
  `vite.worker.format: 'es'`).
- The full tool suite (Convert, Compress, Resize, Crop, Rotate) — each is a
  homepage teaser today and needs its own page + tool component.

## Things I should not do without checking
- Adding any remote fetch inside a tool flow.
- Loosening the CSP (especially `connect-src`).
- Adding cookies, localStorage, or any persistence — the About page
  explicitly promises we don't.
- Replacing `overflow-x: clip` on `html, body` with `hidden` — see the
  layout-quirk note above.
- Diverging the design system from `donttouchmydoc` without reason — they
  share `global.css` and the tokens / `.strike-red` headline pattern on
  purpose.
- Hardcoding the site URL or GitHub URL in components — extend
  `src/lib/constants.ts` instead.
