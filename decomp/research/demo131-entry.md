# LEVL2131: Face Off entry and conditional script requirement

**Observed and published September 17, 2026, Europe/Berlin.** This is original-content classification evidence for [PND01/U01](../../engineering/single-player-feasibility.md#7-accountable-owners-bounded-proofs-and-implementation-order), not network implementation. **Multiplayer remains excluded from implementation. Exclusive single-player/Rolling Demo inclusion or exclusion remains unresolved.** No scope exclusion, parity or whole-game acceptance follows from this note.

## Decision and consumed identity

The original level-name consumer calls LEVL2131 **Face Off**, not the stale HDR label “Demo level 4 ply”. Its conditional four-participant lobby selector leads, under the host/readiness/mode/initial-turn conditions below, to the **header-only loader `004854c0`**. That loader initializes empty programs and **does not request CPSCR130**. The proved package absence is therefore not a missing input for this branch; it is neither a failed CPSCR read nor a substitution with CPSCR122.

The ordinary single-player selector rejects 131, but that does not prove exclusive use. The separate **Rolling Demo** entry loads recorded snapshots; their source-map correspondence to LEVL2131 is unproved. Keep the overall scope decision open rather than excluding a world because of its name, tribe count or this single conditional path.

## Selector, state and loader chain

| Stage | Original-byte consumer / condition |
| --- | --- |
| Catalog metadata | `004c3990 → 004852f0` reads HDR/version metadata. The supplied version is **11**, satisfying the threshold 10 guard. The header gives four tribes, landscape 17 and an AI-slot-related eligibility flag cleared because script ID 130 is at least 80. This flag filters the catalog; it does not itself suppress runtime scripts. |
| Displayed name | Numeric 131 dispatches through tables `004c3fb4/004c3f00` to `004c3e62`, selecting language index **731: Face Off**. The HDR's “Demo level 4 ply” and `.inf` “island 1 Access Level” are preserved provenance, not the consumed name. |
| Ordinary SP versus extra list | `004c45e0` passes sentinel **-999** to `004c3a00`; that branch requires catalog eligibility and numeric level **below 79**, excluding 131. The other branch requires matching participant count and level **at least 80**: four participants admits 131. The 532-byte list entry holds the numeric ID at `+0x20c`. |
| Lobby selection | Menu 8 record `005d9d98` uses list `005d97c8`. Type 6 descriptor `005d8464` has initializer `0040f680` at `+0x28` and selection callback `0040f6c0` at `+0x2c`. The initializer passes participant count `0096eabf`, with `0089569c`/`00599940` guards. Input dispatch `0045b093` calls the selection field; `0040f6e6` writes entry `+0x20c` to level-number word **0089c6dd**. |
| Start and phase | Lobby type 5 descriptor `005d7f5c` has label 318 **Start** and callback **0040f7c0**; type 5 dispatch requires action 1. Host byte `0089569d` and active-participant readiness must pass. The callback clears load flag `0x00080000`, writes phase **5** to `00894cf9` at `0040f81f`, and includes the selected level in start data. |
| Initial command | Phase service `0040f136` sets `0089c661 & 8` and queues state 2 through `00442a60`. With that mode bit and **0089d184 == 0**, `004a55c3..004a5613` writes tribe command **0x1b** at `004a55ec` for active tribes and calls `0043e890`. Recorded-playback bit `0098f746 & 0x10` must be clear for ordinary dispatch. |
| Chosen loader | `0043e8e0` tables `004423f0/004422c0` dispatch command 0x1b to `0043ece4`. The local-tribe branch reads selected level 131 at `0043ed4e` and calls **004854c0** at `0043ed56`, then `00486240` and the DAT-world loading chain. |

The Start sequence is conditional on original session/input/readiness and scheduling state; no actual lobby, packet delivery or native session was run. The inspected main-menu **Multiplayer** descriptor uses label 307 and callback `004c3600`, selecting menu 4. Its transport/session admission into an established lobby is not a complete boot-to-menu trace. An unrelated not-ready notification also uses numeric 0x1b; it is **not** the tribe-command producer. The proof checks the real first-turn write at `004a55ec` and its command consumer.

## Why CPSCR130 is not requested on this path

The [header-only export](../generated/004854c0.c) and instruction checks show `LEVL2%03d.HDR` selection followed by **three** calls to `00492be0`. Each initializes **[12,1003,1004,1019]**, an empty version 12 program. There is no call to full HDR/CPATR loader `00485660` or CPSCR loader `00486550`. Header-read failure instead reaches its `005009e0(0x1a)` error path.

Consequently the supplied header's **[130,130,130]** values do not create a CPSCR dependency in this chosen loader. This differs from the [tutorial full-loader path](tutorial-entry.md#loading-is-not-role-suppression), where failed CPSCR reads can install an empty program. Here empty initialization is deliberate loader behavior, not a missing-file fallback.

The subsequent [00486240 header-based state setup](../generated/00486240.c) does not load CPATR/CPSCR files. `0043ed7b →` [0042b590](../generated/0042b590.c) `→` [0042b230](../generated/0042b230.c) reaches the current-level call to [00484a10](../generated/00484a10.c) at `0042b3c8`, selecting `LEVL2131.DAT`. No conclusion is made about forcing 131 through another loader or completing gameplay.

## Rolling Demo: exact remaining provenance boundary

Descriptor `005d7cf4` uses label 334 **Rolling Demo** and callback `004c5a80`. It selects montage 1 through `004b36e0(1,2)`; [004b30e0](../generated/004b30e0.c) reads `RDDATA/RDMN001.DAT`. Its active recording IDs are **1,5,2,6,3**, then restart. They are recording IDs, not campaign level numbers.

`004b351f/004b3537` dispatch to `004b28d0/004b2d20`. The former builds `RD%03dGM.DAT` and `.VER`, checks snapshot size `0xd1964`, and calls serialized-state reader **00428210** at `004b2af7`. This is a different loader family from LEVL HDR/CPATR/CPSCR initialization. Playback mode bypasses ordinary tribe-command processing at `0043e890`.

**No proved field or producer binds those recorded snapshots to canonical LEVL2131 DAT/HDR identity.** The remaining source-map provenance question is **004b3510 → 004b28d0 → 00428210**. Matching labels or reinterpreting recording IDs as levels would invent that relationship. This finite finding does not authorize save/capture work, broaden U08 or establish exclusive whole-content SP/demo scope.

## Base executable and canonical identities

All addresses refer to base-game D3D EXE SHA-256 `3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f`. The canonical level inputs are **Component 0**, not a UW replacement. The previously reviewed installer index (installer SHA `c5d3ad2a1b369e636df85a6061b832c18f2dc33526a03383f61abd7b5518c52d`) has no CPSCR130 entry; it was not enumerated or extracted again. Component 1's overlapping header destination and separate `levluw` pair must not be substituted or assumed equivalent.

| Required input | Bytes | Enforced SHA-256 |
| --- | ---: | --- |
| `levels/levl2131.dat` | 192137 | `048b34772c158b37cc7783bedd5c4bca4da9628a3026a813c53cb4b57616d157` |
| `levels/levl2131.hdr` | 616 | `08f4ee293d7eea4d53490a54240aadcd87aeb930f555ef1c3bb530cd4162b9cd` |
| `levels/levl2131.inf` | 26 | `cecd22897e9bedef3bcb59d5cfe012dbd641bd5c3a52510a8a9e6f1704ef4048` |
| `levels/levl2131.ver` | 68 | `428e57013eb47a4a7abdb3ec649e275f591e0846b219f8e81221cfb87a7ccb6a` |
| `language/lang00.dat` | 207264 | `e826c478746d666a3ea9ea36cb7804d1d226d5f83084230987b1de293066cf7d` |
| `rddata/rdmn001.dat` | 286 | `b947d85037945626b58bd085d8bd3996ca2be3ea0072c88eee6621bcc2485f91` |

The header selects four tribes, scripts 130/130/130, landscape 17 and object bank 0. Hashes establish the supplied files, not an actual original installation's chosen root, access permissions or I/O result. All six sizes and hashes are enforced by the checker; no missing script is synthesized.

## Reproduce the static proof

Use Python **3.9+**, existing **Capstone 5.0.7**, the tracked [demo131 checker](../../scripts/check-static-demo131-entry.py) and its unchanged sibling [PE32 reader](../../scripts/check-static-mission18-sky.py):

```sh
python3 -B scripts/check-static-demo131-entry.py \
  --exe /path/to/d3dpoptb.exe \
  --data-root /path/to/original-game \
  --output-dir /path/to/new-demo131-evidence
```

The output directory must be new and its parent must exist. `evidence.json` records the result, all six input identities, conditions, limits and source/reader/EXE fingerprints; 30 text files expose the decoded code windows. `--reader` may name the same SHA-locked reader explicitly. Default discovery is relative to the checker, not cwd. Neither Git, prior scratch reports, fixed worktree paths nor Ghidra is required. No target instructions, emulator, networking or rendering run.

The accepted research receipt is **186 static assertions /30 original-byte windows**, exit 0 at **September 17 09:09:58 Berlin**, research head `a24a7293f9b6debbcf92db41cb0fb16f2c8dc744`. Report SHA-256: `a56071e179a90dbbebe3227a535df60868b53295da6d5b477fe9b50aec3588b4`; original source SHA-256: `c9d5bbe978772825d43fe1bd1fd4d066ec8af84da90bb48178efef6e29434bcb`. Publication changes only portable reader/CLI/output setup. All code windows, expected instructions, data dispatch, six identity guards and scope conclusions are retained; the historical receipt is preserved, not a required reproduction input. The relocated publication run has its own source/result fingerprint.

**Stop at the evidence boundary:** original boot/session admission, input/hit/host readiness, initial-counter reachability, Windows reads, actual network delivery and complete gameplay remain unobserved. Preserve the positive Face Off/no-CPSCR130 branch finding and unresolved Rolling Demo provenance together. Multiplayer stays excluded from implementation; no scope exclusion, parity or full U01/#1 acceptance is recorded.
