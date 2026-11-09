# Historical pause-recovery scenario

`scenario.mjs.txt` is immutable test data, not an executable scenario or evidence
that today's candidate passed a browser run. It was extracted byte-for-byte from
the captured run's actual proposed merge:

- Commit: `8c9bc8ab4108fdcf1b6d5eb137cc8ac06a348087`
- Path: `scripts/local-render/original-pause-checkpoint-recovery.mjs`
- Git blob: `831a853cf4284c8bdeeb160893f21ac3d0f5b775`
- SHA256: `465bb051df0a8892ed46a0f1ebc2d384f31129213e86185f7554c74705f33681`
- Bytes: 16825
- Capture: [run 39344305071, job 118373096117](https://github.com/JohnDeved/populous-new-dawn/actions/runs/39344305071/job/118373096117)

The commit was fetched by its immutable OID. Extraction used
`git show 8c9bc8ab4108fdcf1b6d5eb137cc8ac06a348087:scripts/local-render/original-pause-checkpoint-recovery.mjs`.
Both its Git blob identity and SHA256 were verified before retaining the bytes.
`source.json` records that provenance; the regression recomputes both hashes and
binds the snapshot to the original receipt's merge, run and scenario input.

The existing `../pause-recovery-current-receipt.json` remains byte-identical,
including all provenance and recorded hashes. Its historical nine-check,
thirteen-screenshot, fourteen-input envelope still exercises the real producer,
strict reader and inventory rejection cases. The test now also proves that the
same historical receipt is rejected when the caller expects today's changed
scenario hash, without changing the run identity to manufacture a different
rejection reason.

Current-candidate acceptance remains the responsibility of the real hosted
workflow and trusted integration reader. They must verify the current
head/base/proposed merge, reviewed input hashes, actual browser result, screenshot
bytes, deadlines and cleanup. They do not consume this snapshot. Historical
fixture success cannot replace a fresh successful candidate browser run.
