# Blast person targeting: accepted first ordinary stage

On 2026-10-08, independently reviewed baseline 20 and candidate 24 completed their
respective ordinary Mission2 witnesses. This is a friendly-person identity, HUD,
moving-aim and parent-impact result. Enemy damage, original-game execution,
remaining interruption/checkpoint controls and final combined-tree checks are
separate. PR267 remains the historical implementation and trial record; its
original 00:10:12 UTC trial freeze and every failed attempt are preserved.

## Exact products and observed behavior

- Baseline: `b1ee7aba72f440040155216fe35a3fbd2d79d13c`. The actual person pixel
  delivered a ground cast at turn321. Public movement 325 occurred during windup;
  windup and flight motion were observed, with arrival 329 and fixed-ground
  impact 330. Natural flying 327 and impact 331 frames were retained.
- Candidate: `c40026937f39dadf86143ef13f73dba22d2e4a9c`. Natural hover 331 preceded
  the actual trusted person release 340. Original Shaman 54 cast on Brave 278;
  the same Brave received the exact public model 3 move 343 with three windup
  turns remaining. Ten adjacent visits preserve the accepted movement order
  and actual windup and flight motion. Shot 1252 arrived 349, while parent
  wave 1263/flash 1264 at 350 used the target's updated pre-impact position
  `(-97.2109375,-101)`. Stock 4→3 and exactly one cast were retained.
- Candidate natural frames show the 16-line hover 331, 32-line acknowledgment 343,
  owned projectile head 1254 during flying 348, and impact 350. Both raw receipts
  passed with stable source/runtime/scenario, no browser errors, and verified
  profile cleanup/continuation. No checkpoint was created in this stage.

The products share the current-main application baseline, with eight candidate
application files implementing Blast person targeting. QA methods differ: baseline 20
is accepted historical evidence under an explicit consumer/lifecycle correspondence,
not an execution of the candidate's later notification/HUD checker. Camera headings,
turn histories and capture phases differ. These images support the declared
behavioral comparison; they are not a pixel-diff or timing-equivalence benchmark.

## Actual images and their limits

[Baseline fixed-ground impact](baseline20-impact.png) and
[candidate tracked parent impact](candidate24-impact.png) are unmodified game-canvas
PNGs from their natural render callbacks. The [candidate flying projectile](candidate24-projectile.png)
shows its actual submitted head visual. Full-canvas pixel counts are not isolated
effect-pixel counts. No frame was forced, and flight is not relabelled arrival.

The [hover raster](candidate24-hover-brackets.png) and
[acknowledgment raster](candidate24-ack-brackets.png) are detached rasterizations
of frozen, naturally drawn DOM SVG and computed style, with 94 and 188 positive
pixels respectively. They are not full-game screenshots or composites. The game
canvas excludes that DOM overlay. Ack records the actual consumed RAF time and
original target/pose/context; its rasterization was deferred until after input.

## Static basis and retained scope

The [accepted original static report](https://github.com/JohnDeved/populous-new-dawn/blob/0d32cac626b8d95d0fe527f861dc22473b83f8dc/decomp/research/blast-targeting-normal-input.md)
and [exact byte/hash index](https://github.com/JohnDeved/populous-new-dawn/blob/0d32cac626b8d95d0fe527f861dc22473b83f8dc/decomp/research/blast-targeting-normal-input.json)
close the normal bit-clear selector→packet→spell/shot identity chain with early
mission-header setup evidence. They do not execute original instructions.

The port covers plain 0x6a person release. Ctrl 0x6b mode retention, the special
bit-set path, arbitrary object targeting, full original composition and enemy
damage parity remain outside this witness. Other spells, range/payment/RNG and
bit-set behavior are unchanged. Valid allocated dead/airborne people retain
tracking; deletion/class-zero/removal clears identity without reacquisition.
The [historical QA source and failed attempts](https://github.com/JohnDeved/populous-new-dawn/tree/c40026937f39dadf86143ef13f73dba22d2e4a9c/qa/blast-ordinary)
remain immutable, including the denied session's UNKNOWN status.

## Portable file identities

Baseline episode SHA-256: `73acb1a5e1c2c032696881bbaba8bc926d84f8474429d397209dd820b9aedcb5`.

Candidate episode SHA-256: `5848a9de15da6a5b489e969a9e353f584fe873e38403ae45d1c131d49b935250`.

- `baseline20-impact.png`: `f53e8f1e08434d8711cb83d2eb505f24d3d00789f04fc1c269aa8e9765c165ea`
- `candidate24-impact.png`: `5b7965c4a48e65e001a48686d64de3549503ee8da977c75e13608d02e1bf0176`
- `candidate24-projectile.png`: `65d9733414fe880c6157853d96c13bd42fd6c822272e85174f88135daabb0a4c`
- `candidate24-hover-brackets.png`: `912218574470988e6e85b7c2c5b16035d3bcbf5ceacd3f186da14d49412637dc`
- `candidate24-ack-brackets.png`: `1ec7c1a1ec79bbc614dd743a925e3eccc0e4413024b9f837cfe533ffe8b5e145`
