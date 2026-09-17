# Original loading artwork, selected callers and load failures

**Publication baseline: 2026-09-17.** This note publishes the accepted loading-mask
research and a bounded follow-up through the show/clear callers and resource
loader. It does not certify the browser loading implementation or close issue18.
The evidence is original executable/data bytes; no native execution, emulation,
Ghidra export, callee interception or final GPU rasterization was used here.

## Reproduce from a fresh checkout

The tracked [static checker](../../scripts/check-static-loading-art.py) uses the
existing sibling [PE32 reader](../../scripts/check-static-mission18-sky.py),
Capstone 5, and Pillow only for optional research previews. It resolves its reader
relative to the script, not the working directory, Git head or ignored scratch.
The existing documented Python environment is sufficient; no new dependency or
framework is required. See [native input guidance](../../engineering/native-research.md).

```sh
python3 -B scripts/check-static-loading-art.py --data-root /path/to/original-game

# Optional: retain all original-byte windows and two decoded mask previews.
# This must be a new directory; existing evidence is never overwritten.
python3 -B /absolute/checkout/scripts/check-static-loading-art.py \
  --data-root /path/to/original-game --output /path/to/new-research-output
```

`--exe` may override the default `DATA_ROOT/d3dpoptb.exe`, but cannot bypass the
canonical executable hash. All required original inputs are identity-checked:

| Input | SHA-256 |
|---|---|
| `d3dpoptb.exe` | `3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f` |
| `data/loadlogo.dat` | `4e4c1c3eda079427d744dd102695b717a08261ca20f461c1e9efb7357c6fce87` |
| `data/loadlog2.dat` | `ef0b112f4fa1d357637380f287e5f517538dd79eff75b1b42b2c0955e9d61a56` |
| `language/lang00.dat` | `e826c478746d666a3ea9ea36cb7804d1d226d5f83084230987b1de293066cf7d` |

The initial accepted receipt had 26 checks. The reusable checker preserves those
conditions and the exact four original byte windows, then adds caller/loader
assertions and enforcement of the language-file identity. Historical receipts
are not edited or treated as executions of the newer checker. Its report records
the current source/reader/input fingerprints and all disassembled windows.

## Artwork and layout actually consumed

**The default executable reference is `data/loadlog2.dat`, not `loadlogo.dat`.**
The path begins at descriptor `005a3b30`. Both supplied files contain 20,930 bytes;
`loadlogo.dat` uses 0/255, while `loadlog2.dat` uses 0/254/255. The files are related,
but a direct caller for `loadlogo.dat` has not been established.

The native consumer `00522c00` establishes **130×161 row-major mask bytes**, rather
than a compressed image or a guessed palette:

| Address | Original behavior |
|---|---|
| `00522e40`, `00522e56` | Subtract 130/161 from screen width/height, then divide toward zero by2. |
| `00522ec9` | End a source row after 130 bytes. |
| `00522ee9`–`00522ef3` | Zero skips the destination write; any nonzero byte reaches literal `0xffff` word storage. |
| `00522ef5`–`00522efd` | Advance the source one byte and stop at the loaded end pointer. |

Thus the normal placement is unscaled, with origin
`(trunc((W-130)/2), trunc((H-161)/2))`. **254 and 255 do not select distinct logo
colors in this loop.** The preview PNGs intentionally show only this nonzero
silhouette; they are not reconstructed loading-screen screenshots.

The consumer also reads the localized loading-label pointer at `009733b4`; the
supplied English table's entry 515 is `Loading...`. Text measurement/drawing is
performed by the existing font helpers. When the logo exists, the code moves the
label above it and makes two text passes involving FE/FF and an offset. Exact
shadow/palette meaning and glyph metrics remain unvalidated. A 512×384 compatibility
branch adjusts buffer placement, and an alternate one-byte destination mode still
contains the word store. Do not generalize either detail into a faithful browser
scaling, shadow or eight-bit raster claim.

Retained [main_3](../generated/004a4450.c) and bytes `004a456a`–`004a457a` show that
`font_type == 11` changes filename character 12 from `2` to `3` before initialization.
That is a **font-mode condition**, not a mission-number selection. Availability of
`loadlog3.dat`, precise language semantics and any other artwork variants remain
outside this proof. No mission-specific loading image is established.

## New caller evidence: real resource-loading entry, not a percentage

