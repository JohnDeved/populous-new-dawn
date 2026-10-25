# Mission3 Temple acquisition and shared art

Refs #23. This extends the delivered M1 screen path only for the authored local
M3 head91→reward92 (slot0, class2/model5). Six object visits hide the world gift;
the independent82nd visit grants knowledge. Building screen arrival never uses
the ordinary-spell timer clamp. The actual disabled Temple card owns the HUD
target; the original147-face model95 owns geometry.

## Source and DATA provenance

Accepted CPU reference: [5fedc5f6](https://github.com/JohnDeved/populous-new-dawn/tree/5fedc5f6ae08c6b8223d6b989717cfff334f649c/decomp/research/building-acquisition-screen).
It translates both original models' transforms/controller feedback and shared
companion/RNG order. The retained Temple fixture is an unchanged nine-case subset
of the published reference JSON, SHA256
`f85554b86cfd4fa7661090a12fc22eac2b5738590dd31b8a98126188bbef5a66`.
It is source-derived CPU comparison, not original execution or GPU proof.

The accepted [submission contract](https://github.com/JohnDeved/populous-new-dawn/blob/47a8ba13f5c798625f4c956fc6b7b6a68f50c576/decomp/research/building-acquisition-screen/submission-contract.md)
binds screen producers00472da0/00473210 and queue0046c3f0/0046c800:222 triangles,
mode32 flags0x92/fullbright255/strict alpha>127, affine UVs, whole winding cull,
flight winding+UV reversal, descending buckets and equal-depth LIFO. Admission
feedback precedes clipping and stays logical-visit owned.

`original-temple-acquisition.json` pins the existing recovered BL320-p, PAL-p,
AL-p and HFX DATA hashes plus the unchanged decoder. The canonical archive SHA256
was `6aa6c366809ea1d9575ec1d31a24527a95c7332f0a1d2ab692f7a602e7e10702`;
the local-only executable identity was
`3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f`.
No archive extraction or original execution is part of this implementation.
The scoped generator preserves the old c assets/model indices and all unselected
pixels. Only12 proved-different model crops and12 p sparkle crops are new; all
alpha bytes match, seven other model crops match, and existing trails are reused.

Local accepted comparison receipt hashes are BL320
`b373634aebde77da0b3fcc65d3e38f7b5360529079759451ad93376efbf7d6c0`
and HFX/palette
`ac314ba1d2f302407b5d3bb9719c072123c4a58a2f71b92463d3d5bffac552b1`.
They establish decoded inputs, not original GPU output.

## Shared ownership and compatibility timing

0044fc40 resets the original shared resource;0044fbd0 increments its counter and
maps bank2[92] through92,93,94,95,100,101,102,103,108. Both world and acquisition
consumers read that bank. The native004a4450 owner visits once per eligible outer
iteration and throttles from that iteration's start. It does not catch up missed
visits. Ordinary successful Load eventually reloads/resets the resource;
normal stable same-resource Restart skips that reload.

This port deliberately uses the existing nominal worship-visit callback, including
catch-up, to advance its shared counter before controllers run. Both screen and
completed Blue world Temple95 sample the same post-advance snapshot. This is a
compatibility policy, not24Hz, RAF, hidden-tab, exact-duration or first-frame parity.
Visible pause retains presentation visits; the current hidden gate and possible
first-visible elapsed catch-up remain unchanged. Clock/deadline code is unchanged.

The resource lives outside World in GameStore. Prepared World/resource transitions
publish atomically. Current-World and live Scene tokens reject stale callbacks,
including Restart with a retained resource epoch. Load resets the resource;
normal same-resource Restart retains it. Save excludes the resource counter but
retains the existing World-owned nominal clock/residual. Texture readiness is
asynchronous; a post-commit failure is not rollback, and explicit retry repeats
its store action. GPU wrappers, caches and DOM remain Scene-owned.

The exact implementation proposal SHA256 was
`c031fa92539d36b46958a47f784b41d672bacb3f5a89bb3b55677b1029b096b5`;
its lifecycle readback SHA256 was
`3b2b793b8bc7fb093e879eeed8eb0f36a41d366beb677c724fad04879352277b`.
Material/timing review SHA256 was
`6b74a528ae3022d545cd6694224b7be2feacd0074917043da5b9ccadb2fe9130`.

## Acceptance boundary

The initial real completion-caller fixture failed because the sixth M3 gift visit
left the screen queue empty. This fixture explicitly supplies completion state;
it is not ordinary gameplay. Focused controller/material/asset/owner checks,
real-Three supplied-renderer tests and ordinary current-source pixels are separate
gates. A genuine M3 route must earn the Vault, observe6/82 and the locked/unlocked
Temple destination, then construct the Blue Temple. M3 has no initial Temple.
Fresh candidate profiles must satisfy the existing application-identity contract.

This slice does not complete other tribe/world materials, construction caps,
exceptional resource resets, full audio, exact native cadence or original GPU
pixel equivalence. Those limits remain open with #23; this change must not close
that broader issue automatically.
