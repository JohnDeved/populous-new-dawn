# Campaign-popup caller contract and remaining body-layout boundary

## Status and direct dependency

Issue #133 is a bounded prerequisite for the remaining original popup fidelity in
#59, which contributes to #10. This note narrows the caller interface but **does
not prove the popup body layout, font, frame, interaction or absolute cadence**.
It is useful research-only partial work, not a released UI change or closure of
#133/#59/#10.

The source branch starts at main `492e654a307cc13ed1bea20988ab00a2f03a8901`.
Only this note is changed. Existing campaign-message motion, seam, publication,
page/CSS, clocks, RNG, assets, and active Workers 3/6/7 scopes remain untouched.
PR131 remains at `b3948f9886a92c8e90e5f8accdb232c742757bd9`.

Five critical candidates were compared: #59, #75, #90, #74 and #83. The latter
four have active/shared navigation owners or explicit #86 source-operation blocks.
The independent retained-source popup interface was selected over replaying those
operations. It requires no queue controller. New disassembly preparation and
static-checker creation later received separate indeterminate safety denials;
neither was retried or rerouted. No new original-byte/executable proof is claimed.

## Retained evidence identity

These are already-retained Ghidra exports, not compilable original source. Names,
parameter types and prototypes can be inferred. Both whole-file SHA-256 values
were checked against the existing `decomp/exports.json`; that manifest and the
exports were not modified.

| Retained source | SHA-256 |
|---|---|
| `decomp/generated/004314c0.c` | `2e621d130bafbaf37f6e53c860243eb4a61ccb5752588027953433106bd49800` |
| `decomp/generated/0049f9c0.c` | `595c45ff9c76741a5bc7db1069919cc43efb639087e0d47bbf3afb3d32ae90e8` |

The original EXE identity attached to the retained message evidence is
`3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f`.
The available EXE was rehashed and matched, but it was not executed or newly
disassembled for this result.

Existing [campaign presentation](campaign-message-presentation.md),
[publication regression](campaign-message-regression.md),
[Mission 2 message 103](mission2-message-103.md) and
[positioned message](mission2-positioned-message.md) findings remain authoritative.
The already accepted PR95 publication repair is not reopened here.

## One ordered caller transaction, not a body rectangle

The retained `004314c0` branch does the following, in this order:

1. Motion has already run. The branch also requires the native `land_flags_1`
   bit 0x2 pause/control gate to be clear. In the oldest-first list, consider at most one pending
   message: the selected-slot guard starts at `0xffffffff`, pending bit 0x20000 must
   be set, and at least one collision/settled bit in 0xc0000 must be present.
2. Clear pending 0x20000. Only an ordinary record with flag 0x10 enters the popup
   controller sequence. A non-ordinary record can consume the selection without
   invoking that sequence; do not generalize it to a browser open request.
3. Build the first argument's low byte as described below and call `004af440`.
   The second argument is shown as the sign-extended 16-bit value at message+0x12.
4. Build a rectangle from the notification strip and this record's parameterized
   position/height, then pass its address to `004afac0`.
5. Pass the selected notification slot's low byte to `004af630`.
6. Set transient flag 0x2 on the chosen message. `0049f9c0` later consumes/clears
   that bit while drawing the notification strip.

The caller rectangle is `[left, top, right, bottom]`, expressed in its local
variables as `local_14`, `local_10`, `local_c`, `local_8`. Left is the signed-short
screen-width conversion of strip X 0x2800; right adds the converted strip width.
Top is the converted message position; bottom adds converted message height.
Strip width starts at 0x0ccc and gets 0x66 added when the converted pixel width is
odd. These conversions and the modern HUD-seam adaptation are already explained
in the retained presentation note.

**This is a notification anchor supplied to another consumer, not proof of the
popup body's final position or dimensions.** The existence of `004afac0(rect)`
does not establish that the body uses the rectangle verbatim. In particular, neither
the browser's 340px popup width nor a replacement inferred directly from 0x0ccc is
justified by this caller alone. The earlier source note deliberately left the
body as a browser adapter, and that limitation still applies.

