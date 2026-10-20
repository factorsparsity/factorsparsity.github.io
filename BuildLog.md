# BuildLog

## 2026-10-20 — Deploy to factorsparsity.github.io

- The old `factorsparsity.github.io` repo (offline video gallery PWA) was renamed to `factorsparsity/video-gallery`
  and its Pages turned off. User wants it off factorsparsity entirely and will probably make it private, so it is
  also removed from the Noise section. Don't re-add it.
- This repo now is `factorsparsity/factorsparsity.github.io`, served by GitHub Pages from `main` at the root.
- `service-worker.js` is a kill switch for the old gallery's service worker on this origin. Without it, returning
  visitors keep getting the cached gallery. Safe to delete after a few months; don't reuse the path for a real SW
  without considering that.

## 2026-10-20 — Redesign: generative, dark, less literal

User feedback on v1 (light editorial page with a static Pareto chart, "Effects/Residuals" sections): "you took it
very literal", wanted "a really cool design". v1 replaced wholesale.

- Hero = full-screen canvas grid of dots, sizes drawn from Pareto(α = log 5 / log 4), i.e. the 80/20 index. The hero is
  240vh with a sticky stage; scroll progress raises a rank threshold so noise drops out and only the top 0.5%
  ("vital", accent orange) remain, then "These are the few." fades in. Cursor acts as a lens (grow + push + tint).
- Threshold uses ease-out `VITAL * (1 - (1-p)^3)`. Linear made the "these are the few" line appear while ~20% of
  dots were still visible.
- Bug found: vital dots must bypass the fade calculation (`f = 1`), otherwise at p=1 the threshold equals VITAL and
  they fade to near-zero.
- Live readout shows the actual sampled top-20% share. It varies per visit (heavy tail, n≈2k), usually 73–85%. That's
  honest, don't fake it to 80%.
- `.reveal` hiding is gated on `html.js` (set inline in head) so content isn't invisible if JS fails.
- Sections renamed Signal / Noise (plainer than Effects / Residuals).
- 240-MP is Anthony Caccese's project; the user is a contributor, not the author. Their contributions: HDHomeRun
  module, Music TV module, YouTube playlist shuffle, front panel (in progress). Shown as a "channel list"
  (CH 03/04/05, AUX) since 240-MP calls modules inputs on a VHS deck. Keep authorship credit explicit.
- 240-MP row has a CRT hover (scanlines, RGB split, flicker) to match the project; other rows get an accent wipe.
- Verifying: Chrome extension wasn't connected. Headless `--screenshot` can't scroll, and an iframe harness gave
  false blanks (CSS `scroll-behavior: smooth` + virtual time). What worked: a small Node CDP script (Node 26 has a
  global WebSocket) that sets the viewport, scrolls with `behavior:'instant'`, dispatches mouse moves, and screenshots.
- Footer wordmark at 14.2vw fits "factor/sparsity" in one line; 19.5vw clipped it.
