# Exact setup5 repair review

**ACCEPT `5d8b30c4c92d40adee8951cb9f9b763d69f54a1c` as the narrow repaired executable freeze. A separate parent grant is still required for one corrected bounded invocation; none was run by this review.**

Manifest `7b9473458cef8644059735183ae0b00bd85baa0e4e21fce90f6bd542bdeb22dd`; launch `a0525fbaa649d736ac0f80e380a852e62df38e1f863c615817e78e1e86cecb5f`; probe `e707ba1f38fded52bad9af31cd7e1da0dfe5deb5388d1601e3234f37ff4a6ea7`; contract `85c150e91b1ad661215891c0d2c2f76d56c9bc182eb2b125fe4feef8478a94bf`.

The only new write interval is **[0089798d,00897997)**. Its overlap guard permits exactly setup5/entry5, value0, and `(0042b7fe,0089798d,4)`, `(0042b800,00897991,4)`, `(0042b803,00897995,2)`. The neighboring area starting00897997 remains excluded. These stores were already in the accepted original instruction closure; no original byte, call or supplied outcome is changed.

Independently compared Python ASTs after removing just that new guard: all other probe code is identical to77839a91. Closure bytes, child argv and every entry/allocation/instruction/time/resource bound are unchanged. All61 repaired manifest identities pass. The retained host-only checker now accepts the3 exact stores and reports rejection of7 wrong/adjacent writes; its source was inspected without rerunning it. `git diff --check 34016b86 5d8b30c4` passes. Source is clean; the named fresh attempt02 worktree is absent.

## Remaining setup5 store footprint

Per the parent's additional request, inspected the complete selected `0042b7f0` body and its already-selected descendants, without adding calls or ranges:

- `0042b7f0`: after the10-byte buffer clear, fixed writes cover008926c7..008926cf, already declared. Its bounded four-tribe loop writes fields/arrays wholly inside0089d1c8..008a035c, already declared.
- `0042b660` and `00436ff0`: tribe-local clear/default/mana/order fields only, inside those same four records.
- `00461d70`: tribe-local clears,60-dword AI-default copy and bounded loops remain inside the tribe records. For numeric AI owners1/2/3, its other writes are `00960815 + owner*0x30` (1 byte), `009608b2 + owner*0x3108` (4 bytes), and `0095d7b4 + owner*0x3108` through+6 (three words). Every computed span already lies in009557a4..0096eadd.
- `004f52c0`, `004d1420` and `0041a4f0`: flags/motion/mana writes are tribe-local. Their call graph adds no other descendant.
- Ordinary call/stack saves stay in declared scratch.

No second missing declared store field was found in this selected setup chain. This is a source footprint check for that setup chain under its fixed numeric-owner inputs, not assurance that later stages will finish or a reason to enlarge another failure automatically.

Attempt01 remains FAILED and unchanged; publication at34016b86 preserves it. Its zero-allocation setup prefix establishes no Mission2 admission result. The next allowed action, after parent grants it and confirms lane availability, is exactly the repaired launcher in the declared fresh attempt02 worktree/output. Preserve any new stop and require result review; no implicit retry or runtime/shared-phase acceptance.

Evidence: `5d8b30c4-repair-checks.json`, `result-review.json`, and the initial failure `verdict.md`. No native/emulator, application, package or browser execution, resource reservation or source mutation was performed by this reviewer.
