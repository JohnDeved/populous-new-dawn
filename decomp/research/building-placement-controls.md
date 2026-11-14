# Building placement controls

Issue [#1007](https://github.com/JohnDeved/populous-new-dawn/issues/1007) concerns
retaining the selected building after placement. The browser adapter changes only
release-time input dispatch and whether successful placement clears `world.mode`.
It does not replace the browser's existing validation, workers, resource rules,
rotation, spell controls, Escape behavior, checkpoint format, or command allocation.

## Native default lookup

Input: `d3dpoptb.exe`, 2,275,840 bytes, SHA-256
`3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f`.
The [setup procedure](../../engineering/native-setup.md) restores this original as
data; these probes never launch its Windows entry point. Unicorn 2.1.4 executes the
PE32 routines through `scripts/decomp.py`'s hash-verified mapper.

`00489300` constructs 188 runtime nodes from the default table at `005d5de8`.
`00489470` searches the ordered linked list for the event. The reproducible probe
executes that constructor, verifies each complete pointer chain against all original
records in their original order, and then executes the mapper and its reached
predicates unchanged. Only allocation at `0055aca0` is intercepted to supply owned
15-byte node storage. Native keyboard character conversion uses a supplied empty
translation table; its return domain `0..0xdc` cannot alias pointer slots `0xf0/0xf1`.

In targeting mode 7, with the tested input gate open:

- Left release, phase 4, no modifier dispatches ordinary action `0x77`.
- Left release with exactly Ctrl (`2`) or exactly Alt (`4`) dispatches retained
  action `0x78`. Shift and combined modifier masks dispatch neither action.
- Right release dispatches cancel `0x7c`, independent of these three modifiers.
- Press phase 1 does not dispatch those placement/cancel actions.

The upstream callback samples the current modifier mask on release, not a mask
latched on press. Physical Ctrl scans `0x1d/0x9d` produce bit 2; Alt scans `0x38/0xb8`
produce bit 4. The browser therefore reads the release `PointerEvent`.

The probe checks 1,184 supplied-state cases: 1,024 combinations of the pointer
slots, all eight modifiers, both phases, gate flags, camera latch and cursor flag;
32 adjacent-mode controls; and 128 Escape lookup cases. The conjunction of land
bit 8 and overlay bit 4 blocks placement/cancel. In a blocked state, unmodified
right release can instead reach existing camera-release action `0x73` when its
latch is set. This is not a mandate to rewrite the browser's distinct modal gates.

Escape's earlier modal/complementary predicates shadow its `0x7c` record in the
supplied non-aliasing character map: modal dispatch is `0x46`, otherwise land bit
`0x80000000` selects `0x9d` versus `0x9b`. This is not evidence for changing Escape
to an unconditional native placement cancel. Saved keyboard layouts and upstream
UI callback gates are outside this probe.

Reproduce with a fresh output directory outside source control:

```sh
python scripts/check-native-placement-controls.py /absolute/d3dpoptb.exe /absolute/fresh-proof
```

The result records executable identity, all cases, predicate observations,
intercepted/supplied boundaries and complete checked chains. The table bytes include
the terminator (189 records), SHA-256
`9cbc7d21a93e66f6bb6693c7f74d38c4b73a9b17321312f470608f18ff5f8eed`.

## Action and cleanup boundaries

The [issue investigation](https://github.com/JohnDeved/populous-new-dawn/issues/1007)
traces actions `0x77/0x78`: the ordinary accepted branch emits tribe command `0x0e`
then calls `004b9150` and `004ba5d0`; only `0x77` requests mode exit, except descriptor
`0x0a`. Current browser building descriptors are `1,4,7,5,6,8,13,15`, so none uses
that exception. Requesting native mode zero may redirect to mode 12 when people
remain selected. Retention is not proof that the downstream plan allocator accepts
or rejects a command; the input handler does not observe that result. A distinct
preview-failure branch can emit `0x69` and retain mode without ordinary cleanup.

[Preview and key-loader checks](https://github.com/JohnDeved/populous-new-dawn/issues/1007#issuecomment-6788555536)
clarify two ownership boundaries. `004ba5d0` retires the object at `008922d8` through
`004ef180`, then clears only that pointer. Its producer is associated with descriptor
`0x11`, not the eight browser building types. The saved-key loader reads **DWORD**
classification entries at `005d66c8 + action * 4`; `0x77`, `0x78` and `0x7c` each
have value `0x4c`, protected from the tested removal/re-add branches. Rotation `0x7b`
has `0x6c` and is the unprotected control. These bounded checks do not execute the
entire loader or object retirement callback.

## Browser adapter and acceptance limits

`pointerUp` dispatches the real `placeBuilding` path with an optional retention flag.
Only a successful placement with no retention clears mode. Existing failure paths
already preserve it. Exact Shift/Ctrl/Alt combinations are rejected before placement,
without playing a failed-placement cue. Browser Meta behavior is unchanged.

`tests/building-placement-controls.test.mjs` uses the actual started World, placement
validator, allocator and worker code. Its DOM capture and terrain picks are supplied.
It covers consecutive plans, invalid overlap and dry land, rotation, changing Ctrl between press
and release, all modifier combinations, right-release cancel, interrupted input,
and a replacement-scene stale-release boundary. Ordinary and retained calls differ
only in mode under selection, no-worker and full-order-pool conditions. These tests
preserve existing browser worker/allocation policy rather than claiming it matches
the original command consumer.

Rendered ordinary-control evidence belongs on the draft PR and remains a separate
gate. No parity fixture or parity percentage is recorded by this work. The native
lookup proof, app regression proof, rendered browser behavior, original-game UI and
full native placement-consumer parity are distinct claims.
