# Selector scene: finite static follow-on, 2026-10-15

## Result and implementation boundary

The orbital world-body centre projection and nominal screen radius are now implementation-ready. The actual globe consumer is also located: type5 objects route 00455810 → 00429350 → 004e3bc0, a screen-space concentric-ring globe with radial-angle texture coordinates. It is NOT evidence for a conventional latitude/longitude sphere, nor the browser's flat circular CSS crop. Keep the current panel-only restoration unchanged; do not claim the whole selector restored.

No original code was executed or emulated. GNU objdump2.44 and Python struct byte reads only. EXE SHA256 matches 3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f. Existing retained decomp/generated/004e3bc0.c was read after following the live call chain. Its inferred name d3d_set_render_state_5 is misleading, and its prototype omits the seventh argument visible in assembly. Do not blindly translate this export.

## Concrete projection component

00455180 initializes focal length at00739584 to400; current eye at0073958c is(0,2500,200), current target007395b4=(0,0,0). This is setup state, NOT a claim that first rendered camera stays here:00412230 updates desired camera/target,00455410 smooths both before projection. The initial assignments to00739554 include z=-200, but00455180 immediately calls00455610, which copies the current eye with z=+200 over it.

00455610 computes:
- eye E = current0073958c; forward F=normalize(target007395b4-E)
- right R=normalize((F.z,0,-F.x))
- up U=normalize((R.z*F.y, R.x*F.z-R.z*F.x, -R.x*F.y)) = normalize(F cross R)

00455810 copies these bases; body translation B (object+0x24..0x2c, supplied from authored orbital positions at00412654) is projected as X=dot(R,B-E),Y=dot(U,B-E),Z=dot(F,B-E). At type5 path004567fe–00456999:
- centre x=320+object.screenOffsetX+400*X/Z
- centre y=240+object.screenOffsetY-400*Y/Z
- nominal radius pixels=400*object.radius/Z
- the perspective divide is used only for Z>10; otherwise object projected depth is marked-1. Do not confuse this marker with a fully established downstream clipping policy.

Offsets are initialized0 by00456b80. Viewport centre(320,240), size640×480 and bounds639/479 come from00410fd0. Use a single proportional viewport transform when adapting to browser dimensions; do not independently stretch x/y. This projection component can replace authored diagram-style centre positioning once its current/target camera state is supplied. First-frame camera timing/smoothing remains a separate integration requirement.

## Body identity and texture separation

004119e3 passes each parsed plsdata body radius to00456b80; it constructs type5 scene objects, stores radius at+0x5c, sets rotation fields and marks active.004125a0 supplies body translation and available/selected state. Type5 dispatch jump table00456a74 maps to004567fe.

00429350 binds nonzero body index i through the texture-object array. Its exact base is DWORD[0059c1fc], stride112, selected address base+112*i; calls004e3500(0), then texture-binding call00509820. Body index0 uses006792d8 and004e3500(1). This special branch forces UV offsets0 and scale0.5; ordinary bodies use scale0.25 and body UV offsets(+8,+12), with +8 incremented0.02 per draw and wrapped by subtracting1 when>1 (004569dc).

These are orbital-body texture objects, not automatically the selected preview bytes at009bcfe0 loaded by00412780. The producer of0059c1fc is004289b1 (existing graphics-entry.asm); exact per-body asset/palette construction needs the continuation of004289c8 onward. Do not assign selected mission plstx/plspl0 pixels to all bodies without that binding. plsft0/plscv0 have not been tied to this D3D body consumer in this pass.

## Actual globe UV and shading boundary

004e3590 writes Uoffset,Voffset,scale.004e36c0 receives(x,y,z,rhw,sinPhi,cosPhi,theta) and writes:
  u=Uoffset-scale*theta*cosPhi
  v=Voffset-scale*theta*sinPhi
004e3bc0 supplies screen rings x=cx+radius*sin(theta)*cosPhi, y=cy-radius*sin(theta)*sinPhi; theta steps from0 toward pi/2. The exact last ring, adaptive subdivision and triangulation depend on initialized table005d4898; its file bytes are zero, so its runtime producer is the next finite boundary. The stored export has useful loop shape but a broken inferred prototype and ambiguous integer conversion sites.

Nonzero bodies disable the UV-wobble branch; body0 enables it (004e3500 selector consumed at004e3706). All vertices call004e35c0 for screen-relative shade. That shade is bounded56..170;004e36c0 turns it into grayscale diffuse min(255,2*shade), plus grayscale specular max(0,2*shade-256) only if device field+0x6dc enables it. Full polynomial and hardware interpolation are not reconstructed here.004e3bc0 enables render state29 before its indexed textured batch; the separate007396e4 light vector computed by004572f0 is not read by this traced sphere leaf, so do not apply it as a guessed Lambert light to these bodies.

## Stop condition and next exact work

This pass stops with a usable centre/radius projection and precise remaining boundary: texture construction004289c8 onward + initialization of005d4898 + full004e3bc0 adaptive mesh/004e35c0 shade. A later finite slice can reconstruct the nonzero-body mesh/UV/shade using these leaves, avoiding engine-wide decompilation. Body0 glow/wobble and exact device texture quantization should stay separate. No active plsbackg consumer was established and no gold full-screen background is justified.

## Receipts

New raw files in /tmp/selector-static: scene-init.asm(455180–455410), scene-geometry.asm(455610–456300), scene-bodies.asm(45663f–456a90), scene-constructors.asm(456a80–4572f0; starts inside jump table, actual first function456a90), scene-space.asm(4572f0–457a00; relevant function ends45747e), sphere.asm(4e3500–4e3e50), sphere-mesh.asm(4e3bc0–4e42b0), scene-constants.json. Existing setup/render/blits/graphics-entry/entry/renderer packets support caller claims. Commands were objdump -d -Mintel --start-address=0xSTART --stop-address=0xEND EXE; all exit0. Python constants use PE .rdata VMA58f000/file18d800 and.data VMA598000/file195e00. No tests/browser/Ghidra/probes run; not applicable to static-only claim. No repository edits. Read-only git attempt returned HEAD053cda0d35c8d508915cd74c7f07b7ed0ee66792 then git status failed fatal:bad object HEAD; repository writer owns source and this research does not depend on checkout cleanliness.