`005231c0` is the boolean wrapper for `00522c00`. It maps a zero byte to clear-only
and a nonzero byte to show; the consumer itself checks for value 1. The consumer
clears/presents through two buffer passes. That fixed buffer count is **not a
progress metric, artificial delay or fade-duration requirement**.

The follow-up ties the primitive to selected actual callers:

| Original caller | Proved order/condition |
|---|---|
| [draw_main `004a4960`](../generated/004a4960.c), state `interface_state_3 == 1` | At `004a49a4`, show1 precedes `load_files` (`00429c70`), water resources and `load_hspr` (`0042a770`). After those calls, `004a4a0a` sets state3. |
| [load_files `00429c70`](../generated/00429c70.c) | `00429cc7` requests show1 after palette setup, before later resource work. |
| draw_main's later state branch | `004a4b2a`–`004a4b51` select `004a4d2c` for state2==10 or state3==4/5; that leaf requests clear0. Earlier control flow can exit instead, so this is a branch condition, not an unconditional teardown guarantee. |
| Palette-update routine `004a27d0` | Its entry calls show1; this alone does not establish progress or a loading animation. |

This resolves the earlier absence of a proved resource-loading caller. It does
**not** prove a complete event pairing for every mission, checkpoint, cancellation,
error or mode switch. In particular, show-before-loading is not an original
asynchronous-ready Promise or proof that every resource result was checked. The
original scene can replace the displayed buffers on subsequent normal draws;
do not invent a mandatory final clear-call handshake from this partial trace.

Other direct byte-reference leads exist, including frontend/video-mode contexts.
They were not broadened into a full lifecycle audit. The boundary is now complete
path coverage and resource-success integration, rather than an unidentified
`005231c0` caller. Worker2's actual readiness/error/cancellation tests remain
independent requirements.

## Resource descriptor and failure propagation

The startup routine `004a4f70` loads the array beginning `005a3470` at `004a501d`.
The mask descriptor is entry6, stride `0x120`, immediately before the `!` terminator
at `005a3c50`. Its file-backed values are:

| Field | Value |
|---|---|
| Path | `data\loadlog2.dat` |
| Data destination, descriptor+`0x10e` | `005cd8e8` |
| End destination, +`0x112` | `005cd8ec` |
| Initial size, +`0x116` | 0 |
| Flags, +`0x11a` | 0: ordinary byte-buffer loader |

The selected path is:

```text
004a501d -> 0049bdf0 (array walker) -> 0049beb0 (descriptor)
         -> 00527380 (open/load/close) -> 00527350 (virtual load)
         -> [0058f640 + 0x0c] == 0052adf0 (plain byte-buffer load)
```

The retained [array walker](../generated/0049bdf0.c),
[descriptor loader](../generated/0049beb0.c) and
[file wrapper](../generated/00527380.c) are corroborated by the checker's bytes.
The plain loader asks the file object for its length, allocates that count and
requires the read result to equal it. A zero length, allocation failure or short
read returns -1; a short read frees its temporary buffer. The outer wrapper returns
-1 on open failure. On success, `0049beb0` publishes the data pointer, byte count
and `end = data + count`. No compressed/sprite decoder is selected by this
zero-flags descriptor.

The array walker keeps loading subsequent descriptors while accumulating false
if any descriptor fails. **This particular startup call discards that return:**
after `004a501d`, bytes `004a5022`–`004a502e` proceed to unrelated palette state
without testing AL. The rendering leaf separately skips the logo when its buffer
pointer is null and can continue to the text branch. Those findings are not a
reason to suppress browser asset failures: the old unchecked startup behavior is
not a desired failure/retry contract. Repeated loads, stale-pointer cleanup,
file-wrapper internals and exceptional out-of-memory behavior are not fully
executed or certified here.

## Integration boundary

The useful reusable facts are the default original mask, its normal centered
layout, selected show/clear callers and the descriptor's actual read/error chain.
The source/runtime owner may use them without inventing progress percentages,
minimum delays or mission variants. Font/shadow/512×384 details and full native
lifecycle/GPU fidelity remain explicit gaps.

No runtime, stylesheet, loading contract, asset, importer or provenance change is
part of this evidence publication. The checker produces only explicitly requested
research output; it does not install artwork. Shared research/mapping index entries
are proposed in the PR for CEO integration, not silently edited by this worker.
