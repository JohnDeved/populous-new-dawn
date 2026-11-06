# Mission 4 Tower knowledge artwork

This change registers the original Mission 4 Tower body/glow with the existing Vault presentation owner. It does not change worship commands, payout timers, placement, checkpoint schema, or rendering algorithms. The existing scene preload selects the atlas through `vaultKnowledgeAtlas`; the new atlas uses the same nearest/no-mipmap treatment as the Camp and Temple art.

## Original identities

Recovered as data from the original PopulousTB setup ZIP (SHA256 `6aa6c366809ea1d9575ec1d31a24527a95c7332f0a1d2ab692f7a602e7e10702`). Installer SHA256 `c5d3ad2a1b369e636df85a6061b832c18f2dc33526a03383f61abd7b5518c52d`; never executed. Six extracted input hashes are embedded in `app/original-vault-knowledge-tower.json`. Four match prior research pins; bank-d PAL/AL hashes are measured from this pinned archive, not an independent historical comparison.

Mission 4 header bank13, trigger1→reward0, building model4, world position `(69,-29)`. Native descriptor selects body HFX1076. Draw43 selects fourteen glow frames HFX1417–1430, step4. The original bank-d palette/alpha lookup and encoded-RGB tint `[229,220,214]` are retained. Body RGBA SHA256 `78d0c0eceec0c731c15fda9aa152ea7f0cb92114913504fe2120d21d93ac94a3`; full atlas RGBA SHA256 `ce5e3be7791d8301f07428a4f2992cdfa132dd72dad865f53e7d79841a60d610`.

An independent PSFB decoder reproduced all15 frame pixels, PE descriptor and mission identities, and the full atlas including transparent padding. The dedicated importer retains its existing hash checks and refuses different or partial installed output. Existing shared atlases are not regenerated.

## Checks and limits

- Seven isolated importer tests passed: prior presets, body/coordinates, all frame crops, idempotence, missing/partial refusal and corrupted-palette rejection.
- Seven real appearance-owner tests passed: four new Mission4 checks plus three unchanged Vault tests. Initialization retains an existing saved cursor; gift art requires matching frame and animation identity.
- The existing broader world test excludes Mission4 from its unsupported-mission list because this change now supports that authored source. Its full simulation suite has not run for this candidate.
- Full asset-preservation checker, full type/build suite, real browser rendering, ordinary Vault collection and Save/Load remain required before merge. A static atlas inspection is not in-game visual proof.

Reproduction with original extracted data available:

`python -B scripts/import-vault-knowledge.py GAME_ROOT --mission 4 --check`

`python -B scripts/check-vault-knowledge-assets.py GAME_ROOT --mission 4 --base 0e30683b4e99bb94ccf90967f4d11e911bb3c6b1`

`node --experimental-strip-types --test tests/vault-appearance.test.mjs tests/mission4-vault-artwork.test.mjs`

The original extracted executable name was `D3DPopTB.exe`; an explicit lowercase read-only alias was used for the existing importer's `d3dpoptb.exe` convention. The original file was not renamed or executed.
