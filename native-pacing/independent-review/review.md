# Independent native pacing research review

ACCEPT the finite research findings at source `596475b6839c948604897f8b68ff89c6290cf39d`. No blocking error was found in the reviewed byte constants, producer separation, interception scope or conclusion. This acceptance is research evidence only: no browser rate change, gameplay parity credit, intended absolute cadence or achieved native rate is established.

## Inputs and independent replay

Reviewed findings SHA-256: `550506ac29fd13d2aa7823938c01acbb574cdbd1ea5583e46eed773ca6b3bd74`.
Probe SHA-256: `9f0420c4288eff677715c6bd91b9ddfb25c96915e30eab48c768921f3f8e989a`.
Native executable SHA-256: `3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f`.

The explicitly authorized independent replay used CPU4 with a20-second timeout, Unicorn2.1.4 and the existing verified PE mapper. It completed with exit0 in0.320 seconds, passing19 cases. Its complete JSON is byte-identical to the owner's result: `dfd2f5daa201ddef9dc706adda593008a875a459075418de6389dbfb5d008345`. No original Windows process, Ghidra, browser or package job was run. Replay command/output are retained adjacent to this review.

Independently matched4,124 bytes across all16 scoped disassembly excerpts against the actual pinned PE image. The constructed UI vtable slot at0058f6c8+0x14 contains00521c40. All59 separately decoded descriptors match the probe's direct-byte descriptor output, including simulation default12 at0089d161. Detailed excerpt hashes are in byte-correspondence.json. Linear disassembly can include data or partial entry lines; this review relies on the stated instruction boundaries and exact native entry execution, and does not interpret every displayed line as reachable code.

## Accepted source conclusions

- Startup calls004a42a0 before later setup. Actual instructions write default40 to0089ce62, then conditionally clamp the supplied unsigned DrawFrameRateLimit value to12..60. Missing key/value preserve40. The ten controlled cases execute these native branches while registry constructor/open/read results are supplied. The registry path is recovered from original data and the zero second argument selects HKLM; no user's registry value is observed.
- The descriptor loop in0049a940 independently writes normal simulation default12 and leaves draw40 unchanged. This complete call has no intercepted leaves. The simulation consumer004a5590 computes its turn interval from0089d161. Draw settings and simulation settings are distinct; none of the59 descriptor destination ranges overlaps the draw byte. This is not an all-alias-write proof for the whole executable.
- Application readiness004b2670 checks the UI pointer and application-active global. Constructor and WM_ACTIVATEAPP paths support that identity. The native readiness calls return0/1/0 for supplied null/active/inactive inputs. This is not an alternating-frame or simulation-turn gate.
- In the ordinary offline route,004a5590 can return when its turn is not due. The later004a4960 admission shown in the exact bytes gates on application activity and network-start conditions, then reaches004ee770. Draw failure sets the relevant flag but does not bypass that later animation call.004ee770 itself checks pause and traverses both allocation lists. No ordinary12/24 cadence gate is established at these reviewed boundaries; the special limiter flags remain separately owned evidence.
- Healthy00521c40 performs surface IsLost queries; recovery calls are conditional. The complete native004b0ae0 probe shows windowed InvalidateRect or fullscreen Flip with target override and flag1; supplied busy/still-drawing codes cause retries, while success and another error return. Conditional surface Lock and semaphore calls show possible additional waits. Device leaves, message dispatch work, semaphore contention and their durations are not measured.

## Microsoft contract check

Official [Microsoft ddraw.h](https://github.com/microsoft/win32metadata/blob/main/generation/WinSDK/RecompiledIdlHeaders/um/ddraw.h), retrieved2026-10-05, confirms the32-bit interface offsets Flip0x2c, IsLost0x60 and Lock0x64; WAIT flags are1, NOVSYNC is8, and HRESULT facility/code construction matches887601ae/8876021c. The native Flip flag has neither NOVSYNC nor an interval multiplier.

The [legacy Flip contract](https://learn.microsoft.com/en-us/previous-versions/ms785076(v=vs.85)) describes vertical-blank synchronization and WAIT retry until setup or another error. The [current Surface7 contract](https://learn.microsoft.com/en-us/windows/win32/api/ddraw/nf-ddraw-idirectdrawsurface7-flip) corroborates setup/wait semantics, with its version-specific default kept separate. Neither contract supplies historical driver duration, refresh rate, full scanout completion time or achieved gameplay frequency. Using the API contracts as evidence of potential dependencies, rather than an assumed rate, is appropriate.

## Probe and inference boundaries

Each native case has a100,000-instruction and1-second emulator bound plus the outer20-second timeout. Configuration cases stop before unrelated install-path work; complete default/readiness/Flip callers stop at the sentinel return. Registry and COM/Win32 leaves are explicitly intercepted, synthetic pointers and HRESULTs are supplied, and no clock is supplied. Final bytes of mapped readable/nonwritable PE regions are compared unchanged after every case. This guards final source bytes; it is not a report of real OS or GPU behavior.

The findings correctly distinguish requested draw deadline40, configurable simulation12, special24/20/14 limiter requests, and the browser's observed24 visits/s. None alone identifies authored ordinary sprite duration. Keeping the current browser clock unchanged pending discriminating reference evidence is justified; a universal12/24/40 replacement would be unsupported. Original hardware stalls also cannot be promoted into the modern browser's intended cadence.

The proposed short, timestamped reference with build/config/display/wrapper context is a concrete next discriminator. A clip alone still needs evidence that capture or historical hardware stalls are not defining the target. A native emulator with supplied times cannot fill that historical wall-time gap. The user report and issue214 remain open; no runtime fix or bug attribution is accepted here.

No resources remain held. The parent owns any durable source-note integration and subsequent reference acquisition.
