# Original fullscreen startup menu: first browser slice

Refs #16, #457. Original EXE SHA-256
`3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f`.
This is static PE/data inspection, never original execution or a native screenshot.
The [raw static packet](frontend-menu-static/README.md) retains source tables and
bounded GNU objdump excerpts. Earlier rounded y coordinates and the conflation of
style 2 with glyph-bank 2 in the initial audit are explicitly superseded below.

## Source-to-browser path

- Frontend initialization `00458835` chooses bank 1 in resource table `005d71f0`.
  `00459940` loads 307,200 indexed background bytes and 1,024 palette bytes;
  `00459b39–57` applies the palette. Supplied `Febackg1.dat` and `fepal1.dat`
  produce the headdress/face, Bullfrog and QSound composition, not the loading mask.
- Main menu0 row order is New Game, Tutorial, Load Game, Multiplayer, Options,
  Rolling Demo, Credits, Coming Soon, Quit. `004c3290` initializes y coordinates
  `0x4aaa+n*0x1000`; integer conversion at 480px gives **139,169,…379**.
  Descriptor anchor fields are horizontal center and vertical top.
- Descriptor style2 is indirect: `005d5da8` is `[6,7,8,9,10,0]`.
  `004fe4b0` selects FEFT33WE normal / Fehi33we highlighted foreground sprites.
  These use palette RGB even though the normal artwork is dark. Glyph widths are
  native advances, index `character-0x20`. FEsd33WE is the separate shadow bank10.
- English title loader `00459b70` selects `felgspen.spr`: first279×101 frame at
  (181,10), adjacent11×6 trademark at(460,10). Shadow FELGsdEN294×111 has base(173,5).
- `00459d60` applies indexed fade: `fade[(mask<<8)|destinationIndex]`.
  Transparent runs preserve destination. `00459d00` offsets glyph shadows by
  pointer-relative signed right-shift5; title shadow uses the same parallax.
  Draw order: background, text shadows, title shadow, pointer glow, foreground
  text, foreground title; the ordinary pointer surface is separate.
- Fepointe is26×27 with hotspot(0,0), independently proved by `0045929d` and
  `004fd3e6–4d9`. It is direct palette artwork, not a world-target bracket.

`scripts/import-frontend.py` reuses the existing PSFB decoder but writes only its
named frontend outputs. Its metadata hashes every input. `composition.bin`
contains original background/palette/fade bytes plus decoded fade masks with255
as transparent sentinel. No broad HUD/level importer or unrelated asset is run.
`frontend-composition.ts` owns pure mask/reference-coordinate composition.
`OriginalMainMenu` supplies accessible HTML buttons over original sprite artwork.

## Shipped entry and adaptation boundaries

Startup still restores browser checkpoint availability before showing the main
menu. Main menu controls are explicitly exempted from the loading/input capture
blocker; all battlefield controls retain their readiness guards. New Game opens
the existing campaign selector. Tutorial and Load retain `beginLoad`, error and
Retry ownership. No campaign, AI, save format or simulation rule changes.

Uniform 4:3 scaling/pillarboxing, focus outlines, keyboard-accessible unavailable
rows, HTML fallback labels when font fetching fails and browser-tab Quit guidance
are deliberate modern adaptations. Unavailable multiplayer/demo/credits/preview
rows remain visible and inert with truthful reasons. Their dimming is not a claim
of original disabled-state parity. Browser volume options reuse existing persisted
preferences; they are not claimed as the full original options tree. Full native
intro sequencing, first-time Tutorial recommendation, profile/multi-slot loading,
world selector, pause/options hierarchy and other #457 surfaces remain separate.

## Pointer glow producer and timing

`004587a0` initializes frontend flags0x20, so the eight128×128 fade-mask glow
frames belong to normal startup. `00458d6d–dc1` detects changed pointer x/y and
restores0x20; keyboard/menu navigation clears it at `0045aa00`/`0045ab43`.
`004591ea–222` advances when time exceeds previous+100ms and wraps at frame count.
The browser uses101ms intervals while visible and in pointer mode, draws the mask
at pointer−64 before foreground artwork, hides it during keyboard navigation or
pointer leave, and restores it only after a real reference-coordinate change.
Reduced-motion users retain a static glow. Focus outlines and arrow-key navigation
are accessible HTML behavior. The platform cursor uses original Fepointe with
native0,0 hotspot and an automatic fallback if that image is unavailable; it stays
26×27 CSS pixels rather than scaling beyond browser custom-cursor size limits.
