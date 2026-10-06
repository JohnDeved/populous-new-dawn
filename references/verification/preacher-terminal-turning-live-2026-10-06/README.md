# Production preaching caller: source implementation

The [single executed failure-first result](failure-first/README.md) is now
independently accepted. Source0105ddd7 reaches only the expected terminal mode/RNG
failure; all producer and unrelated-world guards pass. Its raw receipt and test
remain unchanged. The authoring record below describes the preceding source stage.

This branch implements the independently accepted one-case plan on application
base `a00eadc811e227559f9a2713eedbee5cd08af1c1`. It changes only the test, its
supplied input and provenance. There are no application edits.

The test imports unchanged `stepLivePreaching`. Its real private acquisition
callback scans the five existing owned Brave records, propagates the count and
RNG through the real order/controller wrapper, and runs the normal physics and
combat tail. It never supplies the acquisition count, copies the scan, exports a
private function, mocks a module, or instruments a browser.

The empty `createWorldState(3)` fixture contains six supplied actors. It preserves
the full retained ordinary Preacher record, including turnY, velocity and other
fields omitted from the native byte projection. HP55 supplies life1100 to actual
physics. Four explicit terrain corners at height155 keep the person grounded.
The five model2/physics2 Brave listeners are wholly supplied state23 owners;
their initialization and earlier acquisition history are not observed.

Physics alone advances stored counter13 to14/15/16. The fixture supplies world
turns4244/4245/4246 and stamps/updates only the Preacher once per visit through
actual `stepObjectAnimation`. It does not call `tick`, `advanceGame`, or
`animateLiveObjects`. All listener records and the complete remaining world are
guarded against changes. Only entry and supportHeight properties with the exact
value `undefined` are normalized during setup to match known wrapper assignments.

The final native mode0/RNG3603658299 expectation now comes from the independently
accepted native result. All three expected rows and the test body are byte-identical
to source head `e49ceeab`; only oracle provenance/status and its binding changed.
`native-result-review.md`, its manifest and verification bind that acceptance.
The test retains its reviewed-native-result guard. Oracle acceptance is not
permission to execute this source. The current application is predicted
to fail with mode2/RNG1607832750 after passing real acquisition assertions.

At the final boundary the test compares a clone of the world with precisely those
two outputs deferred, then asserts their exact expected values. This catches other
mutations before reporting the known cutoff failure. The running world is never
repaired. Optional JSON diagnostics retain initial and four-phase full person,
listener, queue and RNG snapshots even when the last assertion fails.

## Files and validation

- `tests/preacher-terminal-turning-live.test.mjs`: one test, three wrapper and
  three Preacher-only updater calls.
- `tests/fixtures/preacher-terminal-turning-live.json`: full ordinary person,
  corrected listeners, explicit supplies and reviewed native expectations.
- `field-supply-ledger.json`: accepted supply ownership and limitations.
- `plan-review.md`: verbatim independent plan ACCEPT, SHA256
  `2802052e3b9ddfa9a07c5f219d04db3bb5994ab22abd862e3155a773620f5396`.
- `input-provenance.json`: retained source/evidence/object hashes and accepted
  plan packet manifest. Referenced older native runs are not this new case.
- `source-binding.json`:218-file closure including the test and input,216 unchanged
  production files, exact function ranges and existing Node binary. No packages.
- `launch-proposal.md`: one bounded future Node invocation, currently not run.

Authoring checks: `node --check tests/preacher-terminal-turning-live.test.mjs`
passed without loading imports; host JSON/hash/source checks passed; `git diff
--check` passed. Application, test, package, native and browser execution are
not-run. Standard code-change and merge gates remain not-run.

This is supplied production-caller coverage, not ordinary acquisition, complete
native physics/world scheduling, browser presentation or broad issue214 parity.
Ghost/Bloodlust/fresh-conversion RNG, mode1/2 extensions,31/32,Tower and vehicles
remain outside. No PR should claim those boundaries from this fixture.
