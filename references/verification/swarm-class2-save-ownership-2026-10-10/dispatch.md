# Swarm prerequisite: ordinary Save/Load dispatch ownership

The ordinary command route is now numerically bound: `004aab80`, command
`0x9c`, submode 2 calls `00427730`; submode 3 calls `00427220`. Neither callee
has a selected body in this checkout or its export manifest. This pass stops at
that availability result. It proves no serialized unit fields, reconstruction
order, or original save-file compatibility.

Assessment base remains `f9675f56c597ec83adf02f28e9801bfc6bbd0490`; the research
head is `4037f8ba17eafb34b3cebdcbab5105fabbbba332`. The canonical EXE and GNU
objdump hashes are unchanged. The accepted proposal limits this pass to two
dispatcher windows, 896 decoded bytes in total, and four selected table entries.
No callee body was decoded and no original code was executed.

## Exact dispatch selection

The aligned entry slice reads the first stack argument into `ebx` at `004aab9a`,
then computes `edx = command - 0x0d`. The unsigned bound is `0xc1`. For `0x9c`,
the selector is `0x8f`; the byte at `004ad740 + 0x8f = 004ad7cf` is `0x43`.
The dword at `004ad5c4 + 4*0x43 = 004ad6d0` is `004ab6e2`. Both reads are
backed by the canonical PE `.text` section, with exact file offsets and bytes
retained in `dispatch-table.json`.

At `004ab6e2`, the zero-extended byte `0089ce5a` is decremented and compared
unsigned with 3. Modes 1 through 4 select a table at `004ad804`; all other
values branch directly to `004ab886`. The two relevant entries are:

| Mode | Table entry | Exact target |
| --- | --- | --- |
| 2 | `004ad808`, bytes `6d b7 4a 00` | `004ab76d` |
| 3 | `004ad80c`, bytes `07 b8 4a 00` | `004ab807` |

No other selector or table entry was read. There is no preceding pause, game
phase, unit-class or ownership guard on these selected paths in the inspected
dispatcher entry and command block. This does not establish which upstream UI
states emit this command.

## Selected calls and local aftermath

Both modes zero-extend byte `0089ce5b`. Value 1 selects argument 10; value 0 or
any other byte selects argument 9. Each pushes that single argument, calls its
target, and removes four stack bytes.

| Mode | Callsite and target | Retained pseudocode correspondence |
| --- | --- | --- |
| 2 | `004ab791 → 00427730` | `load_savegame(uVar16)` |
| 3 | `004ab82b → 00427220` | `write_savegame_2(uVar16)` |

For mode 2, zero return selects the failure-message inputs. A nonzero return
clears bit `0x04000000` in dword `0089c665`. Return 2 passes 10 to `00442a60`
at `004ab7b2`; any other nonzero return passes 2. Then `004ab7ba` calls
`004194f0`, and the success-message inputs are selected. The retained
dispatcher names the first of these operations `set_interface_state_2_3`.
Neither callback's transitive reconstruction effects are proved here.

For mode 3, zero versus nonzero return selects failure versus success message
inputs. Both modes format a local message through `0055b5c0`, then call
`0047aa20` with the local message, `0x10`, `-1`, and 0. Their normal local paths
converge at `004ab886`, which clears bit `0x80000000` in dword `0089c661`, then
jumps at `004ab890` to `004abbe2` outside the selected block. This is a bound
branch endpoint, not the complete dispatcher return or a successful Save/Load
execution claim.

The prefix cap ends at `004aac80` inside an unrelated instruction; no complete
prefix-region body is claimed. The 640-byte command window ends at `004ab962`
after a branch in a later unrelated command. Bytes after the selected rejoin
and other submode bodies are preserved as decoder output but are not used to
claim their behavior. The selected mode-2/3 paths and their rejoin are fully
within the window.

## Body availability and correction of prior attribution

`decomp/generated/00427730.c`, `00427220.c`, and `004f0bd0.c` are absent, and
all three are absent from `decomp/exports.json`. A filename-only search for
these numeric entries in permitted local research files found no additional
retained body. The availability receipt records the exact search and selected
manifest hash. This does not mean the canonical bytes are inaccessible; it
means the persistence bodies have not been supplied by this selected source set
or decoded in this pass.

The accepted retirement bytes already prove `004ec9fa → 004f0bd0`, and retained
`004ec6f0.c` names that scheduler call `write_save()`. That valid numeric edge
stands. The later view-child report's phrase “using retained `004f0bd0`”
overstated body availability. No serialized-field contract or connection from
that scheduler callee to ordinary user Save was established. The earlier
bootstrap report named it as a next investigation entry, not an available
writer body. Historical packet bytes remain immutable; this successor supplies
the correction.

The existing campaign-progression note separately names `00427220` as a disk
serialization owner, while proving only its `004860c0` campaign-memory snapshot.
The new dispatcher call agrees with that prior name but does not turn that note
into a complete writer contract. Recorded-demo raw loading also remains a
separate route; its large memory-block read cannot substitute for either
ordinary user entry.

## Finite next ownership question

The concrete next source choice is between the now-bound writer `00427220`
and reader `00427730`, after checking a bounded body extent and selecting one
with independent scope review. The required outcome is which physical IDs,
allocation/lifetime state and cell/list membership survive or are rebuilt for
resumed Swarm behavior. No leaf is selected or followed in this packet.

A modern checkpoint may preserve a source-proved state in modern fields.
Original binary-save compatibility is not promised, and a missing identity
history in an older browser checkpoint cannot be fabricated from current array
order. The remaining fresh-level allocation composition, inactive/retired
aliases and current port identity representation remain separate prerequisites.
