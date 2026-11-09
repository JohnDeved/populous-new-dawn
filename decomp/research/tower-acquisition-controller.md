# Tower building-acquisition controller

The M4 screen path uses the existing building acquisition owner, not the spell
model-4 path. Original descriptor 005a7358 selects geometry79, HFX1076 and HUD
control3. The authored trigger1 has one slot0 link to reward0, payload `[2,4,1,1]`.
Creation admits this exact local Vault provenance; it does not retag old gifts.

## Source and material evidence

The [original-input audit](https://github.com/JohnDeved/populous-new-dawn/issues/23#issuecomment-6727533160)
and [independently accepted controller comparison](https://github.com/JohnDeved/populous-new-dawn/issues/23#issuecomment-6728055918)
bind original EXE SHA256
`3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f` and
OBJS/FACS/PNTS to the current imported geometry. Model79 has76 faces,125 triangles
and scale160:20 mode6 faces and56 mode7 faces, with no Temple mode32 material.

The unchanged [historical source-derived reference](https://github.com/JohnDeved/populous-new-dawn/blob/5fedc5f6ae08c6b8223d6b989717cfff334f649c/decomp/research/building-acquisition-screen/composed-geometry.mjs)
was extended only with original model79 corners. Initializer004819c0 and
controller004839f0 retain the same phase parameters. Normal Tower retirement is
reference UI visit117, first face selection87, all76 faces started106, and pulse
requests90/116. Initialization consumes304 cosmetic RNG values. These are finite
controller results, not companion-tail duration or wall-clock constants.

Three paused calls retire at121 (initial),120 (whole phase),119 (flight), or120
(pending phase transition). Pending advancement precedes the pause guard, while
paused CPU geometry can affect eligibility. No fixed lifetime replacement or
additional presentation clock is introduced. Camp126 and Temple135 remain the
normal controls. Supplied viewport/target coordinates are not measured native or
browser layout.

Original texture flags005aa218 match all256 imported bytes. The whole/per-face
producers00473118–00473136 and00473b15–00473b33 add local tribe0089c6f0 for bit0
textures. Tower uses base tiles186 and226, selecting186–189 and226–229 for
tribes0–3. All eight complete crops match authenticated c/d banks and the dedicated
Tower atlas. These sets do not cross a row, so the existing UV representation uses
horizontal tribe/8 offsets. This does not justify remapping unflagged textures.

The [scoped material importer](tower-acquisition-material.md) changes only the five
proved RGB pixels in tile127. Other pixels and all alpha remain unchanged. Use
`tower-model-d` only for screen geometry79, with ordinary encoded-color bilinear
filtering and no mipmaps or anisotropy. M4 startup requires this atlas; failure
rejects readiness instead of silently using bank c. No new world atlas is implied.
The exact companion HFX318–321 ordinary-PAL trails, HFX1288–1299 AL sparkles and
five tint selectors were separately proved equal between c/d, so the existing
effects material remains valid for that subset.

## Integration and checks

Explicit mappings4→79,5→95,7→103 are used for initialization, draw identity and
panel return. The family-aware HUD bridge distinguishes Tower building4 from
Tornado spell4 and measures the actual allocated locked Tower control. The screen
collector reads local-tribe flags without advancing state. The shared companion
and pulse owners and their ordering are unchanged.

`tests/tower-acquisition-integration.test.mjs` covers the committed M4 record with
the real extracted provenance function; injected effect/terrain leaves around
gift creation; the real extracted gift scheduler block; finite controller cases;
shared companion replacement/clone continuation; all125 collected triangles and
tribe offsets; actual Scene draw/texture/preload code with supplied DOM, canvas,
loader and renderer leaves. These controls do not mount the game, execute native
instructions or draw pixels. The unchanged historical Camp/Temple fixtures and
family tests remain required.

`tests/building-acquisition-runtime.test.mjs` adds current-world M4 completion,
pending/active checkpoint, restart and82-visit grant coverage. That broader test
needs the normal qualified runtime and must pass before runtime acceptance. A
structured-clone controller test is not checkpoint-loader or IndexedDB proof.

The six scheduled world visits to hide/handoff remain independent of the82-visit
building grant. UI arrival must never apply the spell payout clamp to Tower.
The existing current checkpoint format and world artwork are unchanged.

Before readiness: complete planner/quality/typecheck/check/build gates, actual
ordinary M4 acquisition and locked target, resize and pause, replacement, current
new-game/restart/Save/Load, companion composition and affected native/rendered
evidence. Keep the change Draft until those gates and fresh independent review
are satisfied. No original raster, absolute timing, hardware performance, parity
or completion of #23 is established by bounded source controls.
