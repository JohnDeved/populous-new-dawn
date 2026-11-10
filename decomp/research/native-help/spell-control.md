# Help spell-control preview inputs

Issue #741 remains open. This is source research for the 29 kind-4 article
illustrations, not an implemented renderer or permission to activate Help.
Reviewed against main `0953b8327bf386e112ac9c5801f69a80f2b0ce52`.
The current `helpPreview` unsupported result and article-presenter rejection
remain unchanged.

## Sources and confidence

The original executable identity is
`3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f`.
The caller facts below are instruction-level reads of the retained
[original bytes](source.json), `illustration-dispatch` span
`0045ddf0–0045e1df`, SHA-256
`75e3b9276cadd883edaac219ed102a6d449b1fe8fc1576f3d31016728e3d1fb7`.
Disassemble the kind-4 branch only, `0045e048–0045e103`; the dispatch span
also contains inline switch data, which must not be interpreted as code.

The renderer dependency section is a reading of hash-verified, retained Ghidra
12.1.3 exports, not fresh machine-code verification or native execution:
[0049daf0](../../generated/0049daf0.c),
[004a1dd0](../../generated/004a1dd0.c),
[004c2fe0](../../generated/004c2fe0.c),
[004c2d50](../../generated/004c2d50.c),
[004c2ae0](../../generated/004c2ae0.c), and
[004c2ca0](../../generated/004c2ca0.c).
Their identities are in [exports.json](../../exports.json).
The caller's [0045ddf0 export](../../generated/0045ddf0.c) was also hash-checked.
Inferred types, omitted call arguments and names in those exports are not
independently established signatures.

## Exact caller contract

1. At `0045e048`, the caller requests `0044bd80(2)`. It copies **113 bytes**
   from the returned runtime control: 28 dwords plus one byte. This is not a
   reference to an arbitrary 66-byte imported HUD descriptor.
2. The copy retains the template's width at `+0x47` and height at `+0x4b`.
   It replaces position `+0x37`/`+0x3b` with a centered position derived
   from the actual illustration pane:
   - X = `0044a240(pane.x) + trunc((0044a240(pane.width) - template.width) / 2)`.
   - Y = `0044a260(pane.y) + trunc((0044a260(pane.height) - template.height) / 2)`.
   The divide-by-two instructions truncate signed values toward zero. Do not
   center the original pixel rectangle and convert that result afterward.
   The coordinate conversion routines themselves still need recovery.
3. Stores at `0045e0bd`, `0045e0c1`, and `0045e0c5` clear the copied
   dwords at **+0x1c, +0x18, and +0x0c**, respectively. Account for the
   outstanding conversion-call argument when translating stack offsets.
   No other template fields are reset by this branch.
4. At `0045e0df`, the caller reads the **low byte** of the article's first
   illustration argument, writes it to `0098db08`, calls `0049daf0(copy)`,
   then clears the override to zero at `0045e0f3`. It does not restore a
   previous nonzero override.

This establishes clone, placement, three state resets and model override.
It does **not** establish that the copied control is enabled, visible, ordinary,
fully charged or empty. The runtime provider must supply the actual template.
A browser adapter should pass a model explicitly rather than copy the global
override mechanism and its non-reentrant lifetime.

## All 29 descriptors

The retained `illustrations` table starts at `0059d380`, with 88 thirteen-byte
records for topics 983–1070. Kind 4 appears in these topic/model pairs:

```text
1006:2   1007:17  1008:9   1009:5   1010:6   1011:12  1012:3
1013:7   1014:4   1015:11  1016:15  1017:14  1018:10  1019:8
1020:13  1021:16  1042:19  1043:21  1044:20  1045:18  1061:10
1062:15  1063:12  1064:23  1065:25  1066:24  1067:26  1068:30
1069:27
```

There are 26 distinct model values. Every one is nonzero, so the renderer's
zero-override sentinel is not a valid fallback for any of these descriptors.
The second and third arguments are zero for every row. That does not authorize
zero stock, zero charge, or an empty illustration.

## Renderer inputs still required

The retained `0049daf0` pseudocode exposes these dependencies. Confirm the
affected instructions and argument bindings before implementing the renderer.

- **Inherited control state:** `+0x10` gates drawing; `+8` changes vertex
  flags and icon selection; `+0x4f` gates the inner illustration; byte
  `+0x5a == 4` selects a special image; `+0x63` participates in the
  unavailable-frame condition. The Help caller does not clear these fields.
  The copied `+0x18`/`+0x1c` states are zero; frame drawing also sees
  `+0x0c == 0`. Do not assume ordinary template state until its producer is
  recovered.
- **Current player and world:** level flag `0x20`, the current player's
  spell-knowledge mask, stock, a separate availability check, and charge
  progress affect frame/icon/markers/bar. These are not all interchangeable
  with link discovery. Retain each provider's existing unsupported-player and missing-state
  boundaries instead of inferring them from an article or level header.
- **Spell definitions:** the three icon words near
  `005a80e0 + model * 0x3e`, charge cost near `005a80d4`, and the
  capacity bytes at `005a80fd`/`005a80fe`. `004c2d50` selects capacity
  by level flag `0x20`; `004c2ae0` reads a high-nibble value separately
  from the stock read. Resolve their actual caller arguments.
- **Original rendering data:** current screen dimensions, HFX metrics/pixels,
  frame tables at `005cacc8`/`005cad10`, stock-marker HFX rows,
  palette state and current-player bar colour. Existing article inline-image
  assets alone do not establish that this complete sprite/frame set is present.
- **Renderer initialization:** the `005cd2a0` branch initializes shared
  marker positions and geometry using `0044be00`. A browser implementation
  needs a scoped owner and invalidation policy, not an unexamined global cache.
- **Stateful leaves:** `004c2fe0` can rebuild and sort its spell-slot cache
  before the nonzero Help override is applied. The optional charge-sparkle
  path in `0049daf0` can consume native RNG. The caller's three resets
  do not themselves eliminate either dependency. Establish reachability from
  the real template and state before deciding which effects a browser
  presentation owner must reproduce or explicitly adapt.

The last item is a reason to inspect the complete consumer, not a recommendation
to advance World RNG during browser paints. Neither a fabricated static icon nor
a copied global-state renderer is an evidenced solution.

## Next bounded implementation

1. Recover and inspect `0044bd80` and its control owner/lookup table, the
   applicable runtime-control constructor/update path, and conversion routines
   `0044a240`/`0044a260`. Capture the actual template-2 state and its
   lifecycle. A descriptor row whose numeric ID happens to be 2 is not enough.
2. Obtain addressed machine-code evidence for `0049daf0` and its used
   helpers, especially the omitted stock/availability arguments and
   `0044be00`. Identify ordinary, unavailable, special-state, charged,
   charging and no-draw behavior for the actual template.
3. Bind explicit read-only browser render inputs and original assets. Implement
   the centered control using modern scoped state, with documented handling of
   native cache/RNG leaves. Missing provider data must stay unsupported.
4. Test every descriptor and relevant state/viewport branch, then connect the
   real article consumer and collect rendered/native-reference evidence.
   Keep Help inactive until all other preview and public input/session
   acceptance is complete.

No current verified EXE path was supplied in this research pass. The documented
shared native root was absent, and the retained Help recovery archive contained
source/imported data only, not an executable or the missing routines. Existing
retained sources suffice for the caller findings above. No installer, original
CPU code, Ghidra project, app, browser, tests or build was run for these findings;
no unavailable-art fallback or renderer-ready state was introduced.

