# In-game Options slider palette (static-only)

## Result
Use data/pal0-c.dat for the bounded initial Mission1/default-battlefield static igmslidr.spr import. Native uses the CURRENT landscape palette, not the frontend fepal1.dat. This is not proof of full original rendered-pixel fidelity. For all opaque indices in these three slider frames, supplied pal0-{0,c,s,p,d,g}.dat RGB values are identical, so static RGB output also happens to agree across these six tested palette banks.

## Source and method
Read-only repository /tmp/populous-raid447-fallback-0229, assigned base7ae169b. Reviewed root AGENTS, local populous-engineering skill, GOAL, engineering README/native-research and /tmp/options-native-proof/findings.md. No repo writes, EXE execution, emulation, Ghidra, browser or generated-asset writes. GNU objdump2.44 static disassembly; Python3 supplied PSFB decoder imported without invoking its command-line main. Full source input hashes and decoded opaque index sets in data.txt; reproduction check.py. Commands exit0. Temporary executor transport failure recovered on next read; no restriction bypass.

EXE SHA256 3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f.
igmslidr SHA256 ab91567305e23bdbe9923cd8b9ea49956a562fd06dcf549513f27db1220d63da.
pal0-c SHA256 6c61cd586fc96ef5f777c71966a9ac1875491a4a521342ba06d108df5e92bf53.
Mission1 HDR SHA256 4b89ef6d64e4010bb3ec3b5985d0edc8e710504e8b1bc75a6ae688bd6eb070a6.

## Exact chain
- Existing slider proof:00459810 selects igmslidr frame-table00749de8 for in-game path, passes frame to005162e0.
- bank.txt:0051623a subtracts00749de8, divides by8 and range-checks against00749dec;00516252 returns bank009bc1c0.
- draw.txt:005162e0 calls00516170 then submits bank/frame to0047dc50 (or selects software path0052a7e0 when005da078 nonzero). No separate frontend palette selection here.
- setup.txt:004b68ca loads current palette pointer[0087eff8], pushes it with AL pointer0087f000 into00476570;004b68e4–ee assigns resulting shared palette struct to005d2108,0087cbc8,0087cbcc. Retained decomp/generated/004b6820.c identifies these as texture/sprite palette structures.
- Same setup004b6cb4–dd constructs bank009bc1c0 from object00749ddc, shared storage009bc2c0 and sprite caches00993080/009a7920, with DirectDraw palette from UI+0x6c0. The immediately preceding blocks construct HFX/HSpr/pointer banks using the same shared storage/caches/palette, followed by fonts.
- palette-loader.txt:00429c7f resolves palette filename template00892713, reads1024 bytes into[0087eff8] at00429ca7.00429cbd calls004a32d0(palette,1); this reserves indices254/255 as grey/white.
- palette-update.txt:004b6330 loads[0087eff8] and004b633c sends it to005209c0; palette-set.txt shows this sets256 entries on UI+0x6c0 through vtable+0x18.
- Mission1 levels/levl2001.hdr byte96 is12. Retained early-mission sky proof and filename-selector.txt show bank12 maps via +0x57 to c.0042a140 resets bank0 defaults and substitutes the bank character only if candidate palette open succeeds. Thus successful Mission1 palette load uses data/pal0-c.dat; failed open uses bank0 defaults, not stale prior-level filenames.

## Static index check
check.py uses the existing import-original.sprites decoder with identity-index palette and inspects only opaque pixels. Frames308x19,23x22,23x22. Used indices are all in130..247, with track specifically160,167,169; neither254 nor255 is used. Native reserved-color rewrite therefore does not affect these frames. For all used indices, pal0-c RGB equals supplied0,c,s,p,d,g palettes exactly (data.txt).

## Boundaries and implementation
Static supplied RGB palette decoding is justified; native pixel-format quantization, alpha texture conversion, filtering, tint/flags, gamma, runtime palette effects and final rendered compositing are not fully verified. No actual original load outcome or screenshot was observed. Do not claim full pixel parity or universal palette invariance beyond the six compared banks. Existing frontend slider still needs fepal1, as separately proved.

Parent may retain these concise findings plus scoped disassembly/data/check script under existing menu research evidence. Full all-disassembly.txt is scratch navigation only and need not be committed. Next implementation: scoped importer uses igmslidr+pal0-c and feslider+fepal1 separately, with verified source hashes and explicit static-render limits.
