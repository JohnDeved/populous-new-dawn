# Historical pre-newborn Mission 6 raid checkpoint

This complete browser world was captured at turn 8529 under exact repository
head `9f7a4758aaabd11b0b57e89d150265c313d9a13a`, before normal Hut newborns
were deferred to their first scheduled visit. It is not a fresh current-scheduler
campaign run or a native executable capture. No original executable was run.

The hash-bound producer captured the whole world without actor, task, RNG,
health or clock repairs. It exported only after the unchanged original Mission 6
case passed through turn 8702, including the 8016–8529 mixed raid, correct attack
anchors, real reincarnation-wave casualties, retirement and producer-slot reuse.
`producer-receipt.json` preserves that successful command and original test hash;
`provenance.json` binds all tracked app/public inputs, producer, source tree,
serialized bytes, compressed bytes and member/slot identities.

To reproduce, use a clean checkout at that exact historical head, make ignored
`work/m6-historical-0404/`, and load the preserved
`scripts/capture-historical-mission6-raid.mjs` as a Node import while running the
original `tests/mission6.test.mjs` with name pattern `^Mission 6 Chumara`.
The producer checks the historical head and original maintained source hash;
it intentionally cannot be run against the newly revised natural fixture.

The v8/gzip file is archival transport only. The maintained historical test loads
the complete world through the public store Save/Load API, then checks full-world
replay every turn and retains every original 8529–8702 lifecycle assertion.
The current natural case separately covers conversions, Blue elimination with
no respawn, live return-order release and phase6 timeout retirement. It makes no
claim of natural producer-slot reuse.
