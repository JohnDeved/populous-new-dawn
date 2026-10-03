# Native follower-class button visibility before unlock

Read-only evidence task on fetched `origin/main`
`5a0c8152e421b5082b97c0e235fb878f76fd0726`.

This note extends `decomp/research/followers-tab.md` and the retained issue #60
checkpoints. It does not repeat the descriptor/icon or selection audits. The verified
executable is:

`d3dpoptb.exe`
SHA-256 `3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f`.

## Result

The original follower-class controls are **not hidden until their training knowledge
is unlocked**.

For Brave, Warrior, Firewarrior, Preacher and Spy, the original class control is
present whenever the follower strip is constructed. With a live class total of zero
it is **visible but disabled and displays zero/no live count art**. It becomes enabled
when that class has a positive live total. Returning to zero disables it again; it
does not remove the control.

Training-building availability is a separate native state. No Warrior Hut, Temple,
Firewarrior Hut or Spy Hut availability bit participates in the traced follower
descriptor construction or the `004a1170` / `004a11e0` refresh decisions.

## Static class descriptors

The five persistent class descriptors are fixed 0x42-byte records in the original
HUD data:

| class | native model | descriptor | HFX | refresh | descriptor +0x41 |
| --- | ---: | ---: | ---: | ---: | ---: |
| Brave | 2 | `005cb255` | 666 | `004a1170` | 0 |
| Warrior | 3 | `005cb297` | 668 | `004a1170` | 0 |
| Firewarrior | 6 | `005cb2d9` | 670 | `004a1170` | 0 |
| Preacher | 4 | `005cb31b` | 672 | `004a1170` | 0 |
| Spy | 5 | `005cb35d` | 674 | `004a1170` | 0 |

The Firewarrior/Preacher mapping above uses the corrected issue #60 native model
order: model 6 / HFX 670 is Firewarrior; model 4 / HFX 672 is Preacher.

## Upstream control construction

The generic native control constructor at `0044c650` is upstream of the refresh
callback. It copies each static descriptor into a runtime control and copies the
descriptor callback at `+0x22` into the runtime callback field
(`0044c80c..0044c80f`).

Its child-descriptor loop advances by exactly 0x42 bytes
(`0044c88b: add esi,0x42`). Before creating a child it tests only descriptor byte
`+0x41` against generic display-mode bits:

- bit 0x02 is conditional on one display mode;
- bit 0x01 is conditional on the alternate display mode;
- bit 0x08 suppresses the child;
- otherwise `0044ca80` creates the runtime control.

All five class descriptors above have `+0x41 == 0`. Therefore none carries a
class-unlock construction gate. The constructor contains no read of the player
building-knowledge mask.

This trace reuses the previous issue #60 proof that these records own the original
class controls; it does not re-audit their artwork or interaction callbacks.

## Persistent strip refresh: 004a1170

`004a1170` reads the current player's live model total from the follower matrix
using the class model stored at runtime `control+0x63`.

For non-Shaman class controls it then:

1. writes `1` to `control+0x10`;
2. writes `1` to `control+0x08`;
3. if the live class total is zero or negative, overwrites only `control+0x08`
   with `0` and clears the displayed count word;
4. if the total is positive, leaves `+0x08 == 1` and copies the live display value.

The only hide branch in this function is the separate model-7 Shaman special case
when a tribe flag bit is set. It does not apply to models 2/3/4/5/6.

The renderer `004a0510` gives the fields their observable meaning:

- `control+0x10 == 0` returns without drawing the class control;
- `control+0x08 == 0` sets disabled rendering state;
- the live icon/count path is entered only when `control+0x08 != 0`.

So for every non-Shaman class, zero total means **present/visible, disabled, zero**,
not absent.

## Followers task-table refresh: 004a11e0

