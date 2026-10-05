# Final bounded review: Mission 3 Vault HFX presentation, PR 215

**ACCEPT.** The exact implementation, native/resource proof, standard gates and
ordinary rendered acquisition support the bounded Mission 3 Temple world-marker,
collected body and independent glow repair. No blocking introduced defect remains.
This does not close broader issue 23 or issue 214.

- Base: `71b3860e7025a9534d56248c194aa18610b5df4d`.
- Accepted app head: `ef62e48f07834cddcb543969a7afab5c77a84f4a`, clean throughout.
- Accepted tree: `bdaa12ef7ea9ecf3094f4a23c25ae93cdb02063e`.
- Full binary diff SHA-256:
  `fd628083e0a3aec38e8363ca937e1e58575c5064e188c52cbac98463cbf83bf0`.
- Final raw scenario report SHA-256:
  `6fb7f48675e45f65f1c54ad2c9a6b34480045442ccdcb23ff816ac39c0e8d3b3`.
- Actual first rendered gift-body PNG SHA-256:
  `59266bd1544583972ddf464d6918993eb9a0db86631e4c44563788bac84c4c83`.

## Source and native/resource acceptance

This final decision incorporates the full 21-file review in
`../vault-world-code-ef62e48/review.md` and native proof in
`../vault-world-proof-48ca690c/review.md`. No app file changed after those reviews.
The native proof and independent raw PSFB decode establish the explicit HFX
resource family, body 1079, fourteen-frame draw 43 glow 1417–1430, ordinary body
opacity versus AL/nibble glow alpha, bank-p RGB tint and occupied Vault socket.
Original source and execution support independent ownership/retirement and the
unchanged 82-visit payout, without claiming full native renderer execution.

The dedicated source-owned atlas was independently decoded and compared byte for
byte, in addition to importer reproducibility/idempotence and refusal tests.
Original HUD/effects/person images and metadata remain byte-identical to base.
The accepted implementation remains limited to the authored Mission 3 Temple
source, existing gift/effect fields, one optional Shrine animation state,
initialization/migration hooks and the existing animation/render boundaries.
It adds no global clock, native pool, screen-acquisition controller, payout change
or parity credit.

## Actual normal-control rendered result

Final evidence is under
`work/orchestration/vault-hfx/browser-candidate-acquisition-2/`, with its adjacent
command receipt. I inspected the actual PNGs, raw stage records, command/source
fingerprints and cleanup receipt, not only the owner's summary.

The shipped controls selected a living Blue Shaman 46 and clicked actual Vault 92.
Before the click, turn 142 had no current order/work. Afterward, lastOrderTurn was 143,
pointerAck targeted 92, and the Shaman had work 92, VaultTask head 92 and native
PersonOrder `{model:33,a:92,b:0,flags:0}`. Pure progress observations retain this
order, healthy Shaman and increasing worship work through the ordinary route.

Correction to the earlier driver-review explanation: mode 33 enters the queued
branch at `live-command.ts:515–560`; `appendLiveOrders` does allocate the native
PersonOrder. Work/VaultTask is additional ownership evidence, not a replacement
for that order. The raw driver/report's old explanatory label is preserved, but
its no-allocation wording is incorrect. This does not change the separately proved
fact that the mode 4 gift lacks the ordinaryWorship recipient field.

The prospective observer records the following actual application transitions:

| Stage | Exact object turn | Gift remaining/phase | Actual first post-render state |
| --- | --- | --- | --- |
| Birth | 1082 | 82 / 6 | Visible HFX 1079 body and HFX 1417 glow; cursor 4/display 0; source marker hidden |
| Retirement | 1088 | 76 / 0 | Complete gift group hidden, Temple still locked |
| Payout | 1164 | Gift removed | Temple knowledge unlocked, source marker still hidden |

Birth's preceding sample is turn 1081 with active source and no gift. Retirement's
preceding sample is phase 1/remaining 77. Payout's preceding sample is turn 1163 with
remaining 1 and no knowledge. The retired gift glow's cursor 48/display 11 remains
unchanged through turn 1163, while the marker's separate saved cursor remains 28.
No missing transient is inferred from state alone: the actual birth PNG plainly
shows the Temple symbol and glow above the open Vault. Its post-render sample is
also turn 1082. Actual retirement/payout first-render PNG hashes are recorded in
the report and independently verified.

