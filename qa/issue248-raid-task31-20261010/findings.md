# Issue 248: ATTACK task+0x31 supplied-attribute contract

The two producer inputs are PopScript attributes 22 and 42. Successful native ATTACK allocation snapshots their nonzero values into task+0x31 bits 0 and 1, respectively, preserves the other six bits, and resets both input bytes to zero. The current port already represents these attributes but neither snapshots nor consumes them in ATTACK. Authored Mission 1, 2, 3 and 6 scripts do not reference either typed attribute field, so this omission alone has no demonstrated behavioral effect in those missions.

This finite static pass reuses the accepted 004e5fd0 disassembly and registry-matched exports at exact production commit `4754e12d3590bde18656416514871b033de164be`. The 116 bytes at 004e638b–004e63fe were independently compared with the canonical PE. `provenance.json` binds the 23 source inputs; `script-input-inventory.json` records the authored-data check. No native/model/test/browser execution, new disassembly, runtime edit or native initialization investigation occurred.

## Writer and consumption

Registered export 0048ef00 is the generic script SET / INCREMENT / DECREMENT writer, called by the existing 0048c6b0 / 0048c980 script controllers for tokens 1007 / 1008 / 1009. It reads a destination field from the program's eight-byte field table and obtains the right operand through 0048f350. For a type-2 destination whose internal number `n` is in 1000..1047, the byte address is:

`0x960402 + 48 * signedTribeIndex + n`

Consequently internal 1022 is byte `0x960800 + 48*tribe`, attribute index 22; internal 1042 is byte `0x960814 + 48*tribe`, attribute index 42. SET stores the operand's low byte; INCREMENT and DECREMENT perform byte addition/subtraction. 0048f350 reads these attributes as unsigned bytes. A raw script token 1022 used as an on/off argument is a separate token context and is not evidence of an attribute-22 reference.

The already accepted allocator establishes ESI = tribe + taskIndex*0x52, with task base at ESI+0x36. Its successful tail therefore accesses task+0x31 at ESI+0x67:

- 004e6398 tests attribute 22; 004e63a2 ORs bit 0 when nonzero, otherwise 004e63ab ANDs 0xfe. Both branches advance ESI to that byte.
- 004e63bc clears attribute 22.
- 004e63ce tests attribute 42; 004e63d8 ORs bit 1 when nonzero, otherwise 004e63dd ANDs 0xfd.
- 004e63ed, including the final byte at 004e63f4, clears attribute 42. The routine then returns success 1.

With supplied bytes A and B, the result is `(oldTask31 & 0xfc) | (A != 0 ? 1 : 0) | (B != 0 ? 2 : 0)`, followed by A=B=0. This is consumption on successful allocation, not persistent configuration. The earlier failure returns in the accepted full allocator do not traverse this tail. A failed request must not consume these two bytes. This statement concerns these tail writes, not unrelated mutations already documented in the allocator.

The accepted phase-3 controller uses bit 0 to conditionally OR person+0x14 mask 0x2000 after assigning taskIndex+1, and bit 1 to choose phase 7 instead of phase 4. Bit 0 clear leaves the person's existing 0x2000 bit unchanged. Neither task.flags nor the port's marker-valued task.mode is a proved alias of this byte. No other task+0x31 bits are characterized here.

## Authored input and port representation

The exact imported JSON contains no `[2,1022]` or `[2,1042]` field record in Mission 1 (`cpscr010.dat`), Mission 2 (`cpscr074.dat`), Mission 3 (`cpscr012.dat`), or any of the three Mission 6 tribe script entries (`cpscr014.dat` / `cpscr015.dat`). This proves these authored scripts cannot explicitly address either attribute through their generic assignment operands; it does not prove their native initial values.

`app/popscript.ts` already owns a 48-byte-valued attribute array: `scriptState` initializes it to zeros, type-2 reads select `attributes[n-1000]`, and generic writes mask to 255. `missionAI` in `app/campaign-runtime.ts` uses that state and explicitly sets attribute 43 to 12 before the turn-zero script. Fresh port construction therefore supplies zero for 22 and 42. This is source evidence about construction, not a claim that their actual values were recorded in the accepted turn-6485 cohort projection.

At `app/campaign-command-runtime.ts:415`, ATTACK passes quotas from 11/12/13/16/17/19, retreat percentage 28 and the spell list to `requestAttack`; it does not pass 22/42. `app/computer.ts:422` allocates a task without a task+0x31 projection and does not reset those attributes. The exact-commit literal search of app TypeScript/TSX has no `attributes[22]` or `attributes[42]` access. Dynamic generic reads/writes remain present and are explicitly outside that literal-search negative.

Native 00461d70's existing export is insufficient to establish initial values of the two global latch bytes: its visible clearing operates on the tribe's AI block and its explicit script-attribute write is attribute 43. Its small 004d1420 callee clears tribe-local offsets 0x52e/0x53a/0x532/0x536. This packet stops with the native pre-script attribute-bank initialization/load value unproved; it does not launch a search for that producer or default unknown saved values to zero. The supplied-attribute snapshot/consume contract itself has no unresolved callee.

## Integration consequence and retained limit

A request-level correction can represent these two known inputs without inventing a new attribute store, provided successful allocation is observable and unknown legacy task bytes remain distinct. On the bounded Mission 1–3/6 script inventory, such a patch by itself is a prerequisite rather than a demonstrated gameplay fix. It does not justify activating universal positive raid admission while the accepted Spy-5 / Shaman-7 phase16 release operations remain uncomposed. The withdrawn Warrior-only/model-only gate stays withdrawn.

The accepted complete turn-6485 cohort is still four registered people, models 3/3/4/3, with actual port assignment zero. The separately accepted record-205 inventory (`record205-retained-input-inventory.json`, SHA256 `fba87d7c85a921a6dbcdf7efd7092bf219555f56f7b7e7c00b12a32a18e67105`) found no earlier metadata in the 40 retained JSON/JSONL inputs or published projection. That is a first-dispatch historical continuity limit; it does not reopen the later proved command-19 / command-17 ordinary cleanup, or forbid supplied-case component corrections.

The established source contracts remain [the membership contract](https://github.com/JohnDeved/populous-new-dawn/blob/15470e43c06cebb5bc03db4707b449a6e69f9c1b/decomp/research/raid-phase16-target-persistence.md) and [the accepted specialist/Preacher boundaries](https://github.com/JohnDeved/populous-new-dawn/blob/54c5c5f08c5c2452921e4bc51efebfacd9660304/qa/issue248-membership-source-boundaries-20261010/README.md). The ten unchanged actual-caller red tests and both failed receipts retain their original meaning. No implementation-readiness or Mission 1–3 outcome claim is added here.
