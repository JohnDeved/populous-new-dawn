# Data-only original recording manifest

Issue #16 follow-up to [the accepted control contract](rolling-demo-control.md).
`scripts/recording-manifest.mjs` exposes authenticated metadata for the five
existing recordings without enabling Rolling Demo, parsing a GM save codec,
executing a GP command, applying a CP camera update or selecting a campaign map.

```sh
node scripts/recording-manifest.mjs /path/to/verified/original-game > /new/output/recording-manifest.json
node --test tests/recording-manifest.test.mjs
```

The command reads only the 21 fixed `rddata` paths from its explicit input root.
All sizes and SHA-256 identities must match the existing provenance/control
checkers before it returns any manifest. Original files are never written.
The caller owns the stdout destination; ordinary shell redirection can truncate
that destination before a failure, so use a new output path. No generated output
or original binary is added to application assets or the repository.

## CLI input admission

The CLI opens each fixed member read-only with a nonblocking flag, then checks
that the opened descriptor is a regular file of its exact expected length before
allocating a read buffer. Reads are limited to that length; early EOF or a changed
final descriptor size is rejected, and the descriptor is closed on success and
failure. SHA-256 validation still happens before any manifest is produced.

The exported `readRecordingMember(root, member)` helper accepts only the known
member names and performs this size/type admission. It does not authenticate the
bytes on its own; the manifest builder supplies the unchanged digest checks.
The nonblocking flag prevents a FIFO open from waiting for a writer on supported
filesystems. It is not a timeout for arbitrary filesystem or storage I/O, a
universal platform guarantee, a root/symlink confinement policy or a memory
benchmark. The manifest builder's custom reader callback remains caller-owned.

## Output and deliberate limits

- Ordered recording IDs are 1, 5, 2, 6, 3, followed by restart to entry 0. All five
  montage limits remain zero. There is no active STOP entry or invented duration.
- Each recording exposes `sourceMapId: null` and unresolved source identity.
  Its snapshot counter is read from offset 16; counters retain original
  simulation-counter units, not browser frames, seconds or campaign IDs.
- GM and VER are authenticated as opaque input files. Only the already-proved
  snapshot length/counter and sidecar version 106 are inspected; the GM payload
  version argument, source map, save fields and original-save interoperability
  are not decoded or inferred.
- GP and CP retain their separate ordered frame metadata: counter, signed size,
  type, auxiliary byte and payload offset. Payload bytes are not copied to JSON
  or interpreted. GP type 1/size 18, CP type 10/size 8 and type 0/size 0 are the
  only admitted shapes from this corpus, not a complete native payload catalogue.
- The signed counter -1 ends framing regardless of the rest of that header.
  GP's eight-byte trailer must agree with snapshot origin and final GP counter;
  CP has no trailer. Truncated data, decreasing counters, invalid signed sizes,
  unsupported shapes, absent scheduled completion and out-of-interval records fail.
- Completion metadata belongs to GP, not CP. Recording 5's CP ends at 9876 while
  GP ends at 9942; recording 3's CP ends at 11759 while GP ends at 11840. This
  describes the recorded data contract; the tool does not run a montage state
  machine or prove when original runtime cleanup/advancement completes.

The retained corpus contains 99 GP and 3811 CP scheduled records, including the
zero-size final records but excluding sentinel headers and GP trailers. Native
checksum calculation/validation, command and camera payload execution, error-byte
consumers, source-map production, deferred input ownership, frontend/focus return,
renderer and replay equivalence remain separate work before any live-entry change.

Maintained tests use synthetic byte buffers for framing, pairing and refusal
controls, and bind the copied identity table to the unchanged research checkers.
Additional tests use small owned regular files and controlled allocation-boundary
truncation/growth. They do not include the original binary corpus. Actual-data generation and all
member corruption/missing-input controls are separate source-bound review evidence.
No whole-application quality, browser, native execution, save/persistence,
performance, startup-parity or issue-completion claim follows from this tool.
