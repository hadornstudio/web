# HADORN 3D — Project Brief for Claude Code

> **How to use this file:** Put it in the root of the Hadorn project. Then tell Claude Code:
> `Read HADORN_3D_PLAN.md and start Phase 0.`
> Claude Code: treat this file as the source of truth for the 3D upgrade. Work one phase at a time,
> stop at the end of each phase for review, and keep the "Progress log" at the bottom up to date.

---

## 1. What we are building

Hadorn is my wife's online store. We are upgrading it into a 3D website with three new experiences,
added **on top of** the existing site (keep existing cart, checkout, product data, SEO and pages working).

1. **Home page "Step inside" scroll film** — a pinned, full-screen hero. Scrolling plays an AI-generated
   walkthrough video frame-by-frame (forward on scroll down, reverse on scroll up), with glass overlay
   cards and a final call-to-action. This is a 2.5D image-sequence technique, not real-time 3D.
2. **3D Store** — product pages get a real-time 3D viewer (rotate, zoom, AR on phones) and a
   **configurator** where customers change colours / materials / parts / add-ons, see the price update,
   and add the configured item to the existing cart.
3. **3D Showroom** — a virtual gallery room showing past work. Visitors move between "bays" by clicking
   floor markers or scrolling along a path. Each bay shows a past piece as a 3D model on a plinth OR its
   photos as large framed panels, with a story card.

### Reference
The home hero copies the technique in a reference video (a "Desert Residence" real-estate site):
1. Photos used as keyframes in Google Flow / Veo to generate one smooth ~15 s camera move, 1920×1080.
2. Video split into ~300 JPEG frames (20 fps).
3. Frames drawn to a `<canvas>`, scrubbed by scroll position; section pinned until the last frame.
4. Headline + button fade out when scrolling starts; glass cards appear at set frames
   (e.g. "KITCHEN — Modern kitchen"); last frame ends on a CTA button.
5. Iterated by leaving visual feedback on the live preview.

---

## 2. Rules for Claude Code

- **Phase 0 first.** Don't change anything until the audit is done and I've confirmed the plan.
- Work on a new git branch: `feature/3d-site`. Commit at the end of each phase with a clear message.
- **Don't redesign or break existing pages.** New features are self-contained components/pages.
- Match the existing brand (colours, fonts, spacing) — extract them from the current site in Phase 0.
- Every 3D feature must have a **fallback**: static image / photo gallery / "list view" when WebGL
  is unavailable, on very slow devices, or when `prefers-reduced-motion` is set.
- Mobile first: most customers are on phones and mobile data. Respect the performance budget (section 6).
- If an asset I need to provide is missing (video, frames, models, data), **stop and tell me exactly
  what to provide and where to put it** — don't invent placeholder content and call it finished.
  Placeholders are fine for building, but list them clearly.
- At the end of each phase: summarise what changed, how to preview it, and what I need to do next.

---

## 3. Tech stack (confirm in Phase 0)

| Piece | Preferred | If the site is not React |
|---|---|---|
| 3D engine | Three.js via React Three Fiber + @react-three/drei | Vanilla Three.js |
| Simple product viewer + AR | `<model-viewer>` (Google) | Same — works in any site |
| Scroll animation | GSAP + ScrollTrigger, Lenis smooth scroll | Same |
| Model format | `.glb` (glTF binary) | Same |
| Model compression | `@gltf-transform/cli` (meshopt + WebP/KTX2 textures) | Same |
| Configurator state | Zustand (or React state) | Small vanilla store module |
| Image processing | ffmpeg (frames), sharp/cwebp (WebP) | Same |

If Hadorn is Shopify / WooCommerce / WordPress, adapt: use theme sections or a plugin-free embed, keep
checkout native, and pass configurator choices as line-item properties / order meta.

---

## 4. Folder layout (adapt to the framework's conventions)

```
/assets-src/                 # raw inputs I provide — NOT shipped
  hero/main-film.mp4         # landscape walkthrough video
  hero/main-film-vertical.mp4
  models/*.glb               # raw models from AI tools / Blender
  showroom/room.glb          # gallery room model
  showroom/photos/*          # photos of past works
/public/hero/desktop/*.webp  # generated frames
/public/hero/mobile/*.webp
/public/models/*.glb         # compressed product models
/public/showroom/*           # compressed room + works + textures
/data/configurators/<product-slug>.json
/data/showroom.json
/scripts/extract-frames.(sh|js)
/scripts/compress-models.(sh|js)
```

---

## 5. Phases

### Phase 0 — Audit (no code changes)
Report:
- Framework + version, routing, how new pages are added, build + hosting setup.
- Where product data comes from, how products/variants are structured, how cart + checkout work,
  and how to attach custom options to a cart line.
