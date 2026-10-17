# Pause-menu visual progress

> Historical PNG captures are [preserved unchanged at the pre-cleanup commit](https://github.com/JohnDeved/populous-new-dawn/tree/bc9cabf404240ad99b2aab8c26e9b0137cdd7702/references/ui-pause). They are no longer tracked in the current checkout; the source-bound findings, image names and any recorded hashes below remain historical evidence.

Both images are actual sandboxed Chrome 154 software-renderer captures of the
shipped Mission 1 UI at 640×480. This is a layout comparison, not a pixel-diff test;
world time and camera state are not pinned. Neither image is an original-game capture.

- [before-640x480.png](https://github.com/JohnDeved/populous-new-dawn/blob/bc9cabf404240ad99b2aab8c26e9b0137cdd7702/references/ui-pause/before-640x480.png): exact clean main
  `3f87f5f767fa6e9a08e6b853de18feaf0fa83b9e`, prior combined settings dialog.
- [after-640x480.png](https://github.com/JohnDeved/populous-new-dawn/blob/bc9cabf404240ad99b2aab8c26e9b0137cdd7702/references/ui-pause/after-640x480.png): exact clean feature head
  `9744e6e3cf8af307fac15b30bee03a30189ddef7`, F00T9 pause overlay over the battlefield.

The after capture proves visible progress only; it does not claim completed
interaction coverage, native entrance-fade/palette parity or hardware performance.
The original-row restoration and adaptations are described in
[the evidence note](../../decomp/research/original-pause-menu-browser.md).
