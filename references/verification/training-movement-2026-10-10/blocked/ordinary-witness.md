# Issue 29: composed ordinary training-entry diagnostic

## Result and acceptance boundary

On clean candidate `ebe803d4d54cbd1b45041e2d9b271d94c0096a9f`, the ordinary Mission 3 Warrior Training Hut route still has **five simultaneously outside people in entry substate 5** and a **three-person same-turn admission**. The symptom is not resolved by this candidate. Five-person occupancy and the full acyclic overflow queue pass the route assertions.

This is a successful diagnostic witness, **not shipping acceptance**. The parent independently reports the unchanged Mission 2 population gate still fails (candidate Matak population 5 versus older base 14). No full check, build, native original execution, production edit, publication, or new service was performed here. The parent-reported controlled-fixture maximum of four is a different workload; the actual ordinary rendered route here measured five.

## Source and run identity

- Root: `/workspace/scratch/69fd8163d94e/training-movement-composition-20261010`.
- Clean commit: `ebe803d4d54cbd1b45041e2d9b271d94c0096a9f`.
- Tree: `15262d5d45b7df056c8ab71ecd5fab528133f60d`.
- Before/after source fingerprint, identical: `d1459437af14d718437197e372b58b94cef5199d7709dc35e4a32c23d45c8aa4`.
- Exact copied checker SHA256: `2cd40f38937ac00eaa02f8b7a2568923586ed051f36412323bd653867de91a63`. It is byte-identical to the previous guard candidate's ordinary screencast checker.
- Run: 2026-10-10 21:40:14.789Z–21:42:35.639Z.
- `composed1/receipt.json`: passed. `composed1-exit-code.txt`: 0.
- Node v24.19.0, Playwright 1.63.0, official sandboxed Chrome Headless Shell 154.0.8037.92. Renderer: ANGLE/Vulkan SwiftShader. Viewport 1440×1000, game canvas 1240×1000 at x=200. No unsafe-sandbox/SwiftShader switches.
- Full hashes of runtime/input scripts, browser binary, and installed lock are retained in `preflight.json`.
- The ignored output folder was new; the prior candidate checkout was read only. The old `training-entry-phase-fix` scope and unknown old processes were not touched.

Command (also in `command.txt` and the retained `run-witness.sh`):

```sh
node scripts/local-render/harness.mjs --game-root "$PWD" --browser /workspace/scratch/69fd8163d94e/recovery-20261010b/browser/chrome-headless-shell-linux64/chrome-headless-shell --port 4194 --timeout 510000 --scenario "$PWD/work/issue29-composed-browser/ordinary-m3-screencast.mjs" --output "$PWD/work/issue29-composed-browser/composed1"
```

Raw stdout/stderr: `composed1-command.log`. Raw simulation observations and ordinary input proof: `composed1/ordinary-m3.json`. Derived machine-readable timeline and frame correlation: `composed1/entry-summary.json`, produced by retained `summarize.mjs`.

## Ordinary route and input proof

1. Shipped All missions → Mission 3 → Skip introduction. Startup supplies 12 Braves and one Shaman.
2. Ordinary HUD Ctrl-click selects builders 312, 309, 519, 513, 300.
3. A detached-copy placement validator finds a legal real-pointer placement. Shipped Buildings / Warrior Training Hut controls place building 1022 at turn 173, x=36.703125, z=97.078125.
4. Ordinary timber hauling/building reaches progress=1 at turn 947, with eight logs. No units, resources, terrain, counters, simulation turns, storage, or camera state are injected.
5. Two HUD Ctrl-clicks select exactly ten Braves: 312, 309, 519, 516, 513, 510, 300, 507, 306, 589. Ordinary minimap input prepares the camera.
6. Real pointerdown/up at (825,385), turn 1068, are trusted, canvas-owned/targeted, button 0, with no modifier keys. Actual picking resolves building 1022; all ten selected people receive the actual training order and work target 1022.

The scenario uses actual RAF and shipped pause/resume buttons for screenshots. Its after-turn diagnostic copies state after chaining the prior callback exactly once with the same receiver/return; it restores its own hook. No direct model command or turn stepping occurs. Pointer observer, turn observer and screencast report no errors; no browser page/console errors occur.

