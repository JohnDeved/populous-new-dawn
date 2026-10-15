# Ordinary selector globe: bounded static continuation

2026-10-15. No repository writes, checkout, tests, browser, original execution or emulation. Read AGENTS, populous-engineering, native-research, previous panel/scene packets, retained 004e3bc0.c and 004306d0.c. Input EXE SHA256 verified: 3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f. GNU objdump disassembly and Python file-byte reads only.

## Implementation-ready result and immediate UI implication

Ordinary (nonzero-index) orbital bodies have independently constructed, mission-specific 128×128 colour textures. Their preparation, radial UVs, ring subdivision and screen-relative vertex shade are now source-bound. The current 512×512 PNG importer reads the source bytes as one linear image; it does NOT implement the active orbital constructor's four-tile arrangement or 4×4 averaging. Reusing those PNGs directly for orbital bodies would preserve the wrong arrangement. Do not mutate existing generated assets casually: use a scoped orbital-texture importer when implementing, retaining current preview provenance separately.

The safest immediately implementable component is the ordinary-body texture preparation plus vertex-shade helper below. A faithful browser globe should use these with the recovered ring mesh, rather than a latitude/longitude sphere or flat CSS crop. Complete original-game pixel parity still requires target-device texture conversion/filtering and rasterization; current/desired camera smoothing and first-frame timing remain separate integration boundaries. Body0 is a separate sun.png/wobble/glow path. No active plsbackg consumer is established.

## Texture identity, palette and tile arrangement

004289c8 reads body-record+0x28 from DWORD[005f13bc]+52*i and invokes 00428b90(mission,256,textureObject). The record's mission value is populated from decoded plsdata at00411977–0041197a; this is not necessarily equal to body-array index. Texture object is DWORD[0059c1fc]+112*i, exactly the nonzero-body object bound at004293f1–00429426.

00428b90 calls004852f0 on that mission, converts the returned bank to a digit or lowercase letter (fallback bank1 if header read fails), formats data/plspl0-%c.dat and data/plstx%03d.dat, reads1024 palette bytes and262144 texture bytes. It does not use009bcfe0, the selected-world global preview buffer loaded by00412780. Same resource family, independent per-body construction and palette.

00428c97–00428d86 creates a512×512 24-bit colour surface, then iterates destination y=0,256 and x=0,256. Each source descriptor is256×256 indexed bytes; source advances65536 after each tile. Conversion004306a0→0052a510 receives the mission palette. Thus for source image coordinate x,y in0..511:
  tile = 2*floor(y/256)+floor(x/256)
  sourceIndex = tile*65536 + (y%256)*256 + (x%256)
  RGB = palette[texture[sourceIndex]*4 + (0,1,2)]
This is TL,TR,BL,BR sequential tile order, not512-byte source row stride.

Format initializers00529610 and005296a0 define indexed8 and RGB24 masks. Palette converter00554640 copies256 four-byte entries and maps palette low/middle/high bytes to red/green/blue masks; the24-bit output byte order is B,G,R.005547e3 emits three bytes per converted pixel. Conversion has no palette-index transparency key here.

00428d8c onward allocates a128×128 target (512>>2).004306d0(mainSurface,2,2) averages every4×4 source block in each colour channel with integer sum>>4, in place in the source surface's original pitch.004306a0 then copies the128×128 top-left result to the device texture;00428e29 attaches it via00509860. For portable RGB output, each channel is floor(sum of16 decoded channel bytes/16). These are averages in encoded byte space, NOT linear-light filtering and NOT palette-index averaging. Final device pixel-format quantization is separate and depends on uiStruct+0x1da0. Returning ordinary full-colour RGB is a source-bound adaptation, not a claim to match every original GPU format.

## Exact subdivision initializer and parameter correction

004e3450 writes table005d4898 with float32 pi multiplied by float32 factors:
  [.2,1/6,1/7,.1,1/12,1/14,1/15,1/16,1/17]
The file contains the approximate float32 values, not mathematical rational constants. Static initializer pointer004e3450 is at VMA00598118 (file195f18), inside00598000..005981bc.0055d550 passes this table range to0055d6a0, which calls each nonzero pointer; startup calls0055d550 at0055d78e. Thus this is an actual startup constructor, not merely an uncalled potential producer.

The sphere leaf actually takes SEVEN arguments including device:
  004e3bc0(device,cx,cy,R,zBase,zDelta,quality)
00429458 pushes quality=1.2000000476837158. The retained six-argument pseudocode is incomplete. All __ftol calls here truncate toward zero:0055bc54 explicitly sets x87 rounding-control bits0x0c00 and restores the original control word.

