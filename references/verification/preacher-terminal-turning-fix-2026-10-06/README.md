# PR242 terminal turning correction: accepted evidence

Exact candidate `d185c88ec604356df8dc665506270963b53e185b` is independently ACCEPTED
against main `a00eadc811e227559f9a2713eedbee5cd08af1c1`.
[Final review](review.md) · [Review manifest](review-manifest.json) ·
[PR242](https://github.com/JohnDeved/populous-new-dawn/pull/242).

Merged on 2026-10-06 at 19:38:44 UTC as
`1c7e6b05687aca14d9350e17c7ae14dc6c68bb97`. The coordinator verified that the
remote main tree equals the exact tested candidate tree. [Merge receipt](merge-receipt.json).

The sole runtime delta adds `timer < 840` to the existing condition surrounding the
complete sermon turning block. It prevents the terminal simulation RNG draw and
mode change while preserving earlier turning, interruption handling, terminal entry
and the acquisition tail. Mode 0 has executed original-producer and actual port-caller
proof. Mode 1/2 boundary assertions follow the original timer jump; they are not
additional original executions or complete turning-ownership parity.

## Verification and history

- The unchanged actual production-caller test previously failed only at mode 2 /
  RNG 1607832750 versus native mode 0 / RNG 3603658299, after its other world guards
  passed. The same test passes after the correction, including all nine measured
  native phase comparisons and unchanged listener state.
- Six focused cutoff assertions failed before the patch, with 15 controls passing.
  All 21 direct-controller tests pass afterward. These include modes 1/2 before,
  at and above the threshold, status-bit suppression, interruption ownership and
  the retained even acquisition tail.
- The strict replay passes all 27 immutable native cases, 63 visits and 73 requests.
  Only the exact odd-command32 return/release residual remains. All 44 raw-event
  difference rows and historical inputs stay retained; no tolerance was added.
- Scoped Oxfmt and ESLint pass. Oxlint exits zero with one existing re-export warning,
  reproduced identically from canonical main bytes after filename-only normalization.
- Full `npm run check` passes TypeScript, all 1,365 tests with zero failures/skips,
  parity and orchestration in 351.517 seconds. The serial production build passes
  in 27.810 seconds. Raw warnings remain in their streams.

The standard jobs ran serially on CPU0–3, within their 900s/180s TERM bounds and
20s cleanup grace. Both owned process groups are empty. All 3,684 tracked-file hashes,
source head/tree, installed/root locks and dependency device27/inode1978923 matched
before/after. No source changed during the gates. Planner output and explicit
check dispositions are retained: 12 portable selections are included in the full
suite; the 49 other native/browser routes were not run or claimed by this change.

Failure-first application source is `0105ddd7bfd86c0c36071fd02cc985824a704ce3`.
The focused controller failure is `48086268`; strict-checker failure is `da7f94a8`.
Focused success ran on `0f092253`; only the explicit historical-provenance README
note changed before final `d185c88e`, with all tested runtime/test/checker bytes
identical. Full check/build and scoped quality bind exact `d185c88e`.

[Accepted original producer/raw comparison](https://github.com/JohnDeved/populous-new-dawn/blob/e6d61dc61e6ee0beead71e4ccfdb3ffe880cae37/references/verification/preacher-terminal-turning-2026-10-06/README.md)
retains actual original acquisition/angle/reveal and its explicitly supplied port
adapter. [Accepted real production-caller failure](https://github.com/JohnDeved/populous-new-dawn/blob/37feab9099db67fc76ee2ea7235c674a5e799164/references/verification/preacher-terminal-turning-live-2026-10-06/failure-first/README.md)
separately retains the unchanged private acquisition callback, physics/order wrapper
and exact failure on unmodified source.

## Portable raw packets

| Packet | Archive SHA256 | Members | Bound manifest |
| --- | --- | --- | --- |
| [Source, focused failures/success, strict replay and caller data](source-focused.tar.gz) | `f1a4dbeef071cadfb76667959c536f8bf07c4fc75bb3e1665a58c15aa6d3c1ae` | 49 | [a38461e1](source-focused-manifest.json) |
| [Quality, baseline, full check/build, identity and cleanup](standard-quality.tar.gz) | `b3df5dab22c537ae341b0ffe546ec40665279d83fabc9869a70a9efe32579547` | 25 | [95de1b81](standard-quality-manifest.json) |

Every archive member was verified against its original packet manifest before
publication. Creation-time summaries retain their then-pending review labels;
the copied final independent review supplies the later accepted verdict. The full
source diff, precise commands, source/input fingerprints, raw streams, failure-first
outputs, post-patch caller rows and unmasked replay differences remain portable.

## Limits

The listeners, terrain, topology and schedule are supplied fixtures. Ordinary
five-listener acquisition history, visible improvement, original whole-world/physics
equivalence, Tower/vehicle paths and broad issue214 parity remain unestablished.
Heading/field-width boundaries, odd32 expiry, ghost/Bloodlust and fresh conversion
remain separate. No new browser observation or original execution was needed for
this correction. The broader issue stays open.
