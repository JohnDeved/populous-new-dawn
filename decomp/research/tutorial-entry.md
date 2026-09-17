# Tutorial entry: conditional selector and script loading

**Observed and published September 17, 2026, Europe/Berlin.** This note preserves the reviewed static mapping for Tutorial2079 in [PND01/U01](../../engineering/single-player-feasibility.md#7-accountable-owners-bounded-proofs-and-implementation-order). It is **not a boot-to-click trace, an observed native menu or a tutorial playthrough**. No other extra-map role or full U01 completion follows from it.

## Conditional selector-to-script mapping

Given initialized menu slot **0**, an enabled Tutorial control and activation action **1**, original dispatch reaches `004c5a40 → 004b1e10`. The initializer writes numeric level **79**, sets a tutorial-associated flag and calls `00485660(79)`. That routine selects `LEVL2079.HDR`; its first opponent slot contains ID **57**, selecting `CPATR057.DAT` and `CPSCR057.DAT`. The control's actual label and callback consumers—not its filename or tribe count alone—establish this link.

| Boundary | Original addresses and conditions |
| --- | --- |
| Menu record | `0045a3c0` stores its argument at current-menu global `00749cd8`; records are 32 bytes at `005d9c98`. Menu 0 points to list `005d9660`. Entry `005d9670` is type 5 and points to descriptor `005d7c9c`. |
| Tutorial label | Descriptor `+0x24` at `005d7cc0` is **299**, the supplied language entry **Tutorial**. Type 5 renderer table `0045d6c4` selects `0045b9bb`; `0045b9df/0045b9e3` use that field to index string pointers at `00972ba8`. The helper at `004fe730` is not executed by this proof. |
| Callback dispatch | Descriptor `+0x28` at `005d7cc4` is **004c5a40**. Type 5 activation table entry `0045b69c` selects `0045b496`, which requires `00749ce0 == 1` and calls this field at `0045b4b2`. Opening the menu does not itself invoke this activation callback. |
| Numeric level and flags | `004c5a40` calls `004b1e10`. At `004b1e4e`, load flags `0089c665` gain `0x04000000`; `004b1e27` clears `0x00080000`. `004b1e6f` writes word **79** at `0089c6dd`, and `004b1e92` calls **00485660(79)**. Other flags are not enumerated as a complete mode specification. |
| Header and attributes | `00485660` formats `%s\%s%03d.%s` with `LEVELS`, `LEVL2`, numeric 79 and `HDR`. The supplied header byte 88 is **2** tribes; byte 89 is **57**, selecting one `(tribes - 1)` attribute/script slot. It reads `CPATR057.DAT`, then calls `00486550` at `004858d7`. The early skip for numeric 54 does not apply to 79. |
| CPSCR selection | `00486550` formats `CPSCR%03d.DAT` from slot byte `0089b79a`. Read at `004865df` and retry at `0048665f` target **CPSCR057.DAT**. Success retains the program and initializes the field-table pointer; failure is distinguished below. |

The mouse-style activation branch requires `00749dfc & 0x20`, at least one bit from mask `0x5`, nonzero `00749cdc`, an item without disable flag `0x1`, and nonzero descriptor `+0x0c`. At `0045b007`, mask `0x1` selects action 1; otherwise action 3 is rejected by the type 5 callback branch. The selected-action path at `0045b2ba` uses record `+0x10` when `+0x14 == -1`; selected index **2** identifies this Tutorial entry. It also checks the item flag. These are internal prerequisites, **not inferred hardware-event semantics**.

The list-count initializer scans 8-byte entries to sentinel `0x80000000` at `0045a175`; this list contains 11 entries. The type 5 renderer copies its helper result into descriptor `+4/+8/+0xc`. Actual initialized counts, language pointers, focus/hit state and event producers were not observed.

After initialization returns, `004c5a4e` calls `00442a60(2)`: pending state `0088f001 = 2`, phase `0088f002 = 5`, and `0088f003 = 0`. `00442ab0` can copy pending state to `0088f000`. The transition scheduler is not fully traced; no user-facing mode name is assigned to state 2. `00451330(3)` updates a separate indexed flag, not the whole game mode.

## Loading is not role suppression

**Tutorial loader `00485660`:** it reads the chosen HDR and CPATR slots, then invokes CPSCR loading. Both header and attributes have read/retry paths; their final error branches call `005009e0(0x1a)`. They do **not** use the empty-script fallback. The path assumes valid header/count data; it does not certify malformed-input handling or successful Windows I/O.

**Both CPSCR reads fail:** `0048666c` calls `00492be0`, which writes the words **[12, 1003, 1004, 1019]**—version 12, BEGIN, END, script-end. This is an empty program after I/O failure, **not another script or evidence of role-based tutorial suppression**. The supplied CPSCR057 is 12,552 bytes with version 12; loading it does not prove later script execution or completion.

**Header-only reset `004854c0`:** the [retained export](../generated/004854c0.c) and original bytes show a different consumer. It reads an HDR and resets **three** script slots through `00492be0`; it never calls `00486550`. It is not the tutorial initializer's loader. Its use in other paths cannot classify their frontend roles by itself.

## Fresh tutorial state, not campaign profile 79

The [standard upper loader](../generated/0042c790.c) calls `00485660`, then uses `00485df0 → 00485e60` when load-flags bit `0x10000000` is set. The index helper first checks a special-byte match (return 99), then searches 24-byte table entries, and only after no match passes through 79. Copy1 treats 99 separately. This is not an unconditional profile index 79 mapping.

**The direct Tutorial initializer bypasses both helpers.** It sets `0089b73f` to 0 and calls `00486160`, which copies fresh HDR/CPATR state. Do not fabricate a required campaign/profile record 79. Later `004b1ee0 →` [0042b590](../generated/0042b590.c) `→` [0042b230](../generated/0042b230.c) reaches the world loader's current-number call to [00484a10](../generated/00484a10.c) at `0042b3c8`, linking the DAT selection without proving all intervening initialization. A separate current-level 79 re-entry branch at `004583e9/0045845b` calls the same initializer; its upstream user action is not named here.

## Remaining upstream and runtime boundary

The unresolved producer is no longer an unknown CPSCR filename. `0045a3c0` writes the current menu, and the inspected `004c3800 → 004c3838` branch selects 0 only when `[00a6905c] == 0`, `[0089c66c] & 0x80 == 0` and `[005fc9f5] & 1 == 0`. **The boot/login/return caller and producers of these actual mode predicates remain untraced.**

`0045ae30` consumes action `00749ce0`, flags `00749dfc`, `00749cdc` and selected-control state; `0045b9bb → 004fe730` supplies fields later tested by activation. **The OS input → mask/action/focus/hit chain and actual language-pointer initialization remain unproved.** Windows reads through `00525f80`, pending-state service, subsequent CPSCR execution, completion and return-to-menu were neither executed nor fully traced. Supplied-file identity is not a runtime outcome. This note makes no decision about the other 15 extra maps or CEO-owned U08.

## Reproduce the static proof

Use Python **3.9+**, existing **Capstone 5.0.7**, this checkout's [tracked checker](../../scripts/check-static-tutorial-entry.py) and its unchanged sibling [PE32 reader](../../scripts/check-static-mission18-sky.py):

```sh
python3 -B scripts/check-static-tutorial-entry.py \
  --exe /path/to/d3dpoptb.exe \
  --data-root /path/to/original-game \
  --output-dir /path/to/new-tutorial-evidence
```

The output parent must exist and the output directory must **not** exist; previous reports are never replaced. `evidence.json` contains the result, exact bytes/branches/tables, input identities, fingerprints and limits; 27 text listings expose the code blocks. Optional `--data-root` binds Tutorial language/header/script/attribute data; without it, only executable conditions/tables are checked. `--reader` can explicitly select the same SHA-locked reader. Default reader discovery is relative to the script, not the working directory. There is no scratch-report, fixed-worktree, Git-head, Ghidra or emulator dependency; no supplied instruction runs.

Required EXE SHA-256: `3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f`.

| Supplied input | Bytes | Reviewed SHA-256 |
| --- | ---: | --- |
| `levels/levl2079.dat` | 192137 | `22bd7ec9aa287245d8a41f42f40f468f06f09663304b87c8ccf75e15101068d8` |
| `levels/levl2079.hdr` | 616 | `58a80720a75c6c7018e4e8e95c1e1e3d87de1038e524b8a712a1bc905a40f641` |
| `levels/cpscr057.dat` | 12552 | `cdb5d7abd327933ac22e7824aebae70a60faa504049d05d8ff32dedc730d3603` |
| `levels/cpatr057.dat` | 144 | `6f17daf7484583dcef9b5d3a3e7a61ad5037ded27ca2a04a7fb770ab7f5d52c7` |
| `language/lang00.dat` | 207264 | `e826c478746d666a3ea9ea36cb7804d1d226d5f83084230987b1de293066cf7d` |

The original **335-check / 27-window** receipt was produced at research head `d5daf91d2088af2a106d7a8c29bcaac06239ceb6`, September 17 07:50 Berlin, and subsequently accepted by CEO. Report SHA-256: `9aaf37766460ce079fb94ab26a4e20b2de9151dcc717118688f6cc9ac4509d31`; original proof source SHA-256: `a41d57642b672dc8e4657dd7c8b6a0bfb073ac85675b9d141740d04e60809b3d`. The historical receipt remains unchanged. The initial publication adapted reader/output arguments without changing the byte-condition proof. **September 17 CPATR057 review repair:** the reusable checker now enforces the reviewed CPATR057 SHA-256 alongside the other four expected data-root files, retains the 144-byte size check and records the input once. The historical 335-check run only measured that hash; the current valid-input run has 336 checks because it adds explicit CPATR identity validation. A same-length one-byte mutation must fail without a passing input-identity report. Code windows, selector/loader conditions and runtime limits are unchanged.

The old receipt is provenance, **not a required checkout file**. Reproduction reads the actual EXE and supplied optional inputs using tracked sources; exact current command/result fingerprints belong to its new output. No native boot/click/playthrough, parity or full U01 acceptance is claimed.
