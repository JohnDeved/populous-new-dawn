# Swarm prerequisite: ordinary Save state-buffer boundary

The actual user-Save chain now reaches a concrete full-state buffer request:
`004ab82b → 00427220 → 00426d70`, then `00426e15 → 00526130` with a local
path, source pointer `0089d178`, and size `0xd1964`. This directly names the
address span `[0089d178,0096eadc)`, which contains native unit records and
terrain/cell heads. The preparation and output children remain uninspected, so
unchanged identity encoding and successful durable serialization are not proved.

Assessment base remains `f9675f56`; research head remains `4037f8ba`. The single
approved `[00426d70,00427220)` window was decoded as data from the same verified
EXE with the same objdump. The selected body is only 234 bytes, ending at the
return `00426e59`; all local branch targets and eight direct calls
are within that complete control flow. Six padding bytes precede a separate
entry at `00426e60`. All later bytes in the capped output are retained unchanged
but excluded from this body's ownership claims. No child or Load route was
decoded or interpreted as part of this pass.

## Actual ordering and arguments

1. OR `0x02`, then `0x04`, into byte `009608b2`. The single incoming argument
   selects byte `0089a409 + 0xa4*argument`; when its bit 0 is set, also OR
   `0x01` into `009608b2`. A clear tested bit does not clear that destination bit.
2. Build a local string through `004fffe0` and `0055b450`, using the incoming
   argument, literal numeric pointers and a zero slot value. No filename or
   format-string bytes were newly read, so path contents are not inferred here.
3. The ordered callsites are `00426de0 → 0048b450(1)`,
   `00426dec → 004434e0(1)`, then
   `00426df4 → 00431970()`.
4. Write dword `0096aa9e = 0x6b` (107). This address lies inside the named state
   span. At `00426e15`, call `00526130(localPath, 0089d178, 0xd1964)` and remove
   twelve argument bytes.
5. A zero result from `00526130` records the success candidate; a nonzero result
   records failure. Both paths call `004434e0(0)` at `00426e28`. If byte
   `00895db0` then equals 1, clear it and call `0048b3e0` at `00426e40`.
6. The final subtract/unsigned-compare/`sbb`/`neg` sequence returns 1 for the
   zero-result candidate, otherwise 0. The body does not itself inspect a
   written-byte count or invoke an imported OS write.

The directly visible absolute writes are byte `009608b2`, dword `0096aa9e`, and
conditional byte `00895db0`. Their containing ranges do not prove anything about
the transitive effects of the ordered preparation calls.

## Which lifecycle addresses the request includes

This comparison reuses the accepted native owner ranges and field bindings.
It describes the memory addresses supplied after preparation, not a promise
that every field still has its live representation or is written unchanged.

| Previously proved owner | Relation to `[0089d178,0096eadc)` |
| --- | --- |
| Fixed unit storage `[008e0428,00937a98)` | Entirely included, including primary and secondary records |
| Per-record physical ID `+0x24`, class/model/state/tribe and lifetime flags, pending counter, allocation links and cell links | Their record addresses are included; the preparation calls' possible rewriting remains unknown |
| Terrain/cell-head block `[008a03e4,008e03e4)` | Entirely included |
| Lookup `[00890390,008922d0)` and range globals near `00890378` | Outside the directly supplied span |
| Pool/list heads near `0089031c` and counts near `0089c651` | Outside the directly supplied span |

The outside addresses could have copied or encoded counterparts within the
buffer or be rebuilt by a reader. Address arithmetic cannot decide that. The
fact that this ordinary Save request uses the same numeric span as the accepted
recorded-demo reader is now independently caller-bound; it does not equate the
two file routes, prove the ordinary Load path, or supply a versioned codec.

## Precise remaining ownership boundary

`00526130` has no selected generated body. Its exact source/size arguments and
zero-success convention are now proved, but its output operation is not.
`004434e0` and `00431970` are also absent selected bodies. Their placement before
the request, with the matching `004434e0(0)` afterward, makes representation
preparation/restoration the specific open question. The paired arguments alone
do not prove pointer relocation, ID conversion, compression, or absence of
mutation. The earlier `0048b450(1)` is likewise uninspected. Only cleanup child
`0048b3e0` has a selected generated body among this function's seven targets;
this packet does not need a new transitive cleanup audit.

The finite result therefore supplies the actual user route and the complete
state-buffer boundary, while stopping at named preparation/output producers.
For physical-identity correctness, the most consequential next contract is what
`004434e0(1/0)` does to included unit/list/cell fields, together with the already
named `00431970` preparation edge. Their effects must be known before treating
these bytes as unchanged raw live identity. The separate actual user-Load
entry remains `00427730`, still uninspected; no neighbor in this capped output
is substituted for that route.

Modern checkpoints can preserve source-proved lifecycle state without matching
the original binary file format. This result does not create that port owner,
reconstruct omitted old-checkpoint identities, establish fresh-level allocation
history, or prove resumed Swarm behavior. No original executable, native probe,
save-file operation, browser or test was run.
