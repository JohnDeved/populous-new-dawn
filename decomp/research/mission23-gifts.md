# Mission 23 triggers 303 and 305

## Question and prior evidence

Resolve Mission 23 trigger 303's apparent class-6/model-53 gift and trigger 305's
ordered class-5/model-9 plus class-6/model-6 links: consumer, outcome, recipient,
timing, retirement/replay, and checkpoint-relevant state. This reuses the controller
and delayed-reward proof in `decomp/research/mission22-rewards.md` and the linked-slot
ordering proof in `decomp/research/mission20-linked-chain.md`. No Ghidra project was
opened.

## Provenance

- Base/observed HEAD: `a586b6c6a135cf564e80aed2a3e6b05f20487ad7`.
- Executable: `work/orchestration/ceo-release/native-run/d3dpoptb.exe`, SHA-256
  `3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f`.
- Mission 23 DAT: `levl2023.dat`
  `12f4a91df64f18cdc154d9d0e39780d52d2e4e1e4efd708fd7a35dd9c3b344dc`;
  HDR: `levl2023.hdr`
  `d141635a840bb16a4b5e41beec064fd154aead055bbe663710dbcfe417574976`.
- Scripts: `cpscr023.dat`
  `948357f83023f426cbd64e209d0e25753a240a219d53cd9493186dd23a71a943`;
  `cpscr024.dat`
  `55acfcbf2ea4d3d2a73693c49ffc29774c63575f2639dd1b8920b569fd0c22c1`;
  `cpscr018.dat`
  `e45e2508c10e5e30af1e8a4847a5c25bfbd60b4780c7b7c75f9bf1b7a0491a7e`.
- Language: `language/lang00.dat`
  `e826c478746d666a3ea9ea36cb7804d1d226d5f83084230987b1de293066cf7d`.
- Runtime: `.tools/decomp/oracle/bin/python` 3.9.6, Unicorn 2.1.4,
  Capstone 5.0.7 (identity retained in `probe-result.json`).

## Authored topology

DAT indices are zero-based; link words are one-based.

| head/source | authored identity and position | exact role |
| --- | --- | --- |
| 303 | class 6/model 6, Blue, `(15616,-22272,256)` | mode 0 worship head, required work 100, remaining-use byte 0, repeat delay 1; slot 0 -> object 304 |
| 304 | class 6/model 2, neutral, `(16128,-22272,13574)` | delayed-reward wrapper `[reward class 6, tag 53, grant mode 3, flag 1]`, amount dword **0** |
| 305 | class 6/model 6, Blue, `(17152,-28416,256)` | mode 0 worship head, required work 192, remaining-use byte 1; slot 0 -> object 306, slot 1 -> object 303 |
| 306 | class 5/model 9, neutral, `(15616,-22272,0)` | stone scenery paired with the cloned head 303, not a stock/mana/spell payload |

The complete 307-object scan found exactly one incoming head link to each relevant
source: `305:slot1 -> 303`, `303:slot0 -> 304`, and `305:slot0 -> 306`.
Object 228 is a second authored class-5/model-9 stone at the same position as
303/306; it is the earlier stone presentation at this reused reward location.

## Native observations

### Trigger 305: one-shot transition to the next head

Both heads are mode 0, so the mode-3 51-qualifying-visit delay proved for Mission 22
does **not** apply. On trigger 305's qualifying completion call, native `004fb270`
immediately performs this order:

1. allocate/copy/first-process neutral class 5/model 9 from object 306;
2. allocate/copy/first-process Blue class 6/model 6 from object 303;
3. reset accumulated work;
4. because the remaining-use byte is `1`, change it to `0` and retire unshared
   sources in slot order, then the head: one-based identities `[307, 304, 306]`
   (DAT objects 306, 303, then head 305).

The cloned head retains its slot-0 link to one-based 305 / DAT object 304, its
required-work value 100, remaining byte 0, and repeat delay 1. Object 304 is not a
direct link of 305 and is not retired by 305. Thus 305 is an authored one-shot chain
transition: it creates the replacement stone first and the next worship head second.
It has no recipient and makes no direct mana/spell/stock grant.

