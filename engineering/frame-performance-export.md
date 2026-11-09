# F8 recent-frame diagnostics

Open F8 before reproducing a slowdown, then choose **Export recent frames**. The
button is also reachable with Tab and activates with Enter or Space. Only this
button intercepts pointer input; the rest of the graph remains click-through.
The action downloads JSON locally. It does not upload anything.

The raw capture is a fixed 1,200-frame numeric ring independent of the graph's
240-frame rolling window. This is about 20 seconds at 60 RAF/s or 10 seconds at
120 RAF/s, not a fixed-duration recording. The export includes its actual
`capturedSpanMs`, sample count, and chronological frame timestamps. Export does
not clear the capture. Turning F8 off, losing focus, or hiding the tab resets it;
re-enable before reproducing another issue. Serialization occurs only on request.

Schema `populous-new-dawn/frame-performance`, version 1, includes RAF intervals,
inclusive callback CPU, simulation CPU, scene-render CPU, pointer/tooltip CPU,
signed other-callback CPU, nested pointer phase timings/counters, draw-call counts and each frame's live/paused/menu state.
All timings are milliseconds. RAF timestamps use `performance.timeOrigin`; the
origin is included as Unix milliseconds, with ISO export/enable times.
The first interval's start is included in the actual captured span.

CPU timings are synchronous wall-clock measurements, not GPU execution or
presented FPS. The callback contains its CPU stages, not additional time to sum
on top. Other callback CPU is a signed remainder so inconsistent ownership is
visible. Graph rendering and the export operation are outside callback CPU but
can still affect the following RAF interval. Browser/OS scheduling may do so too.

The file includes browser user agent, browser-reported renderer/core/RAM hints,
viewport, device pixel ratio and drawing buffer dimensions at export time.
Hardware hints can be coarse or unavailable. The build embeds the actual Git
revision with a `-dirty` suffix for tracked or untracked modifications; an archive without Git
metadata reports `unknown`. No URL, account details, save, seed, entity contents,
or other world state is serialized. Review the file before sharing if browser
or hardware information is sensitive to you.

`pointerBreakdown` is null when unavailable, otherwise includes terrain picks,
object picks, nested unit/model/occlusion time, object cache hits, tooltip input
publication and tooltip rendering. These are overlapping diagnostic scopes, NOT
additive CPU stages: tooltip input includes its picks, object picks include their
unit/model/occlusion phases, and tooltip rendering occurs outside pointer CPU.
Layout flushes are attributed to the phase where the browser executes them, not
necessarily where DOM writes originally dirtied layout. Session metadata includes
only the numeric campaign level, not the world/save.

Optional frame-level `waterUpdateReasons` is render-side call evidence, not pointer
CPU or a duration. The F8-enabled animate → environment → water caller ORs these
bits within the current frame: 1 existing same-key early return; 2 missing waves;
4 initial/unknown previous key; 8 changed turn; 16 changed land revision;
32 changed light revision; 64 changed terrain geometry identity. Zero means no
observed water call; absent means this diagnostic was unavailable. No identities,
coordinates, key strings or water attributes are exported. Calls outside this
explicit frame carrier do not modify its evidence. Reset/ring replacement do not
retain old reasons. Multiple calls collapse into one mask, not a call count.

A light-only changed key (32, optionally combined with same-key bit 1) identifies
an opportunity to investigate redundant position dirty marks, not proof of stable
stored bytes or savings. Water, land, custom helpers and downstream renderer costs
are not measured here. Initial/invalidated keys cannot be classified further;
combined masks lose ordering. This adds no PR553 dirty-mark optimization, scans or
clock reads. When F8 is off, no reason object is created/reset and no keys are
split for diagnostics. Schema version 1 and the 2 MiB parser bound are unchanged;
the actual compact 1200-frame download test includes this field and all current
optional pointer details.
