# Bounded Shaman death presentation (#30)

## Selection and ownership

Worker5 started from fetched main `4897ea93833b5062aabc357a9aa54787f150c44e`
in a fresh isolated worktree. This slice corrects **only** model-12's frozen
rising-spirit frame and hidden wait. It does not add an invented death flash or
claim to complete all of #30. Worship acquisition, model149 and #22 are separate.

The TypeScript change is `app/shaman-death-vfx.ts` and its one guarded caller in
`app/scene-effects.ts`. No producer, unit death, outcome, reincarnation timing,
spawn eligibility, RNG, camera or importer code changes. Original source360 and
all tribe body/direction artwork already exist in `app/original-units.json`, so
no importer output is needed. The existing ordinary short Shaman death event
remains suppressed while its model-12 body/spirit is present; no second emitter
is added, and non-reincarnating deaths retain their previous behavior.

## Reused evidence, before editing

Read the earlier `worship-acquisition-vfx.md` note from the separate #30 worktree,
`decomp/README.md`'s **2026-09-12 — shaman reincarnation lifecycle** entry,
`scripts/check-native-reincarnation.py`, and the retained `reincarnation-native`
exports `00502910.c`, `005029d0.c`, `004d5fe0.c`, `0050c830.c`. No fresh Ghidra
export was required. The old native checker intercepted the object setter;
therefore it did not prove the final-frame selection or hide flag used here.

The new evidence-only probe passed **before runtime edits**, executing the
original producer, initializer, phase controller, object setter and frozen-frame
animation visitor: 12 trigger/gate cases and 3,196 phase visits. Allocation,
registration, terrain predicates, audio and subsequent gameplay leaves are
supplied by the probe. This is bounded CPU evidence, not an original-game replay.

Pinned original inputs:

| Input | SHA-256 |
| --- | --- |
| d3dpoptb.exe | `3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f` |
| vstart-0.ani | `64a8975f234aa67eafc4d4d9edd7cc4aeba9f5743d028d8203e0c67ca199a1aa` |
| vfra-0.ani | `c91720da3c636fb74cb749c5f8747ae884c1d76dbeed4b845f5a199ef1a55258` |

## Original contract and comparison

`004d5cf0` allocates **class10/model12** for an eligible ordinary Shaman death,
after its death-state delay reaches zero. It carries owner and the actual death
coordinate (`person+0x3d`), not the reincarnation site. The probe checks all four
owners, a nonzero delay and the no-reincarnation flag. Multiplayer limited-life
branches are outside this probe. `00500a30` dispatches its initializer to
`00502910`; `00500e20`/`00500ec0` dispatch the model-12 controller `005029d0`.

`00502910` copies the source Shaman's heading and owner. Supported land death
starts phase0; unsupported/drowning entry starts phase3. Existing browser
eligibility additionally requires surviving followers; it is deliberately not
changed by this presentation patch.

| Controller phase | Original presentation | Native visits |
| --- | --- | ---: |
| 0 | Body source680; the renderer adds tribe*8 | 4 |
| 1 | Shared spirit source352, original owner-layer filtering | 128 |
| 2 | Shared transition source360 | 3 |
| 3 | Source360 **last frame**, frozen; death x/y/heading, height rises40 each visit | 32 |
| 4 | **Hidden**, flag0x10; remains at ground+1280 while waiting | 300 |
| 5 | Existing spawn/retry/delete controller | unchanged |

The original VSTART/VFRA chains give 8/1/10 frames for sources680/352/360;
the checker independently walks those chains and checks every imported direction.
Phase3 sets render flags0x6002 and frame counter `frameCount(360)-1`, namely9.
The original `004ee7b0` animation visitor cannot advance it because flag2 freezes
it. Native height after32 visits is ground+1280; the browser's existing conversion
is native height/45. Neither anchor nor height calculation is changed here.

Before this patch the model-12 scene branch always passed age0 with no explicit
frame to `animatePerson`, thus selecting frame0 during rise, and never hid the
phase4 group. The new helper supplies frame9 from the existing imported count and
`visible = phase < 4`; the caller applies it without touching simulation state.
Body/transition frame0 behavior is intentionally left unchanged: `004a4960` calls
`004ee770` in the separate draw loop, so matching their full animation cadence
would require additional scheduler evidence outside this bounded slice.

Do not mistake the model-12 carried-resource field for an extra death flash.
Phase2's conditional model65 is an unsupported-terrain splash; later model8 is
located at the reincarnation site. Neither is added or broadened here. `004d5fe0`
handles death bookkeeping/mana, not an omitted generic death-site VFX emitter.

## Reproduction and limits

```sh
node --test tests/shaman-death-vfx.test.mjs tests/shaman-appearance.test.mjs
python scripts/check-native-shaman-death-vfx.py /path/to/d3dpoptb.exe --data-dir /path/to/data
# Add --evidence-only to execute original evidence without comparing TypeScript.
# With an owned development server (use the shared queue supervisor):
node scripts/check-browser-shaman-death-vfx.mjs
```

The browser checker loads authored Mission2 through the shipped mission UI,
skips the introduction, selects its real Shaman with H, and submits a normal
attack command against authored Matak warrior13. Ordinary movement/combat/ticks
must injure and kill the Shaman; it does not set HP, teleport, inject entities or
effects, disable AI, alter timers or force an outcome. The attack target is a
normal command API adapter, not a claimed pointer/picking test. Simulation pacing
and camera focus are test-controlled.

It checks a single anchored body/spirit, source360's final frame, actual GPU pixel
contribution, 32 rise visits, hidden wait, repeated paused renders with unchanged
simulation/RNG/outcome/respawn state, checkpoint reconstruction remaining hidden,
and eventual effect/mesh cleanup plus ordinary respawn while still playing.
The first hidden capture is already one of300 wait visits; 299 additional wait
visits plus the spawn visit remain. An initial checker expectation of301 further
visits failed despite correct rendering/cleanup and was corrected to300 without
changing the game. Original clocks, rendering/sprite regressions and broad gameplay
checks remain separate gates; this note makes no full death-animation parity claim.
