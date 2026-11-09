# Original frontend Quit restoration evidence

> Historical run artifacts referenced below are [retained at the pre-cleanup commit](https://github.com/JohnDeved/populous-new-dawn/tree/bc9cabf404240ad99b2aab8c26e9b0137cdd7702/evidence/frontend-quit-20261016), not in the current checkout. Source probes, fixtures, and findings remain tracked where applicable.

Refs #457. This bounded change restores original menu1 presentation while making
browser limitations explicit. It adds no native exit equivalent and no gameplay
parity credit.

## What changed

- Original low-font `Quit?` at (320,159); normal/highlight `Yes`, `No`, `Back` at
  (320,189), (320,219), (320,454). Existing frontend background/title/cursor,
  pointer-dependent fade shadows and uniform scaling remain.
- The invented bordered Quit panel is removed. Yes is natively disabled and has
  one visible 0.5 label fade. Permanent browser guidance explains close-tab exit
  and qualifies checkpoint persistence.
- No, Back and Escape use the existing main-menu back handler and restore Quit
  focus. Escape prevents browser-native modal dismissal before taking that route;
  repeated native cancel requests previously hid the entire frontend.
- Store/save rules, in-game Quit, game scenes, campaign/AI, assets, hosting config
  and parity records are unchanged.

## Original-byte proof

See [the native research note](../../decomp/research/frontend-quit-menu/README.md) and its SHA-locked PE/language
reader. The retained descriptors, render flags and finite disassembly support
menu1 composition and its callbacks. No original executable was run, and no
native full-frame screenshot or complete process-exit equivalence is claimed.
The frontend labels are distinct from in-game menu19's `Quit Game?`.

## Source-bound browser evidence

Actual production Home, CSS, store and original assets are mounted through a
plain React/Vite entry. Vinext/Cloudflare/RSC bootstrap and hydration are not exercised here.
The canonical production build separately validates production compilation and
build completion, not deployed bootstrap or hydration.
Chrome Headless Shell 154.0.8037.92 runs sandboxed; this is rendered frontend/Canvas2D
verification, not hardware-frame performance evidence.

- Baseline `0d2ad770ed03f6d049b01bd71176f954a6e4e044`: six comparable captures.
- Full functional suite `a336fa0d10263c889ce7333bce47420a988aeb7f`: native, double,
  wide, ultrawide, short and actual DPR2; No/Back/Enter/Space/Escape and focus;
  disabled Yes inertness; unchanged navigation/storage; no world construction;
  pointer glow, pointer-leave, keyboard and reduced-motion ownership; Options
  Sound reentry; real low/normal/highlight/composition request failures.
- The same source passed 12 rapid Quit/Escape cycles and 3 nested Options Browser-help
  Escape cycles, preserving the native dialog and the correct inner return focus.
- Affected-only replay `38c37e9d569b84b6b663b5e8e3b3eed77365c57b`: the sole extra
  runtime change is one disabled-button opacity override. Native/wide/short/actual
  DPR2 and normal/highlight fallbacks prove button 1 × label 0.5 opacity, legibility,
  inert pointer/DOM/Enter/Space behavior, actual Tab skipping, and repeated Escape.
- Frozen validation candidate `927fd7cbaa757c45a2f629700757e5d72e3c96f4` adds only
  the retained regression scripts after that CSS repair. Its app/public bytes
  match the affected replay. The updated complete browser scenario is preserved
  but has not been rerun wholesale: unchanged full assertions and new opacity/Space
  assertions retain the separate source/run identities above.

The storage-failure case invokes the observed real store.saveCheckpoint API after
actual IndexedDB open failures: persisted=false while hasCheckpoint=true. This is
supplemental setup for truthful Quit wording, not in-game Save UI evidence. Opening
or canceling Quit makes no new persistence attempt and preserves the session-only
checkpoint. Fresh fallback contexts collect page errors; expected failed-request
console messages do not establish a universal console-clean claim.

## Images and retained attempts

The selected before/after pairs are `before-*` and `after-*` at 640×480,
1920×1080 and 900×360. Before images are from baseline 0d2ad770; final after/fallback
images are from 38c37e9d. Both are this remake in the same headless browser, not
original-game captures. `fallback-*` shows actual failed normal-font requests.

`browser-raw.tar.gz` retains raw source/input-bound receipts, executed scripts,
observations, failed attempts and diagnostics. `qa-summary.json` records each
separate run and `publication-manifest.json` lists every original hash and the
selected published subset. The full ultrawide/DPR PNG originals remain in the
retained audit directory; not every PNG is committed here.

Two old-source full runs failed during repeated Escape. A rapid diagnostic proved
native dialog.open=false after the third cycle, then the repaired twelve-cycle
run passed. The opacity repair also retains an initial scenario parse-error attempt
and its corrected fresh run. Neither application failures nor harness failures
are erased or relabeled as passes.

## Final validation

The frozen source is `927fd7cbaa757c45a2f629700757e5d72e3c96f4`. This publication
adds evidence only. `validation-summary.json` gives statuses;
`validation-927fd7cb.tar.gz` includes every raw gate/inventory receipt and stdout/
stderr, explicit input scripts, original excluded attempt, quality baseline logs,
parser and two independent inventory audits. `validation-manifest.json` maps
portable archive members back to original paths and SHA-256 values.

- All 434 tracked test files: 2,795 passed; zero failed, skipped, canceled or todo.
  The clean ten-file recovery plus original batches 2–44 cover the exact inventory.
- Focused frontend checks: 13 passed. Changed TypeScript ESLint/format, TypeScript,
  parity and orchestration: passed. The standard check stages were decomposed into
  durable serial batches; the monolithic aggregate command was not rerun.
- Canonical Cloudflare production build on `927fd7cb`: successful. A fresh check
  for the evidence publication head remains visible in the PR status.
- Broad ESLint, Oxlint, formatting and unused analysis remain **failed**, exit 1,
  due to existing findings. ESLint has 401 (392 errors/9 warnings), Oxlint 1,434
  (673 errors/761 warnings), with zero semantic additions/removals. Formatting
  still names only `app/viewport-bounds.ts`; displayed unused diagnostics/counts
  are unchanged. These are findings exits, not tool failures.
- Health and duplication commands pass, exit 0, with advisory changes retained:
  LOC +292; churn hotspots 1→2; refactoring targets 394→396; above-threshold
  2,704→2,709; duplicate groups 807→808, lines +12, affected files +2.
  Human Fallow output is truncated, so undisplayed findings are not claimed
  identical. All 1,258 tracked code inputs and quality configuration between
  the retained baseline receipt source and canonical base match exactly.

### Inventory orchestration qualification

The initial inventory runner was already loaded when a pre-inventory hold line was
added to its on-disk file. Original batch 1 correctly became invalidated and is
excluded even though its child tests returned zero. A distinct frozen-runner replay
passed all 61 tests in those exact ten files. Both attempts remain available.

Batches 2–44 ran the original loaded runner, SHA-256 `2275eb0e…92af8`, while their
receipt input fingerprints name the newer disk bytes, `06837d92…d5fe9`. The only
difference is the never-executed hold preamble; test arguments, receipt logic and
summary parsing are byte-identical. The retained variants, exact diff/time and
independent audits qualify those terminal results. A disk hash is not relabeled
as process-loaded identity. This is explicit semantic provenance, not a process
memory attestation.

## Review and limits

Independent source, visual, inventory and quality review found the Escape and
opacity issues above; both repairs passed targeted re-review. Final publication
head acceptance and its canonical build status are recorded on PR #469. The broad
issue remains open for further original UI work. This evidence claims frontend
presentation and browser consistency, not native process exit, gameplay parity,
deployed Vinext/RSC bootstrap or hydration, or hardware performance.
