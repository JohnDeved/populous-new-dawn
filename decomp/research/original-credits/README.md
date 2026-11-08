# Original Credits: source recovery, implementation still gated

Refs #16. Research base `96becd8826afc5a4256a12ccebf3caa61729e24b`,
20 October 2026. `app/original-main-menu.tsx` continues to mark Credits unavailable.
No shared menu hook, startup movie, Rolling Demo, campaign, AI, save codec, runtime
asset or parity change. This packet establishes static linkage and content; it is
not a native run, native screenshot, parser equivalence or completed browser feature.

## Recovered source

The documented [input recovery](../../../engineering/native-setup.md) succeeded.
Archive SHA-256 `6aa6c366809ea1d9575ec1d31a24527a95c7332f0a1d2ab692f7a602e7e10702`
was verified before extracting Component0. [source-data.json](source-data.json)
records the exact executable, language and Credits hashes, six bounded code-window
hashes, original text byte-lines and all 101 heading references. The executable and
language hashes match [the existing menu inventory](../original-menus.md).
`data/credits.txt` is 5,308 bytes, SHA-256
`7c821672c19e46bdf19b01f2fe94434f6de5ad18dbb36ea577c8188b96463ef6`.
The packet's Latin-1 representation preserves every source byte, CRLF boundary,
trailing space and blank-space row; it is an inventory, not a proposed UI parser.
The archive's other language files are three-byte placeholders; they do not provide
additional translated Credits evidence.

| Source | Established boundary |
| --- | --- |
| [entry.asm](entry.asm), `004c5af0` | Menu descriptor `005d7d20` uses label445 and this callback. After a conditional pointer-surface call, it requests **state12** via `00442a60(12)`, not a Credits submenu number. |
| [state-request.asm](state-request.asm), [dispatch.asm](dispatch.asm) | Request writes pending state `0088f001`; main dispatcher maps state12 through byte-table index5 to `004a4771`, which calls `004a9380`. |
| [loader.asm](loader.asm), `004a99d0` | Starts scroll position at screen height+1, clears three input byte-pairs, then loads configured `%s\credits.txt`, falling back to `data\credits.txt`, in `rb` mode. The initial cache flag precedes file-open success. |
| Loader `004a9b2a–004a9bd6` | Digit runs form a number, then **1071** is added for a language-table heading. CR separates populated records; characters >=32 are retained. Blank-space rows are significant. Do not trim, sort, deduplicate or replace the names. |
| [draw.asm](draw.asm), `004a96f0` | Nonzero heading IDs resolve through `00972ba8`, with a 30-unit gap before a heading. Headings and names separately wrap through `0045ec10`, center using `(screenWidth−measuredWidth)>>1`, and advance by current font's `A` height. Text above y=-20 is skipped. Exact wrapping/font metrics remain unbound. |

Heading ID0 resolves to language1071 **Production**, not a sentinel. The authored
order starts `0,1,2,3,4,5,6,7,13,8`; after ID94 (Populous Webteam), ID2 appears again
and resolves to **Producer**, followed by Dan Blackstone. Replacing it with ID95
(Web Team Associate Producer) would change the supplied original content. The final
heading is ID107 / language1178, **Thanks To**. Source bytes EB/ED/F6 encode the
accented names retained in the packet; this is not UTF-8 input.

## Timing, input and return: precise scope

[controller.asm](controller.asm) initializes the previous clock from the verified
`KERNEL32.dll!GetTickCount` import at `00d0c784`. The active branch defaults to
16 ms per decrement of `0098e7ec`. When the consumed code at `00984898` is `0x39`,
the current invocation uses 4 ms. `004a969c–004a96ba` catches up while **now > previous**,
decrementing position once and adding the chosen interval to previous each time.
These are source-level clock/position facts, not observed refresh-rate behavior,
a proved held-Space acceleration contract, or permission to choose a CSS duration.
Clock-wrap/suspension behavior would require a documented modern adaptation.

Code1 requests state7; three current/previous byte-pairs at
`00984681/00984781`, `00984683/00984783`, and `00984682/00984782` also enter the exit
path when current is nonzero and previous is zero. The controller clears
`00984898` each pass. Escape/Space and mouse-button meanings are plausible from
known scan-code conventions, but full producer/delivery/held-at-entry proof is
still required before wiring browser controls. Do not reuse movie “any key” behavior.

The draw traversal restarts at the first record after its tail, adding screen
height+20 to the local y; when nothing was drawn it resets the global origin to
screen height+1 (`004a998e–004a99b0`). **No automatic end-of-list exit is evidenced.**
The observed exit request is state7, not proof of selected Credits-row focus.
State7 lifecycle/menu initializer and input carry-over remain to be traced before
claiming native focus return. Browser focus restoration must be explicit if adapted.

## Remaining implementation proof

1. **Artwork, colors and font identities:** bind `0087eff8`, palette/color globals
   `0089c6f4/f5/f6`, clear helper `00529940`, and active font globals
   `0087cbdc/e0/f4` to loaded resources. `00493210` chooses another font path for
   language modes9–11. The non-special branch uses different heading/name pointers;
   neither FEFT33WE nor the main-menu backdrop can be assumed. Trace the resource
   records/loaders before any scoped import. Exact glyph metrics determine wrapping
   and total scroll duration; headings/names alone cannot establish layout.
2. **Input:** trace the producer of `00984898` and the three button pairs through the
   state12 loop, including press/release, held entry, acceleration repeats and exit
   carry-over. Existing movie input research is a lead, not Credits acceptance.
3. **Return:** complete state12 teardown → state7 entry → selected menu/row and cursor
   restoration. No full focus-return claim follows from `00442a60(7)` alone.
4. **Browser acceptance:** only after those sources are complete, implement an isolated
   component and one small entry hunk, then verify actual activation/exit/focus,
   elapsed timing, standard/wide/DPR rendered screenshots and required code gates.

These are engineering proof gaps, **not missing/unavailable original inputs**.
No new operation was denied in this task. Prior #86 safety-status failures remain
untouched: no original binary execution/emulation or denied native-check retry.
Parent owns review/integration; this work reserves no shared production file.

## Reproduce and checks

Use the recovered base-game root with the pinned Python archive reader and
Capstone5.0.6. From the repository root:

```sh
python decomp/research/original-credits/check.py --game /path/to/game \
  --output work/orchestration/issue16-credits/new-source-packet
```

The check authenticates all three inputs before decoding or writing, verifies
39 selected instructions and 11 data conditions, and requires complete decoding of
all six bounded windows. Output must be a new directory; original bytes are read
only. It does not import/execute a native harness. The PE helper's class is reused
solely for authenticated byte/address/import reads; its native-topic check is not run.
Compare emitted `.asm` files and content fields with this retained packet.

Static proof: **passed** on the recovered inputs (Python3.12, Capstone5.0.6).
One initial expected-index assertion failed (the second ID2 is ordinal89, not88);
corrected against the raw source order and rerun. Archive extraction and a scratch
helper-name collision were resolved; neither was a permission denial.
Full check/build and rendered screenshots: **not applicable to this research-only
change**; no browser feature or appearance changed. Focused structural validation
and input-rejection/packet-reproduction checks are recorded in the PR handoff.