- Brand tokens: colours, fonts, button styles.
- Where the hero, `/showroom` page, and product 3D viewer will plug in.
- Whether ffmpeg, Node, and Blender CLI are available on this machine.
- Final stack choice and a short list of packages to install.
**Stop and wait for my OK.**

### Phase 1 — Hero frames pipeline
- Write `/scripts/extract-frames` that takes the videos in `/assets-src/hero/` and outputs:
  - desktop: 1920px wide WebP, quality ~80, 24 fps → `/public/hero/desktop/frame_0001.webp`…
  - mobile (from vertical video if present, else centre-cropped): 1080px wide → `/public/hero/mobile/`
- Print frame counts and total sizes; warn if over budget and suggest fps/quality changes.
- If the video isn't there yet, tell me. (I'll generate it in Google Flow / Veo / Kling from 3–5 photos
  in visit order: exterior/brand backdrop → entrance → product displays → featured piece.)

### Phase 2 — Logo intro, reveal and scroll hero on the home page

**Brand assets (provided, in `/assets-src/brand/`)** — the brand is **Hadorn Studio**:
- `hadorn-mark.svg` — the circular "h" mark, 4 separate paths: `#mark-main`, `#mark-left`,
  `#mark-top-right`, `#mark-bottom`.
- `hadorn-wordmark.svg` — HADORN only, one path per letter: `#H #A #D #O #R #N`.
- `hadorn-wordmark-studio.svg` — HADORN + STUDIO, letters `#H…#N` and `#studio-S…#studio-O`.
- `hadorn-logo-full.svg` — mark above the spaced wordmark (`#mark-*`, `#word-H…#word-N`).
- All use `fill="currentColor"` — set colour with CSS `color`. Inline them (not `<img>`) so parts can animate.
- **Use these SVGs for every appearance of the name/logo. Never retype HADORN in a web font.**
- Supporting typography (taglines, body, buttons): a light geometric sans that matches the thin
  "STUDIO" letters — e.g. Jost or Outfit (weights 300–400), uppercase with wide tracking for small labels.
- Palette: near-black warm brown #14100c, ivory #f4ede1, soft gold #c9a45c (logo colour on dark), coral
  accent #c4553b used sparingly.

