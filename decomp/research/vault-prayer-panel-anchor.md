# Vault prayer-panel socket anchor

This completes the ordinary authored Mission 1/Mission 3 anchor correction from
[worship panel producer research](worship-panel-auto-producer.md). The panel
request, lifetime, informational slot and reward acquisition remain their existing
owners. It does not establish general construction or modified-body parity.

## Static source contract

`005090f0` selects the world class-2/model-18 building descriptor byte at `+0x33`.
This is not the UI panel kind13 or mesh154. The existing executable extractor
places building descriptors at VA `0x5a7228`, stride76; model18 is `0x5a7780` and
its socket byte is `0x5a77b3`. A bounded data-only read of the recovered canonical
`d3dpoptb.exe` established byte **00**, selecting socket **0**. No native execution,
new export, imported-asset edit or broad rule-table regeneration was involved.

- Executable SHA-256: `3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f`
- Descriptor76-byte SHA-256: `dcb4d453dee2f768d5b52e0f88b6362262ccf104157d67c9a1acb7f1b734b301`
- Existing PE mapping: `.data` RVA `0x198000`, raw offset `0x195e00`; socket file offset `0x1a55b3`
- Matching descriptor identity: base object152, flags `0x78000`

Retained exports `00509000`, `005090f0`, `00504920`, `00404540`, `004047b0` and
`00404420` own record height, live attachment, socket transforms and fallback.
`00509000` leaves the Vault record height zero. `00404540` selects the mesh's
orientation shape; rotation is already in that record. For meshes152–155, every
quarter turn uses origin `[4,4]`, socket0 `[40,30,40]`, socket1 `[40,67,40]`, and no
smoke correction. Socket0 is `(anchorX+256,anchorY+256,terrain+480)`; separate
reward socket1 has height1072. Scenery panelHeight1028 is not a Vault attachment.

Authored body/trigger binding and `vaultShapePose` supply these completed Vaults:

| Mission | Body index, heading | Coarse native anchor | Socket0 native XY |
|---|---|---|---|
| 1 | 35,512 | 512,64000 | 768,64256 |
| 3 | 104,0 | 57856,31744 | 58112,32000 |

`vaultPrayerPoint` reuses `buildingSocketPoint(vaultShapePose(vault),0)`.
`ObjectPanels.update` converts that XY with `browserPosition`, preserves current
terrain synchronization through `nativePosition`, adds socket height once, and
passes native height/45 to `GameScene.screen`. Its scene vector uses native
height/128. Existing renderer-relative positioning and HUD clamps are unchanged.

## Regression and evidence boundaries

The failure-first tests in `tests/vault-approach-caller.test.mjs` drove the actual
M3 command/travel/prayer sampler to an automatic phase1 panel. A complete supplied
atlas/DOM context reached real `ObjectPanels.update`, canvas painting and real
`GameScene.screen`, observing the supplied `view.screen` boundary. Frozen commit
`ee9a1fa7d889f0dd9cdaf83fa0a699cce65bde0e` failed four height checks by548:
M3 `1257/709`, retained M3 `1321/773`, M1 `1103/555`, retained M1 `1167/619`
(actual/expected). The M1 edit makes the authoritative browser grid newer and
requires the actual consumer to synchronize native terrain. The M3 edit supplies
native heights outside that cropped grid. Clamp and non-Vault controls passed.

These CPU tests prove the live consumer and terrain/coordinate contract, not
original full-frame pixels, GPU artwork or hardware performance. The ordinary M3
browser witness separately checks candidate socket projection and DOM tail at
recorded stages. Historical PR310 screenshots are not a matched camera baseline;
no numerical before/after pixel claim follows from those images.

The corrected same-test replay at `b42dcb7bb7dd2d26c8b354997e563c8585cf15f6`
uses test SHA-256 `cdc92dc9d6400e56304f1a384335cb22902997c74502f3c673ba5344ce751502`.
Restoring only the two changed runtime files to base `35de8e6c` reproduces the
same four height failures; restoring the committed candidate passes all26 tests
including the unchanged appearance/vehicle controls. Both source-bound receipts
retain stable before/after hashes. The correction asserts native XY modulo65536:
`browserPosition` canonical z123 and authored z-133 are periodic equivalents, and
`RenderView` owns camera-relative wrapping. The earlier literal z-133 expectation
was a test representation mistake, not a changed attachment contract.

The original zero-height socket branch falls back to the building inside point
and fresh terrain. Slot0 here always has height480, so that branch is unreachable
for supported completed Vaults. Original state1 construction scaling and signed
short-height boundaries are not implemented by the Shrine adapter. Displaced
triggers, missing body bindings, arbitrary non-quarter headings, and future
moving/sinking buildings require their actual anchor/state producer. This change
does not claim native allocator/timing or terminal-lifecycle equivalence.