For positive radius:
  n=trunc(R); if n==0 return
  k=floor(log2(n)); if k+1>=9 return (n>=256)
  angle = table[k] + (table[k+1]-table[k])*(n-2^k)/2^k
  fullSegments = 2*pi/angle
  rings = min(32,trunc(quality/(2*pi)*fullSegments))
  deltaTheta = (pi*.5)/rings
Centre vertex is(cx,cy,zBase,1/(zBase+.05),sinPhi=0,cosPhi=1,theta=0). Store previousRadius=0, previous ring count1. For j=1..rings-1:
  theta=j*deltaTheta
  rho=R*sin(theta)
  count=min(128,trunc(rho/(rho-previousRadius)*pi*2))
  deltaPhi=2*pi/count
  ringDepth=zBase+zDelta*sin(theta)
  rhw=1/(ringDepth+.05)
  vertex(phi)=(cx+rho*cos(phi),cy-rho*sin(phi),ringDepth,rhw)
  previousRadius=rho
The final ring is strictly BEFORE pi/2: never add an invented equator ring. Exact native vertex values use sin/cos increment recurrence and float32 stores; evaluating each angle independently can differ slightly. The native mesh has hard2048 vertex/4096 triangle bounds. The source shown is for valid positive radii and normal quality, not a recommended policy for malformed/negative inputs.

## Ordinary-body UV and mesh linkage

For nonzero bodies00429350 calls004e3500(0), which disables wobble/glow selection, and004e3590(offsetU,offsetV,.25).004e36c0 writes:
  u = offsetU - .25*theta*cosPhi
  v = offsetV - .25*theta*sinPhi
These are unwrapped coordinates; do not clamp to0..1. The scene body updates its offsetU by.02 per draw, subtracting1 when>1. This is render-call based, not an established seconds-based animation contract. Texture addressing/filter behaviour must be retained or explicitly adapted.

The adaptive triangles stitch each previous/current ring by advancing whichever next polar angle comes first, with two closing seam triangles. Existing sphere-mesh.asm004e3f03–004e408a and retained004e3bc0.c document the exact compare/index order; do not replace this with independent triangle fans if claiming native geometry. At the centre the count1 previous ring generates the fan as a special case of that stitch. The outer-ring silhouette can be visibly polygonal. Screen radius R is nominal; the last ring's rho is smaller.

## Fully recovered screen-relative vertex shade (004e35c0)

Let X=(x-cx)/R and Y=(y-cy)/R, with screen y increasing downward. Then, for vertices generated inside the sphere:
  q = X*X + Y*Y
  L = .8*sqrt(1.05-q) - .4*Y + .4*X
  shade = clamp(trunc(170*(.2*L^4 + max(-.2,.4*L) + max(0,4*(q-.9)) + .4)),56,170)
This is screen-relative light toward upper-right, including the high-radius rim term. It is not the unrelated world light computed at004572f0. Constants are source float32, except1.05 stored as a double.004e3671 clamps the negative diffuse term with an unsigned float-bit compare; on finite generated vertices this is equivalent to max(-.2,.4*L). Native intermediate float32 stores and x87 precision matter at quantization edges; the formula is the mathematical component, not a byte-for-byte x87 emulator.

004e36c0 uses grayscale diffuse=min(255,2*shade), alpha255; if device+0x6dc is nonzero, grayscale specular=max(0,2*shade-256), otherwise zero. Specular alpha0. Values are interpolated by the original indexed textured triangle path. Per-fragment recomputation of this formula would be a visual approximation rather than the original vertex interpolation.

## Verification and exact remaining boundary

All cited disassembly/file reads exit0 except expected searches with no match; no build/test/browser/original native probe was run or claimed. Input hash matched. New raw files: body-texture.asm, sphere-init.asm, texture-conversion.asm, texture-dispatch.asm, texture-formats.asm, texture-converter-select.asm, palette-to-body.asm, surface-layout.asm, static-init-chain.asm, float-truncate.asm. Prior graphics-init.asm completes00428b90. Prior sphere.asm/sphere-mesh.asm retain shade and ring code. Source constructor/raster observations are separate from selected-preview PNG importer behavior.

Stop here: the requested bounded ordinary-body texture/shade component is implementation-ready, with exact geometry recipe and triangulation source retained. Next integration should explicitly choose target sampler/device colour adaptation, port/verify the ring stitch and camera state, and validate it in the shipped selector. No additional broad engine decompilation is needed for that step. Do not label a generated component preview an original-game screenshot or imply restored full-screen composition.
