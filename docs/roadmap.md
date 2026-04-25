# Roadmap

What's live, what's being built, and ideas worth exploring. Add to this file
rather than scattering ideas across commit messages or chat history.

## Live
- **HEIC → JPG** (`/heic-to-jpg`) — single-file or batch (zip). EXIF stripped
  on conversion. Uses `heic2any` (libheif WASM) + Canvas + JSZip.

## Building next
The five "coming soon" cards on the homepage. Order TBD; pick by whichever
has the cleanest client-side path and clearest search-intent keyword.

| Tool | URL | Implementation note |
| --- | --- | --- |
| Convert (PNG ↔ JPG ↔ WebP) | `/convert-image` | Pure Canvas re-encode. Simplest of the five. |
| Compress | `/compress-image` | Canvas `toBlob('image/jpeg', quality)` with quality slider; show before/after size. |
| Resize | `/resize-image` | Canvas drawImage at target dimensions, preserve aspect ratio toggle. |
| Crop | `/crop-image` | Click-and-drag selection over canvas, export the cropped region. |
| Rotate | `/rotate-image` | 90° steps + free rotation; canvas `translate` + `rotate`. |

## Cross-tool features (ideas backlog)
- **Preview + adjustments on tool pages.** Show the converted image in the
  tab and offer brightness / contrast / saturation / hue / exposure controls
  before download. Live preview via CSS `filter`, baked into a canvas via
  `ctx.filter` at export. For batch: apply to a downscaled preview, re-render
  at full-res only at export. Move heavy work to a Web Worker
  (`vite.worker.format: 'es'` already set in the Astro config in anticipation).
- **EXIF preservation toggle.** The homepage FAQ already promises this:
  "Future tools will make this optional so you can keep camera/time metadata
  but strip location, or keep everything." Default = strip everything (current
  behaviour), opt-in to keep selectively.
- **Drag-to-reorder for batch input** — already a pattern in the sibling's
  Organize PDF tool; lift the same UX.
- **PWA / installable** — the sibling doesn't do this either, but for an
  on-device tool it's a natural fit. Low priority until usage justifies it.

## Out of scope (load-bearing exclusions)
These are deliberately *not* on the roadmap and should stay off it without
explicit discussion. They contradict the brand promise.

- Server-side processing of any kind.
- Account / sign-up.
- Cloud sync / save to account.
- Watermarks on output.
- Any third-party script inside the tool flow beyond Cloudflare Analytics
  and (post-approval) AdSense around the tool.
