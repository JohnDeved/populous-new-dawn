# Independent candidate code and focused-evidence review

Verdict: **ACCEPT for code and focused evidence** at
bd07a6302bb0170e9d6dc235983c2a961694d753, base
d35835caba6f6d89d9ca97a4f87a4b68744a6bbf. No blocking code findings.
This is not final integration/merge acceptance: full check/build,TypeScript quality
and current ordinary/browser evidence remain pending under the coordinator.

Bundle manifest SHA256:
964fedeac479ee2cce042ce9a6b10cc36a680e9456bf2917b06320ee2bde9bc6.
Full diff SHA256:
192bc3a67568a1141c191cf440e73a7e77e07476bd2091e705ae755c271b755e.
Application SHA256:
a402baa5e394ebf13347a3b371a957d25cb2bd519b44da77a886646a710fd784.
I inspected the full four-file diff, all source and retained outputs. Bundle file
hashes/lengths, changed-source hashes, exact clean HEAD, actual git diff and git
diff --check all match. No native,application,package or browser code was executed
by this review; independent JSON/hash/byte comparisons use existing artifacts.

## Runtime and regressions

The runtime changes exactly implement the accepted proposal: import the existing
stopPersonMovement primitive; OR the entry bit at the existing terminal predicate;
and call the primitive through effects.animate after phase4's no-following state
and entry-bit writes. It does not call the broad route-cleaning stop callback.
Existing phase2,arrival,following-order,turning and32 expiry code stays intact.
No new clock,render,RNG,queue,route or path operation is introduced.

The fixture's fields,input and complete native case equal the accepted supplied
input and native.json case exactly, including every retained phase/event snapshot.
Native SHA1751ba217c1870a16a667fe638f7e250729bda62e01a1d16638f868f5c2e829c and
independent result-review SHA1bf722ab8520fcddd8cb40cd1cb6a37def043b363c5bd1607947306c51922f8e
match its provenance. This is reuse of accepted original output, not re-recording.

Six focused tests cover the full three-pair45-field/raw256/command/order/RNG/return
projection, exact phase4 standing-family result, bypass of the broader stop
callback, route/path preservation sentinels, supplied shared17/31/32 semantics,
following-order release-before-stop, and the unchanged turning/RNG residual.
The tests distinguish port shared-branch regressions from ordinary or Tower/
vehicle parity. The command32 phase4 test explicitly retains return1/release.

Failure-first50e65e82 has the four expected assertion failures: terminal flags2,
restart168/14 instead of48/16,speed73 instead of0,and shared restart pose. Existing
following-order/turning behavior passes. Focused4e9639e5 has six passes. Both receipts
bind clean committed sources and unchanged before/after inputs. Independently
verified those hashes against their git objects; all passing application/test/
fixture/import/package bytes equal finalbd07a630. Reuse of this focused receipt is
therefore valid; it does not falsely claim a fresh final-head test run.

## Maintained replay checker

The checker is current-source-bound, not a historical b2-only executable. The exact
edit removes the terminal flags2 discrepancy allowance and requires equality;
it retains exact turning assignment0→16,animationMode0→1,simulation RNG
4→3138912261 and odd-command32 return0→1/release expectations. Updating the
state/return residual count4→2 follows the observed repair. No case,visit,reference
hash,raw-byte comparison,event comparison or request count is removed/weakened.
Historical inputs and old checker/output remain unchanged.

The old inventory fails specifically because actual terminal flags differences
are empty. Before/after checker-maintenance port stdout is byte-identical with
SHA2bb2a99933482b2c87bda7540b79caac40d0ec5189952b069956afd31d7e4b23.
Final replay binds bd07a630 and unchanged source/native/tool hashes, then passes.

I independently compared all27 cases/63 visits and full native/port snapshots.
Only the known turning fields/RNG differ in its three post-controller phases,
with raw byte offsets118/168. The only return residual is odd32,0 versus1. I also
independently checked all73 semantic request pairs and their complete event states,
with only the declared exact positive-acquisition adapter leaves and odd32 release
handled separately. All44 raw event-difference rows remain retained. No broad
whole-sermon equality claim is justified or made.

## Remaining acceptance boundaries

The planner's three unknown paths are explicitly reviewed here: the narrow runtime
module, native-derived fixture and focused test. The checker selects broad campaign
gates through existing metadata; that mapping is not proof they were run. The
coordinator still owns the appropriate integration selection and resource lane.
No npm check/build,typecheck/format/lint/quality or new ordinary browser result is
included in these focused receipts. Their missing status must remain explicit
until completed; this review alone is not a merge gate completion.

Shared17/31/32 receive the original common operations, but command32 odd/phase4
expiry/release and positive-listener terminal turning remain unresolved. Vehicle/
Tower world composition is unproved by the one original case. The repaired fixed
on-foot17 state converges on the next phase2 visit as established by the regression.

The existing ordinary streams skipped the intermediate main-render interval.
Visible improvement remains conditional on actual passive-capture boundary pixels;
no frame should be forced or cadence changed. PR240 and accepted native research
are not expanded or overwritten.
