# Options before/after screenshots

> Historical PNG captures are [preserved unchanged at the pre-cleanup commit](https://github.com/JohnDeved/populous-new-dawn/tree/bc9cabf404240ad99b2aab8c26e9b0137cdd7702/references/ui-options). They are no longer tracked in the current checkout; the source-bound findings, image names and any recorded hashes below remain historical evidence.

Refs #457, #16 and PR #462. These are actual local browser screenshots of the
remake, not screenshots of the original game. Chrome Headless Shell154.0.8037.92,
sandbox enabled, software renderer; no hardware-performance or native full-frame
pixel-fidelity claim. Native static data provides layout/art evidence separately.

## Frontend, 640×480 CSS pixels

- [frontend-before-640x480.png](https://github.com/JohnDeved/populous-new-dawn/blob/bc9cabf404240ad99b2aab8c26e9b0137cdd7702/references/ui-options/frontend-before-640x480.png): actual clean main
  `7ae169bded39e826fd3122fe72dfc92fb5e6b7b8`, startup → Options. Old HTML panel.
- [frontend-after-640x480.png](https://github.com/JohnDeved/populous-new-dawn/blob/bc9cabf404240ad99b2aab8c26e9b0137cdd7702/references/ui-options/frontend-after-640x480.png): clean
  `219e76fbdb0fd8f41c5ffca9bae7e390713aa6a0`, startup → Options → Sound. Browser
  test changed Master/Music to20%/60%; these are test preferences, not claimed
  original defaults. Original category rows, separate original slider art, explicit
  unsupported quality and browser adaptation labels are visible.

## Battlefield, 1280×960 CSS pixels

- [ingame-before-1280x960.png](https://github.com/JohnDeved/populous-new-dawn/blob/bc9cabf404240ad99b2aab8c26e9b0137cdd7702/references/ui-options/ingame-before-1280x960.png): actual clean main
  `7ae169bded39e826fd3122fe72dfc92fb5e6b7b8`, Mission1 → Menu → Options. Original
  retained source filename said800×600, but PNG and actual viewport are1280×960.
- [ingame-after-1280x960.png](https://github.com/JohnDeved/populous-new-dawn/blob/bc9cabf404240ad99b2aab8c26e9b0137cdd7702/references/ui-options/ingame-after-1280x960.png): clean
  `29f6f58eeb54927638e1887047a33806903b9ae7`, same Mission1/menu entry. Native
  in-game F00T9 text/slider skin, full-alpha selected Sound and no frontend title
  or background. Test volumes35%/45%. Camera/intro capture moments differ; these
  are composition comparisons, not a pixel-diff or performance pair.

Subsequent production change219e76fb fixes body-focus keyboard ownership after
async audio operations. It does not alter these in-game pixels. Final runtime and
browser source-bound checks are listed in the linked PR; image provenance remains
the exact commits above.

## Retained raw receipts

- Clean-main pair: `/tmp/options457/before-retry/receipt.json`, passed.
- Frontend after: `/tmp/options457/frontend-final2/receipt.json`, passed.
- Battlefield after: `/tmp/options457/ingame-final1/receipt.json`, passed.
- Corrected native-size battlefield: `/tmp/options457/display640-1/receipt.json`,
  passed on b6e2e8ba, including actual settled-alpha assertions.

Earlier aggregate display attempts are retained as failed, not counted as full
passes: first large resize crashed the renderer, and later direct-start display
attempts crashed before Options during initial Mission1 canvas creation. Frontend
DPR2 is explicitly frontend evidence; it is not substituted for battlefield DPR2.
