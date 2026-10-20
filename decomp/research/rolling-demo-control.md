# Rolling Demo: playback control, stream framing and remaining source identity

Issue [#16](https://github.com/JohnDeved/populous-new-dawn/issues/16), October 20,
2026. Static research and data contracts only. Built on main
`8f0751e3ba25acbf1bedcd76a4fc6aec4be0adb5` after reading the latest issue/comments.
No runtime/menu/save-codec/campaign/AI changes; startup/skip and Credits remain
with their separate owners. No original executable or emulator was run.

Reuse [demo131-entry](demo131-entry.md) for the menu callback and montage identity,
and [recorded-demo-provenance](recorded-demo-provenance.md) for raw GM state,
conversion, mutable heights and the absence of the ordinary level globals from
that copied span. **Recording IDs 1,5,2,6,3 are not mission IDs. All source-map
identities remain UNRESOLVED; Face Off 131 is not established or excluded.**

## New findings and source ownership

All addresses below are bound to D3D EXE SHA-256
`3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f`.
The [new checker](../../scripts/check-static-rolling-demo-control.py) asserts exact
instructions/branches and data dispatch entries against those bytes. Retained
Ghidra exports `004b36e0`, `004b3920`, `004a9d90`, `004aa1c0`, `004af0a0` and
`004a4450` were navigation aids; names/types alone are not evidence.

| Owner | Exact observed contract |
| --- | --- |
| Start admission `004b36e0` | Rejects entry while `word0098f746 & 0x21` is nonzero. Saves byte `0089d161` into dword `0098f712`, writes caller mode to byte `0098f750`, montage ID to word `0098f74a`, and `0089d161=14`. Calls `004b30e0`; success sets `0x20` (montage) and `4` (input-exit permission) at `004b3743/004b374a`. The established menu caller supplies `(1,2)`. |
| Recording activation | `004b351f→004b28d0` opens `RD%03dGP.DAT` (literal `005ce06c=GP`), reads its first 8-byte header to `0098f658`, then restores GM through the previously proved reader. `004b3537→004b2d20` opens `RD%03dCP.DAT` (`005ce070=CP`) and reads its first header to `0098f660`. Only after both return true are GP/CP activity bits `0x10/8` set. Later GAME entries use the same pair through `004b3ed0`. |
| Stream handles | GP handle `0098f650`, flags mask `0x300`; CP handle `0098f654`, mask `0xc00`. The observed read-open paths set `0x200` and `0x800`, respectively. These masks are handle ownership, distinct from active GP/CP bits. |
| Simulation service | `004a5590` calls `004b3920` at `004a5996` in its simulation loop, except the prior `0089bb81==2/3` branch. Service reads dword counter `0089d188`, consumes due CP frames first, then GP frames. It is not a rendered-frame callback. `0043e890` bypasses ordinary tribe-command dispatch when playback bit `0x10` is set; GP type 1 instead calls `0043e8e0` at `004b3add`. |
| Snapshot-relative start | With recording flag bit 1 clear, `004b2b1a/004b2b1f` copies loaded `0089d188` to `0098f70a`. The loaded field is GM offset **0x10**, not a source-map ID. The alternate bit 1 path seeks to GP end minus8 and reads two words into `0098f70a/0098f70e`; it is not the menu-start path admitted by the `0x21` guard. |
| Montage advancement | `004b3d28` requires montage bit `0x20` and entry type 3 GAME. Advance if GP bit `0x10` is clear, **or** if signed 16-bit entry limit is greater than1 and `(uint32(counter-origin) >> 4) > limit` (signed compare after the logical shift). Equality does not advance. All five supplied limits are **0**, so this timeout is disabled. Do not reinterpret the comment “Num Frames” as browser frames or seconds. |
| Next/restart/stop | Entry stride 4 at `0098f66c`: type byte +0, signed recording byte +1, signed limit word +2. `004b3da7` increments index; type 3 starts the next recording, type 2 calls `004b30e0` again when count > 1, type 1 uses cleanup/return. `RDMN001` has five GAMEs then RESTART, **no active STOP**. Exhaustion/failed next activation also reaches cleanup; this is not evidence that healthy playback exits after recording 3. |

CP EOF/error closes its owned handle, zeros 30 bytes at `0098f6ec`, and clears
only activity bit 8 (`004b3a2c`). GP EOF/error closes handles and clears the active
bits with `&0xff27`, retaining montage ownership for advancement. A GP checksum
mismatch sets error byte `0098f74f=8` at `004b3af1`; the inspected branch still
calls the command consumer and does **not** itself force EOF. Do not implement
“all errors immediately return to menu” from this note. Read failures and mismatch
signaling are distinct branches. The later consumer of error byte `0098f74f`
remains untraced.

## Input interruption and return boundary

Both handlers first suppress input when `0089c669 & 0x08000000` is set, and
have earlier special handling for `0089bb81==2/3`. After those guards:

- Keyboard `004a9d90` tests `0098f746 & 0x4010` at `004a9f23`. Its exit branch
  requires a nonzero down argument, flag 4, and caller mode other than3. It is
  not an Escape-only branch; key releases do not request exit.
- Pointer/button `004aa1c0` instead tests `0089c669 & 0x10000000` at `004aa338`,
  then the same down/flag 4/mode gates. This does not prove pointer movement exits.
  Activation calls `004af0a0(0x20)` at `004b3578`; that function sets the pointer
  guard and clears input arrays when handler-active byte `005cdb78==0`. If already
  in a handler it sets `0x08000000` and queues the mask at `0089c6b5` instead.
  The later deferred service is outside this proof; immediate and deferred entry
  must not be silently conflated.
- Both accepted interruption paths clear `0059d110`, call cleanup `004b2700`,
  restore saved byte `0098f712→0089d161`, call `0049cfa0(2)`, then `004b4770`.
  Their jumps to the common return skip ordinary command processing: the exit
  press is consumed at these handlers, rather than replayed into gameplay.

`004b2700` conditionally closes both stream handles, clears flags with `&0xff03`,
resets the 30-byte camera/input block, and sets `0x4000` at `004b28ba`. It does
**not** clear the whole flag word. `0049cfa0(2)` removes bit 2 from byte
`0096ead4`; if the resulting byte is zero it restores `005ca850` from `005ca848`.
Do not infer a game-time rollback: neither this helper nor saved `0089d161`
restores the prior world snapshot.

`004b4770` requests **interface state 7 for mode 2 or 3** through `00442a60(7)`,
then clears mode `0098f750`, clears `0089c665 & 0x04000000`, and jumps to
`004194f0`. The latter clears bits `0x02000000/0x04000000` in `0089c661`.
The request sets `0088f001=7`, transition phase `0088f002=5` and `0088f003=0`;
`00442ab0` later copies the pending state to `0088f000`. Its render dispatch is
byte table `004a4954` then pointer table `004a4938`: state 7 selects
`004a475c→00457a60`, the retained frontend draw consumer. This proves the
**frontend request**, not completion of resource teardown, OS focus restoration
or selection of a particular menu row. Initial load failure in `004b36e0`
has an inline equivalent return request; it must not strand the saved caller mode.

## Hash-bound data contract, not a replay codec

The checker reuses all 11 GM/VER/montage identities from the prior checker and
adds the ten exact GP/CP identities below. Recovery used the documented archive,
SHA-256 `6aa6c366809ea1d9575ec1d31a24527a95c7332f0a1d2ab692f7a602e7e10702`,
with **Component0** and only the EXE, montage and five recording-prefix members.
This was prerequisite recovery, not another archive inventory or map search.

Headers are 8 bytes: signed32 scheduled counter, signed16 payload size, type
byte and auxiliary byte. `004b3a7e/004b403d` sign-extend sizes; GP type 1's 18-byte
payload is read into a checksum word plus command bytes. `004b3aad` compares the
checksum, then `004b3add` submits the command. CP type 10 dispatch table
`004b4228[9]→004b41bd` copies the 8-byte payload into camera fields
`0098f700/702/6fc/704` and the auxiliary byte to `0098f708`. These coordinates
are camera state, not a canonical-map identity. No payload commands are executed
or translated by the checker.

The sentinel is scheduled counter **-1**, irrespective of the other header bytes.
GP has 8 trailing bytes after the sentinel; CP has none. The last zero-length
scheduled record precedes that sentinel and matters for completion time.

| Recording | GM counter +0x10 | GP first→last | CP first→last | GP/CP records* |
| --- | ---: | --- | --- | --- |
| 1 | 864 | 881→1562 | 877→1562 | 5 / 573 |
| 5 | 9166 | 9191→9942 | 9173→9876 | 27 / 704 |
| 2 | 5668 | 5692→6325 | 5684→6325 | 8 / 579 |
| 6 | 17307 | 17310→18846 | 17317→18846 | 44 / 1525 |
| 3 | 11320 | 11332→11840 | 11326→11759 | 15 / 430 |

\* Includes the final zero-length record; excludes sentinel and GP trailer. GP
trailer words equal the GM start counter and GP last scheduled counter in all
five files. That is a time relationship, not a map relationship. In particular,
CP ends earlier than GP for recordings 5 and 3; camera EOF cannot be the montage
stop trigger.

| File | Bytes | SHA-256 |
| --- | ---: | --- |
| `rddata/rd001cp.dat` | 9168 | `5bcc842585c7f19030118b2cfe571e28582a74930ddda02af0e3298bc8fd046c` |
| `rddata/rd001gp.dat` | 128 | `674c29211dc6d97c8f8456c0e24abf9f91c9fc4d586f3697347decd9f0329d2e` |
| `rddata/rd002cp.dat` | 9264 | `35a4e5e9da7491a75da0a9b4b177f791e9be27ac0329e639c24f74f1f00b08c3` |
| `rddata/rd002gp.dat` | 206 | `6f0258cc48cbd0d63ad11612513485e33da17401c226915fccd1204873ed2c29` |
| `rddata/rd003cp.dat` | 6880 | `2744b81465d1a011b7cbfa8b2cd2a86ed046e4b5a53b787e1232c52ff92ec822` |
| `rddata/rd003gp.dat` | 388 | `67467dad19d5f8ae8cae5f708d840d91649d68427be93983448c970806b688e6` |
| `rddata/rd005cp.dat` | 11264 | `2c71643172686ae1595b5397794a72a961bbb8e9f1a46eaafa7825669c8cc6d2` |
| `rddata/rd005gp.dat` | 700 | `697fdfbb3818f5adeb5766b37ebffc0b4799f851354f5356c00b26209462a417` |
| `rddata/rd006cp.dat` | 24400 | `c1973b5d15d49dc0e1d59e075e8e3400306c2df79fea228159e580e219a98f4d` |
| `rddata/rd006gp.dat` | 1142 | `28294b963db5a40721d955234b6dded3a09dd72a67e731d72ce802114e4f6a7f` |

## Source-map producer: one lead narrowed, identity still unresolved

The old investigation anchor `00443094` is inside `00442f40`. Its filename
formatter pushes literal **GAMNT** (`0059cce0`) and `%s\%s%d.%s` (`0059ccc4`) at
`00442f8a/00442f90`, repeats the same stem for VER, and passes **107**, address
`0089d178`, size `0xd1964` and an aggregate value in ESI to `0049a750`.
The earlier instructions accumulate state-range helper results and state words
into ESI. This is a current GAMNT writer, **not a demonstrated producer of
RDnnnGM version 106 files**. A hypothetical rename/copy is untraced, not excluded.
The writer's build literal remains Nov 25 versus the supplied sidecars' Sep 30
text; the previous note owns those established observations.

Thus the added GP/CP framing and time/camera fields do not supply the missing
map relationship. Need a matching version 106 recording creation/copy chain or
an independently proved immutable original-map field. No approximate terrain
search, whole-archive re-inventory, new LEVL2131 comparison, save fixture or
identity guessed from a recording number was performed. This is useful negative
evidence, not a proof that all possible identity encodings are absent.

## Reproduction and smallest follow-up

```sh
python3 -B scripts/check-static-recorded-demo-provenance.py \
  --exe /path/to/d3dpoptb.exe --data-root /path/to/game \
  --output-dir /existing/parent/new-prior-proof
python3 -B scripts/check-static-rolling-demo-control.py \
  --exe /path/to/d3dpoptb.exe --data-root /path/to/game \
  --output-dir /existing/parent/new-control-proof
python3 -B tests/rolling-demo-stream-framing.test.py
```

Python 3.9+ and Capstone 5.0.7 are required for original-byte checks. The new
checker locks the existing PE reader and prior checker's identity table, validates
all 21 input sizes/hashes, emits decoded windows and `evidence.json` with source,
dependency, input and window hashes. Output must be new; original inputs are
read-only. Framing regressions reject negative sizes, truncated payloads/headers,
decreasing counters and wrong trailers, while accepting real sentinel variation,
same-turn records and sentinel-like bytes inside opaque payloads. A partial output
after failure has no passing report. No intercepted native leaves: no target
instructions or APIs execute at all.

The smallest independently testable implementation follow-up is a **data-only
recording-manifest adapter**, separate from campaign loaders: expose the ordered
recording IDs, GM/GP/CP identities, zero limits/restart and `sourceMapId:null`;
validate framing/bounds and preserve simulation-counter units. It must reject
unsupported payloads rather than label a recording as a mission. Test missing or
wrong-hash members, signed sentinel handling, GP versus CP completion, and restart
without rendering or parsing a save codec. This pass supplies research tests only;
it does not add that adapter or enable the menu action.

Before a replay/UI implementation, separately establish the version 106 source
producer (if canonical map naming is required), complete GP command/checksum and
CP playback semantics, trace `0098f74f` consumers, and verify deferred input-lock
service plus frontend transition/input-focus completion. A state-controller test
can then cover entry failure, GP completion with early CP EOF, restart, key/button
down versus release, mode 3 suppression and consumed exit input. No runtime
acceptance, parity increase, U08 claim, whole-content scope decision or closure
of issue 16 follows from this static contract.