## Three distinct low-byte modes

The retained caller preserves the high 24 bits of the flag word while constructing
the first argument to `004af440`. Its **low byte** is:

| Condition, in priority order | Low byte |
|---|---:|
| flag 0x100000 is set | 1 |
| otherwise, flag 0x1 is set and flag 0x200 is clear | 2 |
| otherwise | 0 |

This is not a claim that the callee's entire parameter is a plain enum or that the
three values mean modal/modeless/tooltip. The callee is not yet bound. It is a
caller distinction that must not be erased in a future popup implementation.

For example, considering the mode expression alone, flag words 0xd1, 0x2d1 and
0x36f1 yield low bytes 2, 0 and 0 respectively. Whether the caller actually reaches
that expression still depends on the pending, collision, ordinary-record and
per-visit selection gates. The mode table is a source-reading derivation, not a
new native runtime test or an exported three-value fixture.

## Strip renderer is a separate owner

`0049f9c0` initializes strip draw state from message position/height and the shared
strip X/width. It calls `004a1dd0` with strip descriptor `DAT_005caba8`, selects
message-type/icon state and clears transient 0x2. This retained strip-renderer path
is not evidence for the popup body's frame, text region or controls.

`app/page.tsx` currently renders the browser popup body in a `<details>` element.
Its body CSS uses a 340px width, 12px Arial text and a ridge border. Reading the
native strip descriptor or the separate tooltip border table is insufficient to
claim those body choices match or to choose substitute sprite IDs. No such asset,
frame, palette or typography mapping is inferred in this note.

## Exact next owner and minimum reservation

The first unresolved controller boundary is the normal `004af440` consumer,
followed by `004afac0` and `004af630`, then their body layout/draw/font/control
consumers. No retained exports for those three entrypoints were found in the
current source tree. The attempted new original-byte preparation was denied before
execution, so there is no newly recovered prototype, callee/dataflow or body-state
result to use here.

Worker1 retains the new source-contract child #133. After supported resolution of
#86 for the denied operation, bind those consumers from original evidence and
identify the exact body descriptor/layout/font ownership. No page/CSS or global
message/clock change is reserved by this note. A smallest eventual UI reservation
must preserve the caller's ordered mode/string/anchor/slot request and one-shot
consumption while implementing only the newly proved body consumer.

Focused acceptance must then use an ordinary authored message (including a
positioned message), distinguish the notification strip from the open body,
check actual body bounds/artwork/text/control behavior and preserve dismiss/focus,
checkpoint and existing message motion. Native absolute cadence remains a separate
unproved boundary. Do not infer full popup fidelity from screenshots of the strip
or from the already accepted no-publication-lag test.

## Checks, limits and failure retention

Completed in this slice: reading the normal caller/strip exports and imported
profiles, verifying both export hashes and the available EXE identity, inspecting
current page/CSS integration, and this explicit owner/reservation handoff.

Not executed: the proposed controller disassembly helper, proposed static caller
checker, native CPU or Ghidra work, browser capture, queue job, or source-directed
rendering validation. The denied helper/checker were not recreated using another
tool. Their proposed contents are not tests or evidence. No generated asset,
manifest, source fixture or runtime file was written.

README TypeScript workflow is proportional to the final Markdown-only diff:
application formatter/Oxlint/ESLint/Fallow/build/runtime checks are not applicable;
Git whitespace/scope checks and independent source review remain relevant. The
initial preparation command rejected an empty registered-check list; no successful
validated contract is claimed. The bounded spec and all failed operations remain
in ignored `work/orchestration/worker1-message-popup-contract/`.

The GitHub dependency chain is #86 → #133 → #59 → #10 for this unresolved body
proof, without changing deadlines or closing any broader gate. Separately, queue
blocker #132 is recorded for #103 and PR131; it is not a prerequisite of this
retained-source task, and no controller repair was attempted here.