### Trigger 303: repeatable delayed zero-mana lifecycle

On a qualifying trigger-303 call, `004fb270` immediately allocates/copies/
first-processes a neutral class-6/model-2 reward wrapper from object 304. The source
and head are **not** deleted: authored remaining byte `0` means repeatable, not
one-shot. Native resets work to 0, sets its repeat/cooldown field to 1, preserves
required work 100 and the source link, and leaves the trigger available after that
short controller reset. RNG stayed `0x12345678` in the forced qualifying case.

`00485b00` maps object 304's bytes to wrapper fields: reward class `6`, metadata tag
`53`, grant mode `3`, and independent amount dword `0`. As proved for Mission 22,
`004facf0`'s class-6 branch ignores tag 53 as a model and passes the amount dword to
`0041a500`. It therefore does not allocate class-6/model-53.

On the wrapper's first eligible processing visit, `004facf0` selects the first
eligible class-1 person in the gift's cell (real tribe, not flag `0x800`, native
eligibility predicate `004f62c0(person,29)`), stores that person's tribe at `+0x7e`,
sets timer `+0x7a = 82`, and phase `+0x7f = 1`. Supplied Blue and tribe-2 cases
selected recipients 0 and 2 respectively while clone ownership remained neutral.
If no eligible person is present, the timer remains zero and the wrapper polls; there
is no fallback recipient.

On the 82nd countdown processing visit, `004facf0` calls `0041a500(recipient, 0)`,
clears the presentation word that `0041a500` sets, and retires the temporary wrapper.
Pending mana remained 123, an unrelated sentinel remained `0x7777`, and RNG remained
`0x12345678`. The durable gameplay outcome is therefore **zero mana and no spell,
stock, availability, vehicle, person, or campaign-state change**. Only the transient
gift/presentation lifecycle occurs; exact presentation/audio was intercepted.

This contradicts an implementation acceptance condition that treats trigger 303 as
one-shot. Native 305 is one-shot; native 303 is repeatable and materially grants
nothing on each completion.

## Checkpoint-relevant state

- Before 305 completion: original head 305 and linked templates 306/303 exist; 303
  retains its link to reward source 304.
- After 305 completion: originals 306, 303, and head 305 are absent; the new neutral
  model-9 scenery and new Blue head clone exist in authored slot order; reward source
  304 remains and the new head points to it. These identities are 305's replay latch.
- During a 303 reward: head 303 and source 304 remain, plus a neutral model-2 wrapper
  carrying reward class/tag/mode/amount, selected recipient, timer, and phase. A
  checkpoint must preserve that wrapper to resume the 82-visit countdown without
  duplicating it.
- After its wrapper retires: head/source still exist with work 0, repeat delay/cooldown
  1, remaining byte 0. Absence cannot serve as a completion latch for 303 because it
  can run again.

Native evidence defines the state that a checkpoint must retain; this probe did not
execute browser or native save/load serialization.

## Probe and evidence boundary

Command:

```sh
.tools/decomp/oracle/bin/python \
  scripts/check-native-mission23.py \
  work/orchestration/ceo-release/native-run/d3dpoptb.exe
```

Result: `PASS: Mission 23 triggers 303/305 verified`.

Original bodies executed: `00485b00`, `004fb270`, and `004facf0`, including the
byte-proved `0041a500` zero-amount consumer. The probe supplies allocation storage
(`004ed8a0`), template copying (`004ede10`), deletion bookkeeping (`004ef180`), the
complete-scan unshared result (`004fc290`), person cell membership/eligibility
(`004f62c0`), and presentation/audio leaves (`004fbd20`, `0048a050`, `00481550`).
It records, rather than executes, each `004ed700` first-process call. Reviewed exports
`004ed700`, `004a6480`, and Mission 22's model-9 proof establish that link 306 routes
to the ordinary scenery controller; exact morph/animation and audio remain outside
this assignment. The qualifying worship predicate was forced; natural follower
arrival/cadence, browser integration, and checkpoint serialization were not run.
