# Mission 3 ordinary construction origin

At base `480deaf8ab68e3aa69bc5397a0c79bbc213f8f17`, Mission 3 Chumara
construction used the live Shaman before its first Tower and the Tower model
anchor afterward. Original `004e5580` instead captures `004f6020` before its
admission branches: absent-base byte `+0x5b4` selects loaded word `+0x5a2`,
otherwise established word `+0x36a`, including zero. `004f5e80` forwards that
value to the task writer unchanged. These retained exports and the loaded-origin
ownership documented in `mission3-convert-origin.md` establish the same owner
already used by Mission 3 Convert and raid consumers.

This correction changes only Mission 3 tribe 2's construction-origin selection.
It does not alter admission, model choice, producer cadence, worker selection,
terrain-search implementation, RNG call sites, or other mission bindings.
Changed settlement geometry can change later simulation draws and timings. Loaded Chumara origin is 0x60da.
The accepted ordinary Tower establishes 0x52de; the prior Temple and Hut requests
instead used the Tower model anchor 0x54de in an unmodified natural opening.

`tests/mission3-building-origin.test.mjs` covers moving the live Shaman before the
first Tower, established and zero bases, and natural Tower → Temple → housing
through turn 3000 with whole-world checkpoint equality. Both baseline and repaired
runs complete a Tower, Temple and Hut and have another Hut underway at 3000,
with population 20. This is corrected placement ownership, not a growth-speed claim.

`check-native-mission3-building-origin.py` executes the hash-pinned original
header knowledge setup, startup interpreter, origin reader, construction producer
and task allocation. Its sole intercepted leaf is available-worker count
`004f67b0`. Supplied Tower owner and housing target isolate loaded, established
and zero-base origins; native allocations are Tower then Hut, not a proof of
school admission. It checks unchanged RNG and includes executable, header,
script, probe and runtime identity in its JSON. Full original settlement,
terrain acceptance and rendering are outside this probe.

Full check/build, rendered controls and browser persistence remain integration
gates. No parity counters, generated assets or original exports are changed.
