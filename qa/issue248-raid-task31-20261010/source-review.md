# Independent review: ATTACK task+0x31 inputs

Verdict: ACCEPT the finite supplied-attribute source contract. This is not implementation readiness or a demonstrated standalone gameplay correction.

Reviewed packet: `issue248-raid-task31-static-20261010`.

- Findings SHA256: `403a0e750391db88b1444aa835b6b74d56bb6b2a257a2f056e1dc18942866787`
- Provenance SHA256: `d93789fbff0c2ca83a7b82c1fc1731336322c8db110618ea6e29a6b0e648b33b`
- Artifact manifest SHA256: `4927a1007718a4de6b606c671b078bc3affb0d1a44305dfb167750e3bc30b398`
- Script inventory SHA256: `a9bfc6254078d85351232183d70989603bb2001eb71a073b699229c5b53a2f74`

All four manifest artifacts and 23 source inputs verify. The six native exports match the exact 4754 repository blobs and registry. The retained excerpt is an exact substring of the accepted allocator disassembly; all 116 bytes at 004e638b through 004e63fe independently match the canonical PE and byte hash `3f5bbd2a9de1e5f2d6eb4aa9624a5aaf4d6771331bbdca129d1dcc8ec2b31e32`. No new disassembly, native/model/browser execution, game test, or runtime edit was performed.

## Accepted operation

The generic destination-field writer 0048ef00 and its script callers support SET/INCREMENT/DECREMENT on type-2 internal fields 1000..1047. Its address calculation is 0x960402 + 48*signedTribeIndex + internalNumber. Internal 1022 and 1042 therefore resolve to attribute indices 22 and 42, at 0x960800 and 0x960814 plus the tribe stride. The generic attribute read returns an unsigned byte; writes use byte-width arithmetic. A raw token 1022 in another syntax position does not establish an attribute-22 reference.

The successful allocator tail writes task+0x31 at ESI+0x67, given task base ESI+0x36. Attribute 22 controls bit0 and attribute 42 controls bit1. Each bit is set or cleared from its corresponding input's nonzero test; the other six bits survive this tail. Attribute 22 is then cleared before the second test, and attribute 42 is cleared before success returns. For supplied A/B and the task byte at entry to this tail, the result is `(oldTask31 & 0xfc) | (A != 0 ? 1 : 0) | (B != 0 ? 2 : 0)`, with both input bytes consumed. The earlier allocator failure branches bypass this tail. This acceptance does not enlarge the report into a claim that failed allocation has no other effects or that arbitrary generic operand evaluation is pure.

The already accepted phase3 consumer conditionally ORs membership mask0x2000 from bit0 and chooses phase7 rather than phase4 from bit1. A clear bit0 leaves an already-set person mask unchanged. The port's task.flags and marker-valued mode are not substitutes for this byte. No characterization of the other six task bits or of native initialization follows.

## Authored-data and representation checks

Independent JSON inspection verifies the source filenames, imported source hashes and field counts for all six entries: Mission1 cpscr010 (218), Mission2 cpscr074 (155), Mission3 cpscr012 (188), Mission6 tribes1/2 cpscr014 (201 each), and tribe3 cpscr015 (183). None has a typed [2,1022] or [2,1042] field. This is an authored operand absence result, not a native initial-bank value or an assertion about unrelated dynamic writes.

The exact 282-file TypeScript/TSX literal-access inventory also has no attributes[22] or attributes[42] match. Its stated dynamic-index limitation is essential. Current scriptState creates 48 zero attributes; missionAI changes attribute43 before the initial script. Current ATTACK forwards other attributes and spell inputs without snapshotting or consuming 22/42, and requestAttack has no task+0x31 projection.

Fresh port construction thus has source-backed zero inputs for these two fields, while the accepted cohort capture does not itself record them. The visible native initialization exports do not establish the global bank's initial/load values. Unknown saved task bytes must remain unknown; the upper-bit preservation formula does not supply their values.

## Disposition

A supplied request-level snapshot/consume operation is source-defined, conditional on identifying successful allocation and retaining unknown legacy state correctly. The checked Mission1–3/6 authored scripts supply no demonstrated independent gameplay benefit for that correction. Universal admission still requires the separately accepted specialist maintenance obligations; no model-only activation is authorized.

The accepted four-person current cohort and the historical record205 metadata gap retain their separate meanings. The latter bounds first-dispatch continuity and does not reopen established later ordinary cleanup or forbid supported component work. The defense-to-response relevance check is outside this packet and this verdict. The ten existing expected-red cases and both failed receipts remain unchanged.
