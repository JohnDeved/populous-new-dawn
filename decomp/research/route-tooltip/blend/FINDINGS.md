# Route tooltip blend and frame: bounded independent static review

## Decision

ACCEPT an opaque background for the ordinary initialized D3D gameplay/HUD route-tooltip path. ACCEPT frame geometry of text width + 7 and text height + 7, with origin x - 4, y - 4. REJECT describing either as a captured native screenshot, a universal claim about every inherited renderer state, or evidence for width/height + 8.

The minimum exact renderer contract remains: background alpha is 255 when vertices_flags & 0x18 is zero. The normal-path state audit supports this case. It does not prove arbitrary states supplied to the tooltip owner have zero blend bits.

## Inputs and method

- Read-only repository: /tmp/populous-native-route-tooltip-20261021, HEAD be44bc76f21429c472978c3dcb8893e565b6a4fb. Initial git status was clean; no repository edits were made.
- Source executable: /workspace/scratch/69fd8163d94e/populous-original-inputs-20261020/game/d3dpoptb.exe. Verified SHA-256: 3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f.
- Existing source-bound findings: /workspace/scratch/69fd8163d94e/route-native-evidence-20261021/FINDINGS.md. Reused its tooltip mode, source palette and 4x4 tile identity findings, rather than reimporting assets.
- GNU objdump (GNU Binutils for Debian) 2.44, Python standard library. Static instruction/data reads only; no original instructions executed or emulated; no security/system settings changed.
- audit_static.py, audit_callbacks.py and audit_bit8.py are static analysis scripts, not native probes. Direct conditional branch alternatives are visited without executing the game. A call is treated as returning for the local writer-to-clear check. Indirect edges are disclosed separately, not silently certified.

## Frame geometry

1. 004a24c0 builds [x-4, y-4, x+W+3, y+H+3]. See tooltip-frame.asm.
2. 00516a00, 00516ad6-00516b3a, converts the four integer endpoints directly to float quad vertices. There is no +1 on right/bottom. Its normal path submits packet flags zero and diffuse alpha 255. See background-submit.asm.
3. 0047d980 copies the four vertices unchanged, adding only the common vertex_shift_x/y. It stores packet vtable 0058f518, whose two entries are 004f9460 and 004f9470. See source-data.json and quad-submit.asm.
4. 004f9470 forms triangles (0,1,2) and (0,2,3), copies the four 32-byte vertices without changing x/y, then sets common z and reciprocal-w. This closes the potential packet-side inclusive +1 ambiguity. See quad-packet-raster.asm.
5. 004a1f50 uses right-left and bottom-top, never +1. For 4x4 corner tiles it puts the right corners at right-4 and the bottom corners at bottom-4. Horizontal edge span is right-left-8 and vertical edge span is bottom-top-8. The center tile is absent for this frame. See frame-border.asm.

Consequently the frame's geometric span is W+7 by H+7, not W+8 by H+8. The text begins 4 pixels from the top/left geometric edge and the right/bottom geometric edge is 3 beyond x+W/y+H. For W=102,H=30 the frame span is 109x37; for W=276,H=38 it is 283x45. Adding an inclusive endpoint pixel would enlarge the original quad and place the last corner one pixel too far right/down.

This is geometry/packet evidence, not a native raster capture or a proof of all historical GPU raster/texture-sampling behavior. A browser rectangle should use the native geometric span; any intentionally different modern sizing must be labeled as a compatibility decision.

## Normal blend-state chain

