# Display-resolution frontend badge replacements

This is an explicit modern-display adaptation, not recovered higher-resolution
original menu art. The original 54×89 Bullfrog and 48×60 QSound bodies remain the
fallback. Original placement, separate trademark marks, native menu background and
pointer input geometry are preserved.

## Source and rights boundaries

Exact input/output hashes and source URLs are in `frontend-badge-vectors.json`.
QSound's 33-path SVG comes from Wikimedia Commons, whose source is the official
QSound corporate brochure (https://qsound.com/library/CorporateBrochure_v3-3W.pdf).
The source review verified vector drawings in brochure page 3. Commons describes
this as PD-textlogo; this is that site's assessment, not independent legal clearance.
Trademark restrictions remain.

Bullfrog's five-path SVG is from English Wikipedia. Its file page documents a
German Wikipedia reconstruction cleaned in Inkscape from a scanned Populous 2 PDF
manual. It is **not an official vector master**. The page uses a **non-free logo
rationale**, not a Creative Commons/free-license grant. No broader permission or
license is inferred here. The user approved this visual direction after this
provenance distinction was disclosed.

`sanitize-frontend-badge-vectors.py` accepts only the hash-identified inputs. It
retains path geometry, transforms, solid styles and internal clipping, drops editor
metadata and all other elements/attributes, and checks deterministic output hashes.
No scripts, raster images, fonts, event handlers, animation or external references
are present in the shipped SVGs. No AI upscaling or redrawing was used.

## Rendering and glow limits

The browser renders the original SVG paths directly at effective display/DPR scale
using aspect-preserving containment in the original boxes. Opaque white/black
backings hide the old body. Session preparation decodes both independently; failure
or deadline selects a stable native fallback, including after a late decode. A DOM
image error also falls back to the original body. Menu reopen never decodes assets.

The existing small canvas is reused for the native trademark/one-pixel guard. With
a ready vector its body contains only light coverage derived from each native
cursor-mask row's palette response to black. Footprint, frame cadence, pointer
coordinates and keyboard cessation remain native. Alpha-compositing that light
over antialiased vectors is a **modern adaptation**, not indexed-palette pixel
parity. The native fallback still uses the original composed RGBA unchanged.
There is no new timer, animation-frame loop or per-frame high-resolution raster.