**2a. Logo intro (code, not video)** — plays once on first visit while hero frames preload
- Full-screen dark background (#14100c).
- The mark's 4 pieces start slightly apart and rotated (like beads before stringing), then glide and
  rotate into place to form the circle (staggered, ~1.2 s, ease-out-expo), in soft gold. A faint light
  sweep passes across the finished mark once.
- Below it, the wordmark **HADORN** (from `hadorn-wordmark-studio.svg`) rises letter by letter
  (staggered fade + 12px upward move), then **STUDIO** fades in with tracking tightening. ~1 s.
- Then the logo + wordmark fade and the screen opens (soft radial mask or a vertical split wipe)
  onto frame 1 of the hero (the dark bead curtain). Total intro ≤ 2.8 s.
- Skip button / click-to-skip; shown only once per session (sessionStorage, wrapped in try/catch);
  skipped entirely for `prefers-reduced-motion`. Never block the page longer than needed —
  if frames are ready early, intro still completes but doesn't extend.

**2b. Reveal** — the first part of the frame sequence is a Flow-generated shot of a bead curtain
(gold/coral/ivory strands) parting as the camera pushes through into the boutique. No code effect
needed beyond the scroll scrub — but the first ~8% of scroll should feel slow and deliberate.

**2c. Brand name on the hero (code overlay)**
- Large centred wordmark: inline `hadorn-wordmark-studio.svg` in ivory (or soft gold), width
  `clamp(260px, 70vw, 1100px)`. Small mark (`hadorn-mark.svg`, ~40px) in the site header.
- Small tagline above: "HANDCRAFTED BEADWORK · ATTIRE · ACCESSORIES" (configurable).
- One line + CTA below: "Made by hand, worn with pride." / "Shop the collection" (configurable).
- Appears when the bead curtain has parted (configurable scroll point, default ~10%), with a soft
  letter-by-letter rise.
- As scrolling continues, the wordmark slowly scales up (~1 → 1.4), letter-spacing widens and it fades out,
  so it feels like the camera walks through the name. Tagline/CTA fade out first.
- Subtle bottom gradient for legibility; no heavy boxes. Must look clean and premium at 375px wide.

**2d. Scroll hero**
- Full-screen `<canvas>` hero, pinned with ScrollTrigger until the last frame, then releases.
- Scroll down = forward, scroll up = reverse; smooth with Lenis; frame index eased, never skipping visibly.
- Preload first ~20 frames immediately, rest progressively; show frame 1 instantly (poster).
- Serve mobile frame set below 768px; handle resize; handle high-DPR canvas correctly.
- Overlays (text configurable in one config object):
  - Headline + subline + CTA visible at start, fade out as scroll begins.
  - Glass cards at configurable progress points, e.g. 15%, 45%, 75%: small label (uppercase),
    title, one line of text.
  - Final CTA at the end: "Shop the collection" → store page.
- `prefers-reduced-motion` / no-JS: static hero image with the same headline + CTA.
- Don't touch other home page sections.

### Phase 3 — 3D product viewer + configurator
**3a. Model pipeline**
- `/scripts/compress-models`: for every `.glb` in `/assets-src/models`, run gltf-transform
  (dedup, prune, meshopt or draco, textures → WebP max 2048px), output to `/public/models`,
  print before/after sizes, warn if > 3 MB.
- A validation script that lists each model's mesh names, material names, triangle count and
  bounding-box size, so I can check part names match the configurator JSON.

**3b. Viewer** (on product pages that have a model)
- Drag to rotate, scroll/pinch to zoom (with limits), auto-rotate until first interaction.
- Studio lighting: HDRI environment + soft contact shadow; neutral background matching brand.
- "View in your room" AR button on mobile (`<model-viewer>` AR, or USDZ/Scene Viewer fallback).
- Product photo shows while loading; photo gallery fallback if no WebGL or no model.
- Lazy-load the 3D canvas only when it scrolls into view.

**3c. Configurator**
- Reads `/data/configurators/<slug>.json` (schema below).
- Swatches per part change material colour/texture live; toggles show/hide add-on parts.
- Running price = base + option deltas, shown next to Add to Cart.
- Add to Cart passes all selections as line-item properties through the EXISTING cart flow;
  also capture a PNG snapshot of the configured model and attach/save it with the order if possible.
- Selected options reflected in the URL (`?Body=walnut&Fabric=sand`) so configs can be shared.

Configurator JSON schema:
```json
{
  "product": "example-slug",
  "model": "/models/example-slug.glb",
  "basePrice": 0,
  "currency": "NGN",
  "parts": [
    {
      "id": "Fabric",
      "label": "Fabric",
      "material": "Fabric",
      "options": [
        { "id": "sand",  "label": "Sand",  "color": "#d8c7a8", "priceDelta": 0 },
        { "id": "olive", "label": "Olive", "texture": "/textures/olive.webp", "priceDelta": 5000 }
      ]
    }
  ],
  "addons": [
    { "id": "engraving", "label": "Engraving plate", "mesh": "EngravingPlate", "priceDelta": 3000 }
  ]
}
```
(Currency is a placeholder — use whatever the store uses.)

### Phase 4 — 3D Showroom (`/showroom`)

**4a. Showroom opening (before the interactive 3D)**
- Title card (code, ~1.5 s): dark background, a thin gold line draws across the centre, then
  the Hadorn mark sits small above, and **THE GALLERY** (configurable) fades in in the Jost/Outfit
  supporting font, wide tracking, gold — HADORN itself always comes from the wordmark SVG,
  with a small subline "A collection of pieces we've made" (configurable). Skippable; reduced-motion = static.
- "Lights on" film: an image sequence from `/assets-src/showroom/intro.mp4` (run the Phase 1 frame script
  on it → `/public/showroom/intro/desktop|mobile`). A dark gallery hall where spotlights switch on one by one
  revealing beaded pieces. Scroll-scrubbed like the home hero, or auto-plays if the user doesn't scroll
  within 2 s.
- Hand-off: the last frame crossfades (~0.8 s) into the interactive 3D gallery, with the 3D camera starting
  at a matching viewpoint (centre of the hall, looking down it). Then show a hint:
  "Tap the floor lights to walk through" (desktop: "Click the floor lights or scroll to walk through").
- "Skip intro" link goes straight to the 3D gallery.

**4b. Interactive 3D gallery**
- Load the gallery room from `/public/showroom/room.glb` (lighting baked in Blender). If I don't have
  one yet, build a simple procedural placeholder room (floor, walls, 6–10 bays) so work can continue.
- Read `/data/showroom.json` (schema below). Place each work in a bay:
  - has `model` → on a plinth, slowly rotating or rotatable when in focus;
  - only photos → large framed panels (main photo + up to 2 smaller ones).
- Movement / gestures:
  - Glowing floor markers in front of each bay: click/tap → camera glides there (GSAP tween, ~1.2 s).
  - Drag (desktop) / swipe (mobile) to look around, with limits so users can't get lost.
  - Scroll / arrow keys → next / previous bay along a fixed path.
  - Pinch / wheel zoom on the focused piece.
- UI: story card for the focused bay (title, year, client, story, "Order something similar" CTA),
  rooms menu / mini-map, progress indicator ("3 / 12"), "View as list" link to a normal grid page.
- Optional intro: a short image-sequence film (Phase 1 technique) at the entrance before stepping in.
- Load the room + first 3 works first; stream the rest as the visitor approaches.

Showroom JSON schema:
```json
[
  {
    "id": "work-001",
    "title": "Example piece",
    "year": 2025,
    "client": "Optional",
    "story": "One or two sentences about this piece.",
    "images": ["/showroom/works/work-001-a.webp"],
    "model": "/showroom/works/work-001.glb",
    "cta": "/store"
  }
]
```

### Phase 5 — Performance, polish, launch
- Lazy-load every 3D canvas; dispose of geometries/textures on route change.
- Cap device pixel ratio at 1.5 on mobile; reduce shadow/HDRI quality on low-end devices.
- Lighthouse on home, a product page and showroom; report scores and per-page download size.
- Test on a mid-range Android and an iPhone (or emulate); fix anything under 50 fps.
- Check all fallbacks (no WebGL, reduced motion, slow 3G).
- SEO: product and showroom content still present as real HTML text.

---

## 6. Performance budget

| Asset | Target |
|---|---|
| Hero frames, mobile set | ≤ 8 MB total; first frame visible < 2 s |
| Hero frames, desktop set | ≤ 20 MB total, progressively loaded |
| One product model | ≤ 3 MB compressed; 30k–100k triangles |
| Showroom room + first 3 works | ≤ 10 MB before the visitor can move |
| Showroom work models | 10k–50k triangles each |
| Frame rate, mid-range Android | ≥ 50 fps |

---

## 7. Assets I (the owner) will provide

Making the 3D models and videos happens outside Claude Code. Here's how I'll prepare them:

- **Hero video:** Google Flow / Veo or Kling, 3–5 keyframe photos, prompt along the lines of:
  "Slow, steady cinematic dolly forward through the entrance into a warm, softly lit boutique showroom,
  camera glides past displayed pieces and settles on the featured item. Smooth, no cuts, no people,
  no shaking, consistent lighting." 10–20 s, 1920×1080 + a vertical 1080×1920 version.
- **Product models:** AI image-to-3D (Meshy / Tripo / Hyper3D Rodin / Hunyuan3D / TRELLIS) from clean
  photos (plain background, even light, several angles if possible), or a phone scan (Polycam / KIRI /
  Scaniverse) if the item exists. Cleaned in Blender: real scale, base on floor at origin, decimated,
  **customisable parts split into separate objects with named materials** (e.g. Body, Trim, Fabric, Handle).
- **Showroom room:** simple Blender gallery room with baked lighting, or a licensed model restyled.
- **Showroom content:** list of past works with title, year, story, photos (and models for the best ones).

---

## 8. Open questions (fill in before / during Phase 0)

- What does the store sell? → _______________________
- Which parts/options can customers change per product? → _______________________
- Store currency and how price options work today → _______________________
- Which 3–5 products get 3D first? → _______________________
- Home hero headline / CTA / card texts → _______________________
- How many past works in the showroom? Any with multiple photos? → _______________________

---

## 9. Progress log (Claude Code keeps this updated)

| Date | Phase | What was done | Waiting on |
|---|---|---|---|
| 2026-10-18 | Phase 0 | Audit delivered (React 19 + Vite 8 + Tailwind v4, Vercel, Mongo/Paystack; no ffmpeg, Blender.app present). Branch `feature/3d-site` created, plan + brand SVGs placed in repo. SVG ids verified against plan; `hadorn-wordmark.svg` clips the A's feet (viewBox height 260, path reaches 264) — fix with `overflow: visible`. | Owner's OK on open decisions (ffmpeg install, showroom data source, configurator in DB, frame hosting, model approach); hero video; showroom intro video |
| 2026-10-18 | Phase 1 | `scripts/extract-frames.js` (`npm run frames:hero` / `frames:showroom` from repo root; ffmpeg via `ffmpeg-static`, no system install). Hero: 192 frames, desktop 1280x720 18.5 MB (q62), mobile 404x720 7.3 MB. Showroom intro: 192 frames, desktop 6.4 MB, mobile 1.2 MB. Sources are 720p so frames are not upscaled; mobile is a centre-crop (no vertical film). Frames are gitignored until hosting is decided. | Owner's OK on open decisions; optional vertical 1080x1920 films for sharper phones |