- Main 00522570 sets 005da078=0 at 00522624, selecting the D3D submission path. At 00522755 it calls 0044ac00, then 0044abf0 (just ret), then 0044a2f0 at 0052275f. This HUD dispatch is skipped when land_flags1 bit4 is set; that exception is not included in this review's ordinary HUD claim.
- Normal UI initialization 0044a280 zeroes the UI state, sets 00684210, 00684508, 00684218 and current-window ID 0068c6c5 to 1, then calls 0044c650(1). See normal-ui-initialization.asm. The normal path is not an invented empty-window fixture.
- Source table 005cd080 contains six nonzero 62-byte records, IDs 1,2,3,4,6,7. Every transition count at +4 is 1. Window render callbacks at +30 are zero or 004a1720. The source-data extraction records the exact bytes and every descriptor callback.
- 0044c650 copies transition count into runtime +4 and state 1 into runtime +0x2e. In the first dispatcher phase 0044ac00 decrements count 1 to 0 and changes state 1 to state 2 before drawing. State 3 is removed when its count expires. In the drawing phase, state 2 takes 0044aeb7, clearing bit8 rather than taking the blend setter at 0044aeae. See window-init.asm and ui-dispatch.asm.
- The two descriptor arrays per record terminate at type +4 = 9 and have 66-byte records. Source callback +41 becomes runtime callback +0x53. The decoded source arrays have 22 distinct nonzero callbacks; zero entries are also preserved in source-data.json.
- Static direct-call closure of those callbacks, template callback 004a1720 and final highlight 00525bd0 reaches 194 functions/17,618 instructions. It finds 12 bit8-setting sites. Every such local branch path reaches a bit8 clear before a return, with no unmatched local exit. Sprite renderers reached transitively also write the whole flags word, but their six nonzero write sites all reach a zero-word assignment before returning. See callback-direct-closure.json, callback-bit8-closure.json/.asm and flag-write-closure.json/.asm.
- Bit16 is not introduced by any direct setter in that callback closure. To bind entry state rather than merely assume it, the executable's initialized flags word at 005da074 is zero; all 15 direct OR-0x10 sites throughout the executable have local paths to clear 0x10 before returning. All six arbitrary full-word write sites reach a zero write before returning. The other variable OR sites at 0041ea84/0041eab7 use ebp=8, not 0x10. The whole-word restore at 0046b172 restores the value saved at 0046b0f5 and does not introduce a new flag. See source-data.json, flag-variable-or.asm and flag-save-restore.asm.
- A raw little-endian address-reference scan for 005da074..005da077 found all exact pointer occurrences inside decoded instructions, with none in data tables. This supports the direct-access audit but is not a formal proof against all computed-address aliases.

Together these support opaque red on the ordinary initialized, active-HUD, normally returning D3D path. The supplied route owner neither forces nor restores blend bits itself, so the reusable renderer must still document inherited-state behavior. A universal alpha claim would need additional bindings for hidden/no-active HUD, altered UI tables, reentrant/abnormal callbacks and arbitrary external renderer state.

## Corrections and limits

- 0049f4ef belongs to separate function 0049f0b0, not callback 0049ebd0. Main calls 0049f0b0 at 00522a25, after the route tooltip. Its set/clear pair is not needed for the normal pre-tooltip callback proof.
- 00524a30 is NOT an unconditional blend reset: clears 00524cd6/00524cdd occur only inside a conditional overlay branch. Main itself does not clear vertices_flags on entry. Do not cite either as the entry-state proof; use initialized state plus scoped writer-return closure instead.
- The direct-call inventory explicitly retains indirect font, platform, formatting and graphics callbacks and switch-table edges. It is an audit aid, not a claim that every such target was fully resolved. Ordinary returns and the known renderer configuration are part of the accepted normal-path scope. No arbitrary callback injection or memory corruption is modeled.
- Full browser projection, viewport origin, runtime palette changes, all special blend/ghost cases and exact native raster pixels are outside this review. These are not certified by the geometry/opacity result.

## Check outcomes and reproduction

passed: executable SHA-256 verification; bounded objdump/data extraction; static source-table decoding; writer-to-clear checks (15 bit16 setters, 6 arbitrary word writers, 12 callback-reachable bit8 setters, zero unmatched local returns/indirect branch exits in those bounded checks); read-only HEAD/status inspection.

not-run: original runtime, original instruction emulation, browser rendering, repository tests/build, hardware performance. These are not required to verify this bounded static contract and are not claimed as passed.

One objdump read attempt received an exec-server transport disconnect before process creation. The identical read-only command was retried successfully; it was not an access denial.

Reproduce from any working directory with the same input path:
python3 /tmp/populous-route-blend-review-20261021/audit_static.py
python3 /tmp/populous-route-blend-review-20261021/audit_callbacks.py
python3 /tmp/populous-route-blend-review-20261021/audit_bit8.py

Use manifest.json for retained file sizes and SHA-256 hashes. Source reference asm was extracted with objdump -d -Mintel --start-address=<start> --stop-address=<stop> <exe>; the file's first instruction and bounded last instruction identify each retained range.
