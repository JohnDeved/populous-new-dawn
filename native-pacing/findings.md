# #214: ordinary native sprite caller pacing boundary

## Decision

**No narrow runtime defect or universal 12/24/40-Hz replacement is established by this investigation.** The original caller advances eligible ordinary object animation once per active draw visit, independently of whether an offline simulation turn is due. Startup requests a configurable draw deadline (default 40), whereas the ordinary simulation configuration defaults to 12. Actual original draw visits can additionally wait on DirectDraw, surface locks, a semaphore, message handling and renderer work. Their durations were not measured. A requested deadline is therefore not a historical achieved rate, and hardware-dependent stalls are not an authored animation target.

Keep the browser clock unchanged pending a timed reference that demonstrates the intended ordinary animation duration. GOAL.md requires original outcomes/intended timing and experienced-player expectations while avoiding obsolete hardware stalls and renderer/simulation coupling. These findings do not justify reproducing DirectDraw waiting in the browser, raising the clock to 40, or halving it to 12.

## Scope and immutable identity

- Read-only checkout: `/workspace/scratch/69fd8163d94e/cloud-dev-20261004/sprite-animation-timing-audit`, HEAD `596475b6839c948604897f8b68ff89c6290cf39d`, initially clean. No source, assets or fixtures edited there. The later worship UI change on main is outside this source snapshot.
- Native executable SHA-256: `3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f`.
- This folder retains scoped objdump excerpts, direct references, 59 decoded configuration descriptors, a 19-case finite native-byte probe, its JSON and receipt. No Ghidra project, original OS process, browser, install, credentials, deployment or PR180 bootstrap work was used.
- Reuse, do not repeat, the sibling audit's descriptor/frame-chain/per-visit equivalence and existing `004a4450.c`, `004a4960.c`, `004a5590.c`, `004ee770.c`, `0049cfc0.c`, `0049cfe0.c` exports.

## Newly established producers

1. **Draw cap is actual startup configuration.** `004a4471` directly calls initializer `004a42a0` before registry/video/config/device initialization and `init_all`. At `004a42ce` it writes 40 to byte `0089ce62`. The reader requests `DrawFrameRateLimit` (`005cda88`) and clamps a successfully read unsigned DWORD to 12..60. Failed key/value reads leave 40. `00529e80`, called with second argument zero, selects HKLM; original strings resolve the path to `HKLM\software\Bullfrog Productions Ltd\Populous: The Beginning`. No actual user registry was read in this audit.

2. **Normal simulation's 12 has a separate producer.** Config descriptor index 39 at `005a9d6c` targets byte `0089d161`, type 1, length 1, default/current value 12, flags `0x1c`. Startup calls real `clear_config` (`0049a940`) at `004a44e9`; its descriptor loop applies defaults for flag 8. Executing that complete routine with initial simulation byte 99 and draw byte 40 produces simulation 12 and preserves draw 40, without intercepted leaves. The later `load_config00` (`0049a9d0`) reads configured values through the same descriptor table. None of its 59 described destination ranges overlaps `0089ce62`. This supports separate draw/simulation settings; it is not proof against every possible indirect memory write elsewhere in the executable.

3. Whole-image linear disassembly found only two explicit absolute stores to `0089ce62`, both in `004a42a0`, and its outer-loop read at `004a45c8`. The negative search is limited to explicit operands in this disassembly, not all aliasing or runtime writes. Existing flyby/acquisition/demo limiter evidence still owns the special requested deadlines 24/20/14, with selector priority demo then acquisition then flyby. It does not establish a universal ordinary 24-Hz target.

## Readiness and additional work/wait owners

- `004b2670` is application-active readiness, not frame alternation or simulation-due logic: null `ui_struct` (`00afc2f4`) returns 0; otherwise it returns `005cdc40`. Constructor `004b0170` initializes that global to 1 (`004b01a1`). Window callback `004b0870` assigns the `WM_ACTIVATEAPP` (`0x1c`) wParam at `004b0a1c`. An inactive offline application skips the ordinary draw branch in `004a4450`.
- The ordinary offline path in `004a5590` returns immediately if its turn deadline is not due. In `004a4960`, the later `004a4bc9..004a4c9f` animation admission tests application readiness and the special network-start condition. Offline calls have no game-turn-due test there. Once admitted, `004ee770` is reached even if `draw_1` returns failure and sets land flag `0x800000`. `004ee770` itself honors pause bit 2 and traverses both allocated-unit lists. No hidden half-rate cadence was found at these caller boundaries.
- The outer pre-draw virtual call at `004a468e` uses UI vtable slot `+0x14`. The constructed D3D UI vtable at `0058f6c8` (`004b1ffa`) selects `00521c40`: its healthy branch tests DirectDraw surfaces through slot `+0x60` (`IsLost`) and returns; lost surfaces invoke recovery/reinitialization. This is device health/recovery, not a numerical animation limiter. Device methods and recovery duration were not executed here.
- **Actual present path:** after `draw_main` and its object visit, outer instruction `004a478a` calls `004b25d0`; that calls `004b0ae0` at `004b2624`. With fullscreen flag `005cdc44 != 0`, `004b0ae0` calls primary surface `0098ea28` vtable slot `+0x2c`, target surface `0098f13c`, flags **1**. It loops on HRESULT `0x887601ae` or `0x8876021c`. The windowed branch calls imported `InvalidateRect`, with no direct Flip call in that branch. `004b25d0` then invokes the `004b0c10` PeekMessage/TranslateMessage/DispatchMessage pump. Message handlers may add work; no fixed rate can be inferred from their presence.
- `draw_main`'s conditional backbuffer/debug path (`005cd91c == 0`) calls `004fd260` at `004a4c29`. It can acquire the shared semaphore through `0052bdd0`, which calls imported `WaitForSingleObject(handle, 0xffffffff)`. Surface helper `00529dd0` then calls surface vtable slot `+0x64` (`Lock`) with flags 1 (`DDLOCK_WAIT`). Separately, `004b25d0 -> 004fd370` can acquire the same semaphore around present/cursor work. These show further potentially blocking leaves; actual contention is unknown.