The dynamic Followers table uses the same rule. `004a11e0` derives the class
column from its packed cell index, reads the corresponding live matrix total, and
unconditionally sets `control+0x10 = 1`. It sets `control+0x08 = 1` only for a
positive total; otherwise it clears `+0x08` and the displayed count word.

Thus the persistent strip and the task/location table agree: a zero-count class
control remains present but disabled. This is a live-roster state, not a knowledge
state.

## Building knowledge is a separate native producer

The player's building-availability mask is at `0x96070e`. A bounded whole-executable
direct-reference scan found six explicit references: readers/setters at
`00408deb`, `00408e48`, `00408e71`, `0040ab80`, `00425129`, and the reward
producer at `004e4fff`.

`decomp/generated/00486160.c` shows `level_copy_4` copying the first 56-byte
player-things record from the level header into the runtime player state.
The generated browser importer exposes the same header building field through
`missionAllowsBuilding(..., model)`.

At `004e4ff6..004e5005`, reward type 2 shifts `1 << rewardModel` and ORs it into
`0x96070e`. That is the native knowledge transition for a training building.

None of those building-mask accesses is in the traced `0044c650` class-control
construction path, `004a1170`, or `004a11e0`.

## Exact shipped campaign transitions

The native building models are:

- Warrior Training Hut: 7
- Temple (Preacher training): 5
- Firewarrior Training Hut: 8
- Spy Training Hut: 6

The authored reward objects use reward type 2 with exactly those models. Each is
linked to a mode-4 Vault head:

| class/training knowledge | pre-unlock mission | Vault head | linked reward object | next mission header |
| --- | ---: | ---: | ---: | --- |
| Warrior / model 7 | Mission 1 | object 1 at (-5,-3) | object 2 | model-7 bit set in Mission 2 |
| Preacher / Temple model 5 | Mission 3 | object 91 at (-37,-133) | object 92 | model-5 bit set in Mission 4 |
| Firewarrior / model 8 | Mission 8 | object 59 at (-69,-23) | object 58 | model-8 bit set in Mission 9 |
| Spy / model 6 | Mission 12 | object 236 at (-43,-31) | object 237 | model-6 bit set in Mission 13 |

Before those Vault rewards, the corresponding class button is still constructed.
If its live class total is zero, `004a1170` makes it visible-disabled at zero.
Acquiring the Vault knowledge changes the building mask, but does not by itself
enable the class button; the button remains disabled until a live follower of that
class exists.

Header availability in the shipped levels is authored per mission rather than a
monotonic UI latch:

- Warrior Hut model 7: true in Missions 2–21, false in Mission 22, true in Mission 23.
- Temple model 5: true in Missions 4–21, false in Mission 22, true in Mission 23.
- Firewarrior Hut model 8: true in Missions 9–21, false in Mission 22, true in Mission 23.
- Spy Hut model 6: true in Missions 13–21, false in Mission 22, true in Mission 23.

Those Mission 22/23 header changes still do not alter the follower-control rule.

Braves have no specialist training-building unlock. Their model-2 descriptor follows
the same live-total refresh rule from the start.

## Count is not used as visibility evidence

Authored unit counts were inspected only as a discriminator between independent
states, not as proof of control visibility. For example, many missions have specialist
training knowledge in the header while starting with zero followers of that class.
The native constructor/refresh/renderer fields above are the visibility evidence.

Therefore the correct native distinction is:

- **absent/hidden:** not the specialist pre-unlock state;
- **present at zero:** yes;
- **disabled at zero:** yes;
- **enabled:** positive live class total;
- **training knowledge:** independent building-mask state.

## Limits

This is static/read-only native evidence. It does not change or prescribe the browser
Followers UI, HUD assets, page/CSS, selection runtime, world state, rewards, stock,
RNG, or save behavior. It does not reconstruct unrelated root-panel visibility or
re-run the prior descriptor/icon audit. The class-specific conclusion is bounded to
the already-identified original follower controls and their traced construction,
refresh and render paths.
