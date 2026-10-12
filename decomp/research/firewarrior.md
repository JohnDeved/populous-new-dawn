# Firewarrior launch and open boundaries

Preserved 2026-09-13 and extended through 2026-09-17. Bounded live slices exist;
this file records evidence and open mechanics rather than parity percentage.

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
cooldown 25 and ordinary Brave impact. Bloodlust and other target classes remain
outside its comparison.

## Guard-tower combat composition (2026-09-16)

The retained [`0051f470`](../generated/0051f470.c) export and
`scripts/probe-native-firewarrior-tower.py` compose the state-21 tower scanner,
readiness, paired launch, and Brave impact against the hash-verified executable.
At flat ground height 128, the tower range is 13: native scales idle range 11 by
`engagementHeightFactors[clamp(signedHeight >> 7, 0, 7)] / 256`, adds four for
tower support, then forces the result odd. The scanner uses even radius 12 and
row-major cell/list order through the common combat selector. Readiness uses a
strict per-axis limit of `range * 256 + 56` (3383 passes, 3384 fails) plus terrain
occlusion. State 21 scans on the model-6 mask-3 cadence only when cooldown is zero.

The paired projectiles start at perpendicular offsets of -96/+96. After the lateral
step, native clamps their base height to the higher of the source ground and terrain
at that offset, then adds tower support height plus 16; the tower cooldown is 36.
The probed hostile Brave takes 500 native life, mapped to 25 browser HP for the
marked impact projectile. The paired unmarked projectile does not call damage
(see the October 12 correction below). A lethal impact requests kill credit with the source and target identities.

The probe supplies the global order and projectile slots and intercepts order
allocation/attachment/sharing, audio, animation, sunlight, and the downstream
kill-credit consumer. Browser terrain-line sampling, the special level-flag range,
building targets, Bloodlust, broad target damage, and full native play remain open.
The retained second probe is intentional: it isolates the substantially larger
tower scanner composition from the ordinary projectile-impact oracle.

## On-foot automatic response (2026-09-17)

Native on-foot model 6 uses a shared command-21 response, not the ordinary combat
selector or the tower's direct-target adapter. The exact owner chain is periodic
dispatch `004d4690`, cooldown gate `0051fcd0`, initializer `0051e9a0`, specialist
scan/readiness `0051f470`/`0051f990`, command-21 execution `0051a2a0`, specialist
selector [`0051d0b0`](../generated/0051d0b0.c), target preparation `00520300`, and
paired launch `0051fbf0`.

Run `.tools/decomp/oracle/bin/python scripts/probe-native-firewarrior-auto.py
<executable>`. The retained no-hook probe executes complete `0051d0b0` and ordinary
`0051c4c0`. In its verified fixture the specialist selector chooses the farther
hostile model 6 while the ordinary selector chooses the nearer model 4. Repeated
specialist selection sets reservation `0x200000`, moves to the unreserved person,
then falls back to the first candidate once all are reserved.

Substates 10/11 launch once in phase `0x2c`, retain command 21 through the firing
animation, then phase `0x28` waits for the tracked projectile to disappear or six
visits. Phase `0x2d` is a shared-recipient cooldown wait and never launches. The
next volley is a fresh scan and command after cooldown; player movement replaces
the response, source death clears its orders, and target loss completes the command
without deleting an already-launched projectile.

The checked-in export was produced with Ghidra 12.1.3 from executable SHA256
`3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f`; its manifest
hash is `257d830a5597b5e39d8bf6d178e5c053d2391add96f7899d8470a793337b2853`.
### Completed-building target branch (2026-09-17)

The same indexed exports prove the missing completed-building branch without a new
Ghidra run. When the current person-state flags contain `0x08`, `0051e9a0` may create
automatic command 21 with flags `0x22`. `0051d0b0` admits hostile completed class-2
buildings and returns target type 3; `0051a2a0` maps that type plus source model 6 to
substate 11, which shares the ranged `0051fbf0` launch instead of ordinary building
strikes. `0051f990` uses building coordinates, the usual strict per-axis range, and
the retained terrain-line test.

`004bbcf0` marks only the second tracked projectile for impact. Its
`004bbf30 → 00514410 → 00409200` path adds `blastBuildingDamage` 40 and records the
projectile tribe as attacker; cooldown 25 gates the next fresh volley. Mission 8 has
no authored enemy class-2 building, so live browser acceptance uses Mission 10's
authored completed Green Hut and its shipped training, HUD selection, and building
command path. Plans, broad terrain-line coverage, Bloodlust, tower-origin building
targets, and complete destruction remain open.

