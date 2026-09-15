# Mission 6 opening and tribes

## Inputs

- `levl2006.dat`: `264d69d98965465325a4b0e6ec1b1f9145d2a407e68ca9472e6a76a60a1a8a62`
- `levl2006.hdr`: `65321079e12c036738a5a7c5049c0e292af43f071a265512408953c822ce781b`
- `cpscr014.dat`: `7ee29a7c5e3f49bee4e2a40c1ef0bf5b1796d082dd3396e1a5a85900c917cb1a`
- `cpscr015.dat`: `01dcc425abaf6bf9680e1d62cede2d5c3a0de9739631d69516d810bc424b8e60`

Header bytes 88..91 are `[4,14,14,15]`. Native `00485660` loads script 14
for tribes 1 and 2 and script 15 for tribe 3. The level starts tribe 0 with six
Braves and a Shaman, Chumara tribe 2 with six Braves, a Warrior, and a Shaman,
Matak tribe 3 with six Braves and a Shaman, plus 172 wild people.

## Opening state

Before control, both scripts enable state bits for commands 1029, 1030, 1031,
1033, 1034, 1035, 1036, 1037, 1039, 1045, 1046, 1047, and 1048. Commands
1066 and 1067 store the two task-9 bytes (`33,25` in script 14; `34,24` in
script 15). Commands 1123 and 1125 enable the reactive Blast and periodic
enemy-Shaman Lightning flags.

Internal reads 1051 and 1060 use the loaded Lightning and Land Bridge costs,
80000 and 70000. Script 15 therefore initializes variable 32 to 150000.

Mission 6 object positions are signed little-endian fixed-point words. Object
103, the blue Shaman, decodes to native `(15104,13708)`, browser
`{x:51,z:-61.546875}`, on supporting land. It is an ordinary live person with
state 0 and no container; nearby class-7/model-26 object 21 does not hold or
move it. Native loader evidence is in `00484a10`, allocation initialization in
`004ed8a0`, and level postprocessing in `00485b00`.

## Turns and outcome

`00461510` visits all tribe ids below the mission tribe count and passes each
computer its original id. Mission 6 therefore schedules Chumara as 2 and Matak
as 3 rather than merging both into tribe 1.

On eligible turns, `00418e30` checks every opponent below tribe count without
an active-tribe gate. Defeating only tribe 2 or only tribe 3 starts that tribe's
defeat timer and does not win. Once both are empty, it sets victory
`0x02000000` and completes level index 5.

## Evidence and limits

The recovered scripts were stepped with their effects intercepted. Verified
native scheduler and outcome probes covered 2,048 and 2,071 calls respectively,
plus the four Mission 6 outcome cases. A direct verified-executable leaf probe
returned the two spell costs. Static loader disassembly and a terrain check
verified the Shaman placement. This evidence does not establish the later
Mission 6 script, AI, tutorial, vehicle, or class-7/model-26 behavior.
