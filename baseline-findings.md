# #214 fresh a53 raw-owner baseline

The single authorized ordinary Mission1 baseline **passed observation checks** on
clean `a53fa05587c4c1d363e3596162b41fcb9f26e3e8`. This is the old adapter baseline,
not repair acceptance. The exact accepted observer remains SHA256
`cb57bd7076cedb08b042b6f8ad843b088fc613ae6863f3fed3742944eb88a060`.

## Raw result

- All **2,079 native-person samples** have actual `flags3=0, stamp=0`; sampled
  owners are class1 Brave/model2 and Shaman/model7, with state19 and brief Brave
  state10. Natural opening includes **16 genuine native-backed walk samples**.
- Normal opening: **8.033 s**, **193 presentation visits / 96 logical turns**.
  Across adjacent sampled rows at the same World.turn, with the same Unit.id and
  source-owner identity/object/draw, **60 pairs advance f1/f2 and displayed frame**.
  Public resume adds **35** such pairs. Example: Brave13, model2, turn136,
  flags3=0, stamp=0, f2 advances 3→4.
- At shipped **2×**, **97 presentation visits / 97 logical turns** occur in
  4.0165 s, with no same-turn advances captured in this sample. Restored1× records
  48 presentation visits /24 turns. Counts describe captured observations; the
  independent RAF can omit intermediate visits and whole animation transitions.
- All paused/settings samples preserve turns, animation visits, raw animation
  fields and actual frame/UV selections. The ordinary settings close resumes
  play at the selected speed, confirmed from actual World values.

The offline checker reproduces those predicates. It verifies **2,079 displayed
frames** against the matching imported native direction cycle at f2 and **2,079
mesh draw values** against the raw source draw. **4,158 existing visible-layer UVs**
match their recorded imported atlas piece, with no mismatch. The95 same-turn
frame advances include15 observed layer changes; repeated artwork can retain
pieces/UV despite a changed frame number. A stricter stable-Shaman mode2 comparison
also finds13 same-turn advances, and every unaliased stable pair follows the
presentation delta modulo frame count. It is deliberately a baseline-only check.

Partial hut smoke is the only observed effect control: each opening root reaches
16 distinct sampled UVs and freezes while paused. Full hut smoke, Splash and
damage smoke are **not observed**. No fixture or fake effect was created.

## Reproduction and evidence

From this checkout, without dependencies or a browser:

`python3 work/orchestration/sprite-visit-ordinary-214/analyze-baseline.py`

Checker SHA256 `b1e64251b50ede16b866ddd136afc8a8ad89230aeb119797b5b5e40066fe0562`.
Raw observations SHA256
`fedcd4df53833bc4679a4c0ed7eeb0d49165da5fc85263a6ed2ce84625040a49`.
Analysis SHA256 `0736462cbc873b94870f49403159af7aa3e0613eeb05921447ec5f5fdd6fb81c`.

`baseline-command.json`, `launcher-receipt.json`, `baseline-terminal.json` and
`baseline-a53-raw-owners/receipt.json` retain exact source, command, inputs,
runtime, browser, diagnostics and terminal status. The raw rows, three PNGs and
offline attribution are under `baseline-a53-raw-owners/`. Opening and2× screenshots
were visually inspected: actual Mission1 island, followers and shipped HUD render.
There are no console errors. Retained warnings include software-WebGL fallback,
ReadPixels stalls and two texture-image warnings; this does not certify every
texture or hardware performance. No unsafe renderer/sandbox flag was enabled.

## Termination and resources

Original execution session **20513 exited0**. Outer/inner receipts passed after
89.845 s; exact source and all explicit input hashes stayed stable. The same
launcher namespace recorded IPv4/IPv6 port4374 closed before and after. The
reviewed harness closed its sandboxed official Chrome154 browser and stopped its
owned server before returning. CPUs0–3, a fresh private TMP and ephemeral context
were used; no profile, candidate or full gate was launched.

Dependency tree inode **925605** was moved back to `mission3-vault-hfx`, with
package/installed-lock hashes unchanged, donor prior clean status preserved and
the baseline's original dependency absence restored. Transfer/return receipts and
preserved installed-lock bytes exist at both ends. No resources remain held.
Native wall-clock and hardware-GPU claims remain excluded.