## API contract, separately verified

Microsoft's official [ddraw.h](https://github.com/microsoft/win32metadata/blob/main/generation/WinSDK/RecompiledIdlHeaders/um/ddraw.h) declares `IDirectDrawSurface::Flip` as zero-based slot 11, so 32-bit vtable offset `0x2c`; `DDFLIP_WAIT=0x1`, `DDFLIP_NOVSYNC=0x8`, and `DDERR_SURFACEBUSY`/`DDERR_WASSTILLDRAWING` as DirectDraw HRESULT codes 430/540. The observed flag is WAIT, without NOVSYNC or an interval multiplier.

The [legacy Microsoft Flip contract](https://learn.microsoft.com/en-us/previous-versions/ms785076(v=vs.85)) documents vertical-blank synchronization and retry-until-setup/error for WAIT. This corroborates a possible presentation dependency. It does not establish when an individual call returns on the historical driver, what refresh mode the user used, or an achieved 12/24/40-Hz cadence. The [current Microsoft contract](https://learn.microsoft.com/en-us/windows/win32/api/ddraw/nf-ddraw-idirectdrawsurface7-flip) also distinguishes successful flip setup from physical display timing.

## Finite native probe and limits

`probe-boundaries.py` passed **19 cases**, exit 0, on CPU4 under an owned 20-second timeout. Reported process wall time was 0.107 seconds; no resource remains held. Exact command, hashes and versions are in `receipt.json`; full results in `result.json`.

- Ten config cases: missing key/value plus DWORD values 0, 11, 12, 24, 40, 60, 61 and `0xffffffff`. Original branch/clamp code executes. Registry constructor/open/read leaves `0052a480`, `00529e80`, `0052a390` are intercepted; registry values and return codes are supplied. Stops at `004a431b`, before unrelated install-path processing.
- One whole `0049a940` configuration-default call, no intercepted leaves: simulation 12 and draw 40 remain separate.
- Three `004b2670` cases, no intercepted leaves: supplied null/active/inactive UI globals produce 0/1/0.
- Five complete `004b0ae0` cases: windowed InvalidateRect, successful Flip, busy then success, still-drawing then success, other error returns. Final COM/Win32 leaves are intercepted, arguments captured, HRESULTs supplied. Real caller retry/order/flag behavior executes. No time is assigned to these leaves, and no clock is used.

All mapped read-only PE regions are compared unchanged after every case. UI/surface pointers are synthetic. Complete startup, configuration files, real registry values, Windows scheduling, semaphore contention, rendering, DirectDraw/GPU completion and achieved wall-clock cadence remain unexecuted. This probe is boundary proof, not gameplay or elapsed-time parity.

## Smallest discriminating next test

Obtain one trusted 10–20-second ordinary-gameplay reference from the canonical native build after the opening flyby/acquisition finishes, unpaused at normal game speed, with recorded DrawFrameRateLimit, display mode/refresh and whether wrappers/patches are present. Track timestamped frame transitions for one stable stationary follower animation and one walking follower, identifying their descriptor/chain; record movement/world-turn pace separately. Compare the same sequences with the current browser's 24 visits/s. A clip without capture-rate/timestamp information or with unknown game-speed/config cannot select an absolute target reliably.

If an authorized instrumented original run later becomes available, log `004ee770` entry times, `004a5590` turn advances, limiter byte `0096ead4`, draw byte `0089ce62`, app-active state, and enter/exit times of Flip/Lock/semaphore waits over that same brief scene. This directly separates requested cap, achieved visits and simulation rate. An emulator supplying those timings would only restate its supplied schedule and is not a substitute for this missing reference. Original OS launch is outside this task's permitted scope.

Before any global clock change, the reference must demonstrate the ordinary intended duration; otherwise preserve this as an explicit open timing requirement under #214. Do not generalize the special flyby 24, simulation 12, registry default 40, or incidental old-hardware bottleneck into a universal browser animation rule.

## Proposed durable integration

After independent review, retain a concise `decomp/research/sprite-animation-caller-pacing.md` note plus the finite probe and exact excerpts/hashes as source research, linking the existing audit and worship timing notes. No gameplay completion or parity credit is claimed. The parent owns repository integration; this scratch-only investigation made no commits or PRs.