## Exact counts and admission chronology

There are 84 adjacent after-turn snapshots from 1064 through 1147, with no gaps. Outside means `inside === null && entry.person.substate === 5`; it does not mean the hut's entering counter. Residents are separately selected people whose actual `inside` equals 1022.

At turn 1081:
- Outside substate 5: **5**, IDs 312, 309, 519, 513, 300.
- Actual residents: **0**.
- Hut entering: 5; hut inside: 0.
- All ten selected person counters: 57.

Actual outside-to-resident transitions between adjacent turns:

| Turn | New residents | Count | Counter |
| --- | --- | --- | --- |
| 1094 | 312 | 1 | 70 |
| 1098 | 519, 513, 300 | **3** | 74 |
| 1100 | 309 | 1 | 76 |

Terminal turn 1147 has exactly five actual residents: 312, 309, 519, 513, 300. Occupant slots contain exactly those IDs. Every other selected person is outside with work=1022 and substate 3. The actual reservation chain is **507 → 516 → 306 → 510 → 589 → 0**, complete, unique and acyclic. The checker asserts all of this, rather than treating its timeout as success.

## Rendered evidence inspected

Twenty-five actual CDP PNG frames were captured, every third rendered frame, under a maximum of 96. Capture and turn wall clocks are correlated approximately, not instrumented into the exact same frame. In paused intervals the nearest turn timestamp can be more than a second away; the raw correlation retains this rather than assigning false precision.

Inspected files in `composed1/`:
- `ordinary-completed-warrior-hut.png`: completed hut and ordinary completion notice; public pause overlay.
- `entry-frame-002.png`: nearest copied turn 1084, 14ms difference, outside count 5 and zero residents in that nearest observation. The render shows selected-unit markers around/over the hut and the training-order notice.
- `entry-frame-004.png`: nearest copied turn 1092, 18ms difference, outside count 5 and zero residents in that nearest observation.
- `entry-frame-016.png`: nearest copied turn 1098, 24ms difference, four total residents and one remaining outside substate-5 person in that nearest observation. A building UI bubble is visible; its pixels must not be read as an exact counter synchronized to the turn snapshot.
- `ordinary-admitted-and-waiting.png`: final ordinary scene, full five-slot building UI bubble, remaining selected markers around the hut, and public pause overlay.

The camera views the far side of the hut, so roof/walls occlude much of the actual entry path. These pixels do **not** resolve all body silhouettes crossing the doorway, and no exact door-crossing pixel claim is made. The strong evidence is copied state and same-turn resident transitions reached by the retained ordinary input route, accompanied by actual rendered pixels.

## Comparable prior evidence and limits

`comparison-provenance.json` reads the retained baseline 50aefe1 and guard bd420fd receipts without rerunning either. All three routes placed building 1022 at the same x/z and used the same viewport, canvas and projection depth/scale. Camera pose is similar but not bit-identical: composed (11407,38694, angle1131); guard (11447,38679, angle1148); baseline (11424,38688, angle1138). The ordinary input timing and selected-person movement differ.

Baseline and guard each measured maximum outside count 5; guard also had a same-turn triple. This composed run reproduces those headline symptoms. These are not tightly paired timing/performance runs, so no worsening, speedup, smoothness, FPS, or hardware-GPU performance claim is justified. Direct Mission 3 access does not prove campaign unlocking. No original full-game execution, admission timeline, or original pixel parity was observed.

## Cleanup and stop condition

The owned harness session returned terminal exit 0. The reviewed harness awaits browser.close(), verifies the browser is disconnected, and stops only its own detached server process group before writing a passed receipt. The scenario confirms observer restored=true, screencast closed=true and no cleanup errors. The browser lane was released to the parent; there are no further browser runs in this task.

`cleanup.json` retains supplemental port/process observations and their limitation: independent tool calls can have separate PID/network scopes, so runner PID2 is not interpreted across calls. Cleanup evidence is the terminal owned session plus harness verified teardown, not cross-scope PID matching. No unknown process was stopped.