## Boundaries and next step

The allocator at `004ed8a0` is supplied with two slots; sound `0048a050`, animation
`004ee700`, sunlight `004010b0`, and consumers `00520610`/`004de570` are intercepted.
Deletion `004edcf0` is observed and allowed to execute. World lists, terrain,
occupancy, positions, health, and the allocation context are synthetic.

This does not prove general terrain line-of-fire, Bloodlust, allocation exhaustion,
broad target damage, or whole-world native play. Do not hard-code the ordinary
synthetic damage table into gameplay. Preserve any newly exposed uncertainty here.

## Paired unit-impact ownership correction (2026-10-12)

At main `0d355b62051b0f324bacf6acc2c33345619d42bc`, a real launch followed by the
production shot consumer damaged a supplied 100 HP Brave twice: the complete pair
left 80 HP, while each isolated side left 90 HP. The first side already carried
`impact:false`, but only the building-damage branch respected that marker. This
observation is a supplied CPU fixture, not normal acquisition or whole native play.
The original failed state is retained separately from the repaired tests.

The original contract is direct in the already indexed
[`004bbcf0`](../generated/004bbcf0.c) and
[`004bbf30`](../generated/004bbf30.c) exports: initializer side 0 leaves terminal
mode 0, side 1 gets mode 1 for an entity target, and only mode 1 calls the
[`00514410`](../generated/00514410.c) damage consumer. The old probes initialize
both projectiles but advance the second through impact. They do not justify the
former prose's “per projectile” interpretation or damage on the first visual side.
These sources retain the executable hash and tool provenance recorded above; no
new original-executable run is claimed.

The repair gates unit damage, successful-damage attribution and hit feedback on
impact ownership. The first side still flies and expires; it cannot damage, claim
a lethal hit or emit a unit-hit effect. The second retains the existing damage
amount, Bloodlust/Shield behavior and source-loss policy. Building damage remains
restricted to explicit `impact:true`; its first visual side also stops emitting
unearned hit feedback. Launch geometry, pairing, cooldown, trajectory and lifetime
are unchanged. This is not a new per-class damage-table, splash, source-loss
attribution or full projectile fidelity claim.

### Legacy snapshot compatibility

The optional marker predates this correction. Explicit false is harmless and
explicit true owns impact. An absent marker retains the old in-flight unit-hit
behavior, without guessing a side from array order or position. Missing-marker
building damage remains disabled as before. This is an explicit compatibility
policy for an ambiguous old browser record, not an original-save equivalence
claim. Current launches always store the complete false/true pair.

### Stronger regression expectations

`tests/firewarrior-impact-owner.test.mjs` exercises ordinary/tower and Bloodlust
pairs, first-side harmlessness, Shield, successful-damage attribution, kill credit,
source loss, building markers, legacy missing markers and checkpoint continuation.
The maintained Mission16 assertion changes from two damage applications to one,
while preserving its acquisition/status and protection checks.

The tower witness is split rather than widening its old 32-turn kill deadline:
- A 25 HP target preserves all selector, stealth/protection and kill-owner assertions,
  dying from the one marked tower hit within the original 32-turn bound.
- A 50 HP target must have exactly 25 HP after the first pair and no kill credit. The
  next pair must launch exactly 36 turns after the first. Normal combat may reveal or
  retarget another enemy, so the test does not force a second hit on the same ID.

The attempted same-target second-volley assertion failed because the existing
ordinary combat correctly changed eligibility/targets between volleys. Its
failure/diagnostic is retained; AI and retargeting were not disabled to satisfy it.
Fresh native execution and rendered acquisition/combat acceptance remain unrun;
no parity, complete specialist coverage or release-gate closure follows.

The first full gate on the impact-owner repair exposed an existing Mission18
fixture placement assumption: all three supplied head slots used the fallback
heading256, while native-linked scenery474/477/480 supplies512/1536/512.
With corrected combat ownership the final head had no eligible worshipper at
turn196, so the native zero-follower sample decayed work7199 to7163; three
eligible at200 only restored7165. All six supplied followers remained alive.
The base happened to admit one at196 and finish. The fixture now uses the same
canonical `worshipHeadPose` as command admission and the production count, and
asserts head completion before waiting for the gift. Its8-turn admission,
8-turn completion and82-turn gift bounds and both Volcano rewards are unchanged.
This corrects test placement rather than changing worship or Firewarrior timing.
