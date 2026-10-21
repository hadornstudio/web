# Showroom 3D models — from a video of a piece to the showroom

The showroom (`/showroom`) hangs each piece on its own plinth as a 3D model. Visitors walk up to it, tap
**Look closer in 3D**, then drag to turn it and scroll/pinch to zoom. Once *any* gallery item has a model, the
showroom shows only the items that have one; until then it falls back to the gallery photos.

## 1. Filming a piece (this decides the quality)

- Put the piece on a **mannequin or dress form**, or hang it so it **cannot sway**. Plain background, nothing else in shot.
- **Soft, even light** (daylight from a big window, or two softboxes). No spotlights, no mirrors, no windows reflected in the beads.
- **4K, 60–90 seconds.** Walk slowly around it keeping it centred: one full circle at chest height, one low, one high.
- **Lock focus and exposure** (hold-to-lock on a phone) so brightness does not change between frames.
- Keep every frame sharp: slow movement, no digital zoom, no filters or stabilisation crop if you can avoid it.
- **One continuous orbit, no cuts.** Do not edit or splice the video, and do not mix close-ups into it; film close-ups
  separately if you want them. AI-generated or edited "product videos" cannot be captured: the dress is not the same object from frame to frame.
- Beads, sequins and sheer fabric are hard for any 3D capture. Expect to re-film a piece once; the first test video is
  the cheapest way to learn what works.

## 2. Turn the video into a splat

Fastest, on this Mac (about an hour for a one-minute video, free, nothing leaves the machine):

```bash
scripts/video-to-splat.sh "/path/to/video.mp4" capture-work/my-piece
```

It extracts frames, works out the camera positions (COLMAP), trains the splat (Brush) and converts it. Before training it
prints a **camera-path check**: if more than ~15% of the cameras sit at very different distances from the piece, the footage
is not one steady orbit of a rigid object and the result will look shredded, so re-film instead of waiting for training.
It needs `brew install ffmpeg colmap` and the Brush binary (github.com/ArthurBrussee/brush, release `brush-app-aarch64-apple-darwin`).

Or use a capture app instead:

Use any Gaussian-splat capture tool and export a **.ply** (or a **.splat**). Examples: Luma, Polycam, KIRI Engine (upload
the video in the app), or Brush / OpenSplat on a Mac (run locally, slower but private).

### No orbit video? Build it from a few studio photos

A handful of clean studio photos (one front, one back, one side, all full-length on a plain backdrop, same distance, plus
optional close-ups) can become a **solid 3D gown** instead of a scan. This is *sculpted from photos*, not photogrammetry: the
body is shaped from the three outlines and the photos are wrapped onto it, so it is accurate from the photographed angles
and a smooth estimate in between; the beads are painted on, not real relief. Pipeline (all local, in
`scripts/dress-from-photos/`):

1. Cut the gown out of each photo (macOS Vision): `scripts/dress-from-photos/mask.swift` (`swiftc -O mask.swift -o mask; ./mask photo.jpg mask.png`).
2. Optional detail: `align-closeup.mjs` / `refine-closeup.mjs` find where a zoomed close-up sits on the front photo.
3. `node scripts/dress-from-photos/build-dress.mjs photos-dir masks-dir out.glb` builds the GLB (front = `p6`, back = `p2`, side = `p4`
   facing image-left, close-up `p1`; edit the constants at the top for other photos).
4. Upload the `.glb` in the admin (File type: 3D mesh). It is lit by the photos themselves (unlit material), so it stays white.

## 3. Convert and clean it

```bash
node scripts/ply-to-splat.mjs capture.ply piece.splat --max 300000
```

This centres the piece, stands it on the floor, scales it to 1.7 m tall, removes floaters and keeps the 300,000 most visible
points (about 10 MB; fine on phones). Useful options: `--opacity 0.25` and `--max-size 0.08` (remove haze and oversized backdrop splats), `--up +y|-y|+z|-z|+x|-x` (which way is up in the capture, default `-y`),
`--height 1.5` (metres), `--radius 0.9` (cut away the room around the piece), `--max 600000` (more detail, bigger file).

A `.glb` mesh also works and needs no conversion.

## 4. Add it in the admin

Admin → Gallery → edit (or add) the item → **3D model**: upload the `.splat` / `.glb`, or paste an https link. The preview
uses the same viewer as the showroom; adjust **size**, **raise/lower** and the three **tilt/turn** sliders until it stands
upright on the plinth, then save. Uploads go to Cloudinary; if a large file is refused, host it anywhere that serves https and
paste the link.

## Notes

- Files from the converter are y-up and 1.7 m tall; raw files from other tools are not, so use the sliders.
- The viewer downloads the whole file before showing it (a 10 MB splat is a second or two on broadband).
- Only the piece you are standing at and its neighbours render live; the others load as you approach.
