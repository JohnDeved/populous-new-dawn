# M16 seated cast lifecycle

Base: efdd4d51865fc0e25429127bc54c2f3ac6a184a8. Ordinary M16 continuation
produced Balloon8830 and replacement Shaman8286. At turn26250 a public earned
Tornado was admitted from a resting passenger (state30). Independent actual-clock
replay creates projectile8853, launches it26256 and creates Tornado8908 at26259.
The browser casting wrapper remains0.5 through26280 and the actual campaign26749;
subsequent public casts reject. State30's unconditional continue preceded the
wrapper countdown. This is separate from pilot115's command19 mode1 departure
and subsequent tactical death, both retained in player history.

## Original source, static only

The pinned original EXE SHA256 is in `m16-seated-casting-evidence/source-hashes.txt`.
It was never executed or emulated. GNU objdump commands (Intel syntax) used
`objdump -d -Mintel --start-address=A --stop-address=B D3DPopTB.exe`:
4c1b80–4c1d80, 4d2740–4d3000, 4d32b0–4d3a80, 4d3e30–4d3ea0.
Tool version, raw disassembly and indexed export hashes are adjacent.

- 004c1b80: unless flags2 bit100000 protects the Shaman, save previous state,
  release old state and enter22. There is no seat or command18 exclusion.
- 004d2740 direct state22: release motion, timer10. A seated person uses
  004d3ff0 cargo row4 or empty row0; ground fallback uses object6d.
- 004d32b0 prepares people before switching on state minus1. Case0x15 is
  state22, decrements its timer and completes through004d31f0/004e9dd0/004d3e30.
- 004d3e30 returns the model default state (Armageddon39 where applicable),
  rather than restoring previous resting passenger state30.

## Narrow live repair

Extend existing command18 cast-state admission to an existing seated native
owner. Use the existing state22 ten-visit timer and seat-aware animation row;
perform the normal native preparation/physics visit once for seated state22.
Retained work orders cannot preempt that cast state. Public seated admission
honors state22 even after the independent six-visit browser windup clears.
Protection, seat registry, stock allocation and projectile ownership persist.

Ground non-command18 cast admission, adjacent-but-unseated pose lookup, terrain
height used for spell range/projectile origin, and full native expiry anchor
reset remain existing adapter limits. This does not claim complete aerial spell,
combat, original AI, rendered browser, or hardware parity. State22 completion
still uses the existing default-state adapter.

## Tests and evidence

`tests/seated-casting.test.mjs` uses the immutable ordinary turn26250 checkpoint
(gzip fixture with asserted uncompressed hash), two public earned Tornados,
Save/Load twins and shipped simulation/animation clock. It requires distinct
single projectiles/new effects, stock -2, six-visit wrapper, ten-visit native
state, rejection during the intervening visits, exact seats/browser/registry/cell
identity and one preparation counter per turn. Separate supplied controls test
moving Boat/Balloon ownership, retained command19/reference count, reaction
preparation, cargo and protected admission. They are not acquisition witnesses.
Independent player replay must retain the actual prior public pilot commands and
casualty history before checking the next seated cast. Gate statuses and raw
historical failures belong in the accompanying verification report.
