# Mandatory Angel and Shield visual witness

This is source/CPU validation plumbing, not a browser pass or original-game
framebuffer equivalence claim. Both original production asset sets and gameplay
remain unchanged by this integration. No Bloodlust changes are included.

The dedicated `spell-visuals` shard must run Angel, await its successful context
closure, then run Shield and await its successful closure. There is no skipped,
optional, fallback or reduced episode inventory. Both receive the same absolute
runner deadline. Limits remain180s outer browser,120s build and15min hosted job;
Angel has50s inclusive with60s admission, Shield45s inclusive with55s admission.
Admission, context creation, fixture setup, UI, retention and closure count inside
each episode. All eight preceding hosted jobs, caps and the eight-job trusted
validator are unchanged. No trusted-copy deployment or activation is performed.

`spell-visuals-nine-v2` is a separate explicit contract. It rejects the prior
Angel-only v1 contract, missing either episode, absent source pins, incomplete
artifacts, old checkpoint versions, lifecycle failures and invalid pixels. The
parent must separately review and pin the policy, data-only Shield receipt helper,
source inventory, Shield pixel oracle, Angel renderer oracle, checkpoint codec,
ZIP reader, original Angel JSON and original unit-frame JSON before admission.
The policy executes no candidate application code. Unit-frame and Angel source
data are supplied as trusted bytes and checked against caller-bound SHA-256 pins.

## Retained evidence

Angel retains its existing three contextual images and ordered real morph/death
crops, current-v4 supplied/public-save graphs and actual Load boundary. Shield
retains four-owner context and six same-render original/scaled/loaded crops,
full supplied checkpoint and expected/actual initial Load graphs, actual public
Save graph and expected/actual subsequent Load boundary, F8 build identity,
ordinary expiry samples, disposal and inclusive lifecycle evidence. Shield source
checks the merged current version4 explicitly; there is no version3 fallback.
Crops keep strict body-height, source, UV, palette, painter, canvas ownership,
causal removal/restoration and decoded PNG/framebuffer equality checks.

There are26 fixed files, up to40 Angel crops and one optional build log: at most67
archive entries. File/archive/decoded-total ceilings remain32/48/96MiB. The compact
base64 receipt is bounded to24,000 decoded bytes to bind both inventories. Every
required artifact is hashed; unexpected artifacts and duplicate crop identities
are rejected. Captures and raw logs stay ignored, never committed. Real captures
must later be attached to the PR with exact tested SHA and renderer limitations;
synthetic test PNGs are never substitutes for them.

## Pending gates and limits

Independent combined review, final-SHA supported-Chrome build/browser execution,
actual screenshot and ordered-animation review, whole-lane timing/cleanup and
explicit trusted-reader deployment remain required. This work does not perform
them. No native binary is executed. Supplied stock/controlled checkpoints do not
prove earned acquisition; original GPU composition, complete native controller
or lifetime, authored palettes and hardware performance remain outside the claim.
