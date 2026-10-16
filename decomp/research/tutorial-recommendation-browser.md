# Tutorial recommendation: browser implementation

Refs #16 and #457. This restores the retained first-time New Game branch with an
explicitly browser-local onboarding policy. It is not native profile persistence,
boot-to-click proof, a completed Tutorial playthrough, or exact native geometry.

## Accepted evidence

The existing `frontend-quit-menu/static-data.json` retains menu2 at005d9cd8,
list005d9b08, paragraph descriptor005d7674 and language entry519. The supplied text
is preserved verbatim, including “we recommended”. Paragraph style2/state0 uses
the same low font as the frontend Quit question. Its centered anchor is x320,
y159, width600 and line spacing30. Yes dispatches004c5a40 (the accepted Tutorial
entry), No dispatches004c3340 (the New Game continuation), and Back dispatches
004c3970. `original-menus.md` records New Game's conditional selection of menu2
when native flag00895daa bit0x40 is clear.

The retained paragraph renderer calls descriptor+0x28 after rendering and passes
the final line's y plus its line spacing. Menu2 supplies callback004c5b20, unlike
Quit's null callback. Its body and effects are not present in the inspected
accepted evidence. Therefore the descriptor's initial Yes189/No219 positions are
not treated as final native layout. No new disassembly or native execution was
performed for this change.

## Explicit browser adaptations

- Greedy word wrapping uses the installed frontend glyph widths and the supported
  600px paragraph width. Five lines occupy y159,189,219,249,279. Foreground and
  indexed shadows share these exact rows.
- Yes and No follow at y309 and339; Back retains y454. Final action placement and
  wrapping are browser adaptations, not recovered callback equivalence.
- The recommendation opens only when New Game is selected, not automatically on
  startup. Direct Tutorial remains unchanged. Yes uses its existing loader;
  No opens the existing campaign selector. Neither bypasses asset readiness.
- A separate key `populous-tutorial-recommendation-v1` stores `answered` only
  after explicit Yes or No. Back/Escape does not write it. This is independent
  from checkpoints and campaign progress and does not claim native flag parity.
- Blocked storage safely retains an in-memory answer for this page lifetime.
  Reload without a successful storage write may show the recommendation again.
  Clearing browser storage likewise permits a new recommendation next page load.
- Back has initial focus; returning to main restores New Game focus. Existing
  dialog cancellation is retained. Repeated choice activation is guarded.

## Verification status

Focused unit/source-callback tests cover source identity, adapted geometry, glyph
width equality, browser-local storage errors, cancellation and duplicate choice
activation. These tests do not replace actual DOM, focus or loading acceptance.
Browser validation and full hosted CI remain pending. Issue16 and umbrella457
remain open; the paragraph callback and native persistence equivalence remain
explicit evidence gaps.