Host Playwright Pause arrived later, at turn 1093. Therefore
`host-paused-after-birth.png` shows an already retired body and **must not** be
published as the brief birth/body image. Use
`acquisition-birth-first-real-frame.png` for that claim. The scenario correctly
retains both observations rather than relabeling the later paused frame.

Baseline `71b3860` and candidate preflight both passed. I viewed their comparable
1440×1000 marker detail captures: baseline shows the erroneous person-frame art;
candidate shows the Temple HFX symbol plus separate multicolored glow. The final
restored-marker screenshot also visibly retains the HFX presentation at the
later recorded glow frame. These are browser before/after captures, not original-
game reference screenshots or proof of final native raster equality.

## Checkpoint, callback and execution integrity

Public Save checkpoint stored Mission 3 turn 113, marker cursor 12/display 2, active
source, no gifts and no Temple knowledge. After an ordinary page reload in the
same ephemeral context, the public startup Load Game operation produced an exact
pre-activation equality to that saved record. The later live paused sample is
separately recorded at turn 138, cursor 40/display 9; normal resumed advancement is
not mistaken for a restore mismatch. This proves same-context reload persistence,
not cross-process profile continuity.

Both observer epochs report restored callbacks and empty error lists. The final
browser receipt has no browser errors. It retains software-WebGL fallback,
ReadPixels stall and texture-not-yet-imaged warnings; these are not hidden or
presented as a clean warning log. The required new atlas did render successfully.
Browser version is 154.0.8037.92, headless with sandbox enabled, ordinary
remote-debugging-pipe flags, viewport 1440×1000/DPR 1 and reported renderer
`WebKit WebGL`. This is software/headless evidence, not hardware performance.

The final command is terminal exit 0 and the harness reports passed. Its command
receipt binds the exact scenario a6b302d5, witness a0792c14 and unchanged checkpoint
helper 67bca92d; before/after inputs and clean app source match. The standalone raw
report equals the harness's returned result exactly. Same-launcher-scope cleanup
records no listener before/after on port 4363; normal browser close and owned server
group cleanup completed. No new browser or heavy check was run by this reviewer.

The first candidate acquisition attempt remains a retained failure: its old
observer wrongly required recipient===playerTribe and timed out after 300s.
The source-bound failure-first regression reproduces the false negative using
real createWorld→ordinary command→tick→createGift. The subsequent five-test pass
and reviewed diagnostic-only repair justify the fresh retry; they do not
retrospectively turn the failed attempt into a passed acquisition row.

## Gates and quality

I verified exact-head before/after identities and raw log hashes for:

- Standard `npm run check`: passed, 1114/1114 tests plus typecheck/parity/manifest checks.
- `npm run build`: passed.
- Focused Vault, prior Vault appearance, Shaman cadence and ordinary acquisition:
  passed 15/15; separate typecheck passed.
- Exact-head asset check: passed, including canonical bytes, reproduction,
  idempotence, negative guards and six old-asset preservation checks.
- Fallow health: exit 0, advisory results retained, including existing cycles,
  unused dependencies and hotspots. No broad refactor is justified by this slice.

The quality commands were run but remain failed on existing repository findings:
format reports two files (`render-view.ts`, `viewport-bounds.ts`) byte-identical to
base; Oxlint reports 673 errors; ESLint reports 285 errors/two warnings. I independently
checked the 673 attributed Oxlint lines and the one changed-file ESLint location
against their corresponding base lines; all 674 match. The rest of the ESLint
findings are outside changed files. These are explicitly legacy failures, not
passing gates. The new helper's earlier type/interface issue was repaired before
the reviewed head. No introduced quality defect was found in the maintained code.

`verification.json` beside this note retains gate statuses, exact source/input/log
and PNG hashes, quality-line verification and lifecycle/checkpoint assertions.

## Remaining boundaries

This is a bounded Mission 3 world-presentation repair under issue 23. Complete
class 2 screen geometry/companion acquisition, final native device raster,
allocation-failure matrices, broader Vault families and full campaign parity
remain unproved and open. Issue 214's absolute animation-speed/cadence report is
not resolved; the existing 24 Hz adapter is unchanged. No hardware-performance
claim or parity increase is accepted. The rendered evidence covers the recorded
viewport/camera states, not a separate resize/DPR/rotated-view acceptance matrix.

Within that explicit scope, the previously accepted source now has real ordinary-
control rendered, checkpoint, lifecycle and standard-gate evidence. Final bounded
acceptance is supported; a substantive source change requires a fresh delta review.
