# Issue252: one failure-first production-caller test command

**Unexecuted proposal. Runtime patch unapplied.** Independent review and the
parent's exact resource grant are required before this command runs.

Accepted main `e3a7a06a4250457502288d5b4c4e4ad8f3b40b53` contains PR253's tested
angle correction. It was normally merged into this feature branch at
`eb2770b023c1fa512bbcf1d7e1d8e495ddc1b9d8`. The entire `app` tree equals accepted
main; among the13 previously bound proposal inputs, only `app/level-start.ts`
changed, exactly the accepted angle correction. The reviewed height test, text
patch, accepted raw native stdout and actual target runtime remain byte-identical.
[Source correspondence](source-correspondence.json) retains all hashes.

## Frozen command and expected result

One command: `node --max-old-space-size=768 --test --test-concurrency=1 tests/startup-burst-height.test.mjs`.
It runs the retained-native oracle and three fixed-step actual production-caller
tests: ordinary `createWorld` initialization,70 existing ticks per mission, no
supplied entities/RNG/terrain/phases, and the reviewed birth-assignment observer.
This is controlled model testing, not ordinary elapsed browser play.

Expected failure-first result: the original raw-byte oracle passes and the three
mission tests fail only their birth-height offset assertion, actual0 versus
native90. Each mission must first complete its normal8/8/16 stone groups
(256/256/512 births) and emit the original three integrity diagnostics (RNG words, IDs/counters,
stone turns and phase transitions). Expected Node exit1 and failed command receipt
must remain recorded as failures. The host also returns failure for that exit;
**it must not turn expected red into a green test/receipt**. Independent result
review distinguishes the intended red from any observer, source, runtime, timeout
or cleanup error before repair is permitted. Any other failure stops the task;
no retry or assertion change is automatic.

The new test's static relative import closure contains217 tracked source/data
files and only four external specifiers, all Node built-ins. No dependency install,
node_modules lease, native executable, emulator, browser or network operation is
needed. The native birth oracle is read from the immutable accepted log; it is not
regenerated. Every relative closure member, explicit evidence input and tool is
fingerprinted in `launch.json` before and after the command.

## Reused bounded supervision

`launch.py` copies the independently accepted arrival host at8757de69. Its only
code changes are this task's labels, native-call count0, and the longer50s absolute
TERM/55s absolute KILL host deadlines. PID/parent/group/session/start ownership,
owned-only signalling, actual terminal residual check, full source/input/manifest
postflight, one-shot directory and output/RSS guards are unchanged. The native
arrival source is not edited. This adds no game/native/browser harness.

The child runs on CPU4 through the existing command-receipt supervisor and frozen
`taskset -> timeout -> prlimit -> env -i -> Node` argv. Child wall limit40s, TERM
kill grace5s, CPU limit45s, file limit32MiB, FD128 and core0. Node's heap limit is
768MiB; the host enforces1GiB aggregate RSS and32MiB output, retaining256KiB for its
terminal receipt. No native-style address-space limit is applied to Node's virtual
reservation. There is exactly one command and no retry or background watcher.

The parent must create the named fresh red-run worktree at the exact reviewed
packet commit and grant CPU4 before launch. The launcher requires clean matching
HEAD, every fingerprint, and an output directory that has never existed. It records
both original deadlines, all observed owned identities/groups, source before/after
and terminal cleanup. Cleanup remains required on the expected test failure.

Preparation performed only source parsing/syntax, hash/import correspondence and
unapplied patch validation. No test module was imported, no world was created and
no application, native instruction or browser ran. The accepted root repair stays
in its separate text patch until the red result and later runtime edit are granted.
