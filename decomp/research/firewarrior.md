# Firewarrior launch and open boundaries

Preserved 2026-09-13. Research only; no playable Firewarrior feature or parity credit.

## Reuse before investigation

The proposed mission-one slice assumed model 6 was a person. In `app/level-one.ts`,
the model-6 objects have type 6; there is no type-1 model-6 person. A future feature
needs an original acquisition/training or mission path before player integration.
The discarded task also excluded training. Do not repeat its availability assumption.

Existing exports: `0051a2a0` (attack phases), `0051f990` (readiness), `004bbf30`
(projectile update), and `00514410` (impact). Newly retained exports are
[`0051fbf0`](../generated/0051fbf0.c) (paired allocation/cooldown) and
[`004bbcf0`](../generated/004bbcf0.c) (projectile initialization).

The parent exported the latter two at 22:01 Europe/Berlin on 2026-09-13 using
`python3 scripts/decomp.py export <address> --output .tools/decomp/comparison`.
These are byte-identical copies of those scratch exports; their hashes are in
`decomp/exports.json`. Tool: Ghidra 12.1.3; executable SHA256:
`3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f`.
The exporter verifies loaded section bytes before copying completed output.
Names/types may be inferred from the manifest's community metadata; pseudocode is
not original source. No new Ghidra run was needed to preserve these artifacts.

## Reproducible observation

Run `.tools/decomp/oracle/bin/python scripts/probe-native-firewarrior.py <executable>`
with the matching `levels/constant.dat` adjacent to the executable. The probe uses
`native_cpu` hash verification and `configure_native_constants` to validate balance
data against the imported constants. It creates flat terrain and two synthetic people.

On 2026-09-13, the retained probe passed paired class-8/model-6 allocation, nonzero
cooldown, owner/target binding, nonlethal impact, and observed projectile deletion.
It runs `0051fbf0`, native initialization via `004ed580`, and `004bbf30`; it then
observes direct `00514410` damage for target models 2 through 8.

With initialized supplied balance data, observed damage was
`{2: 200, 3: 104, 4: 200, 5: 200, 6: 200, 7: 200, 8: 109}`.
These are sequential synthetic-fixture observations; each model is not constructed
through its full native initializer. They are not a general per-class damage table.
The old scratch probe expected `{2: 500, 3: 600, 4: 500, 5: 500, 6: 500, 7: 200, 8: 500}`
and failed after balance initialization. That earlier table is not a verified rule.
The retained probe reports the observation instead of asserting that unsupported
table; it is an exploratory executable probe, not a browser/native comparison.

Rechecked for the Mission 8 slice on 2026-09-15: ordinary on-foot launch creates
two projectiles, sets cooldown 25, uses speed `0x200`, and renders object `0x460`
with descriptor row `0x1d`. The executable's tower cooldown is 36 despite the
supplied text constant naming `SW_BLAST_RATE_TOWER` as 100. The live slice covers
only cooldown 25 and ordinary brave impact; tower, bloodlust and other target
classes remain outside its comparison.

## Boundaries and next step

The allocator at `004ed8a0` is supplied with two slots; sound `0048a050`, animation
`004ee700`, sunlight `004010b0`, and consumers `00520610`/`004de570` are intercepted.
Deletion `004edcf0` is observed and allowed to execute. World lists, terrain,
occupancy, positions, health, and the allocation context are synthetic.

This does not prove normal targeting, terrain line-of-fire, repeated firing, rendered
projectiles, tower behavior, bloodlust, allocation exhaustion, lethal side effects,
or whole-world integration. Do not hard-code the observed damage table into gameplay.
Next: establish the original acquisition path, then trace balance/protection and
impact side effects for that scope and build a browser/native comparison using these
existing exports and probe. Preserve any newly exposed uncertainty here.
