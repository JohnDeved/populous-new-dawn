# Ordinary person and Splash animation visits

Issue: [#214](https://github.com/JohnDeved/populous-new-dawn/issues/214).
Original EXE SHA256:
`3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f`.
The [immutable accepted research packet](https://github.com/JohnDeved/populous-new-dawn/tree/681ecb825b997517363b9ab52ac216e394d7b59a/native-logical-gate)
contains the probe, raw results, scoped disassembly, exact source receipts and
independent replay/design reviews. This is an eligibility correction, not an
original elapsed wall-clock calibration or completion of the broad sprite report.

## Native boundary

- `004d23ed`, before the person model switch, ORs flags3 with `0x40100`.
- `004ed8a0` initializes allocation stamps from `sprite_animation_counter`.
  `004ed700` writes that counter to object+0x18 after the logical class processor.
  The outer loop increments the counter each draw iteration.
- `004ee7b0` modes1/2 and ordinary mode4 require a matching stamp when flags3
  contains `0x40000`. Mode3 and mode4's `renderFlags & 0x1000` transition ignore
  this gate. The bit is not a visibility flag.
- Splash initializer `00513830` supplies `0x40400`. The sampled model74/75/76
  smoke initializers supply clear flags, retaining their separate animation owner.

The bounded probe covers 18 person creation-prefix cases for models2–7, twelve
actual setter/dispatcher-stamp/updater timelines, and four effect producers.
Person logical processor bodies and the documented effect height/audio/state
leaves are supplied. This is not a full person initializer, renderer, or historical
OS timing execution. The independent review also inspects later initialization
writes and current controller masks for preservation of the gate.

## Elapsed-time adapter

`createLivePerson` and checkpoint restoration supply only the proved `0x40000`
gate for models2–7. Existing movement interpolation keeps its current owner;
`0x100` is not added. Wildmen/Angel and other families retain their existing path.

`advanceGame` partitions at every logical turn, including high-speed catch-up
without presentation hooks. Its order is turn body, after-turn observer, queued
after-turn callbacks, logical animation, then a coincident 24Hz presentation
visit. `tick` alone remains simulation-only. Land-pause drains no logical visit.

`animateLiveObjects` selects the current source once, including flight, fight,
native, entry and builder aliases. The logical phase stamps eligible ordinary
records with the completed `World.turn` and supplies that same value to the
native-equivalent updater. This stamp is the adapter's last logical animation
visit, not the original draw serial. State0/removed records retain logical phase
ownership but are ineligible; detached records do not receive a trailing visit.
Mode3 and morph-transition branches are presentation-owned even with the gate.

Splash shares the logical phase. A new surviving Splash at the turn boundary gets
one animation visit without an invented lifetime visit; retired effects get none.
Other effects, fallback artwork, Stone Heads and UI retain their owners. The
global presentation frequency remains24Hz. Command27 no longer needs a final-frame
hold on its logical path because the next controller sees each intermediate frame;
the legacy presentation path retains its compensation.

Checkpoint migration preserves frames, stamps and status bits across all aliases.
A new Scene clock cannot replay the saved logical visit. Tests cover these
lifecycles, allocation, branch transitions, delayed descriptors, turn wrap,
pause/speed/catch-up and actual worship completion across refresh schedules.

The remaining fallback Firewarrior descriptor-delay lead and the user's broad
report stay open in #214. Synthetic portable tests and native helper equivalence
must be supplemented by the ordinary current-source browser comparison.
