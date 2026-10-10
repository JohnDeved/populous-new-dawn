# Swarm prerequisite: class-2 retirement source closure

Independent static review **ACCEPTS** the previously missing class-2 retirement
body and its immediate deferred-free chain. This extends the immutable
[original lifecycle mapping][mapping] at `7b3f4b775`; the port assessment base
remains main `f9675f56c597ec83adf02f28e9801bfc6bbd0490`. No runtime behavior
changes and no Swarm building encounter is claimed.

Review SHA256:
`31799b405e47dae32310970d0d878c4197c1b2a620e9b533f7e61adaff278e65`.
Original accepted findings SHA256:
`61e603fe1ffeb83107b5f70c0cb7afa01b0c32b0f4ed5d35e5eb2a1f3037bbdc`.
The [manifest](manifest.json) retains exact commands, source/input/tool/output
hashes, interpreted boundaries and the original receipt hashes.

## Recovered operations

| Boundary | Accepted source result |
| --- | --- |
| [Class-2 removal](00403820-00403860.asm) | `00403820` optionally performs existing building cleanup/stat notification, then both paths call `004edcf0` at `0040384c`. Skipping cleanup does not skip retirement. Return: `00403855`. |
| [Immediate primary retirement](004edcf0-004ede10.asm) | `004edcf0` conditionally splices actual XY cell membership and clears `0x20000`; writes class zero/deleted; removes the allocation-list entry; prepends it to pending-free; sets byte counter 3. It retains the physical ID and does not immediately return the slot to a free list. Returns: `004eddf8` and `004ede07`. |
| [Pending-free consumer](004ec6f0-004ecac0.asm) | The selected block `004ec94c–004ec98b` saves next, decrements the byte counter and, only on zero, clears deleted, calls `00401b40` and decrements allocation counts. This is a pending-free opportunity, not a walltime promise. |
| [Exact recycle helper](00401b40-00401b9a.asm) | `00401b40` removes pending membership and prepends to the free pool selected by unsigned physical ID `<0x280` versus `>=0x280`. It preserves the ID and returns at `00401b99`. |

All direct branches in the three complete bodies remain inside their interpreted
boundaries. The reviewer independently matched every displayed assembly byte to
the canonical PE sections and recomputed direct branch/call offsets. Padding,
the consumer's switch-table data after `004eca6b`, and unrelated neighboring
routines are not interpreted as continuation code. The caller block does not
establish complete scheduler behavior.

Retirement earlier in a processing visit can reach the pending-free loop in that
same visit. Counter 3 therefore means three countdown opportunities, not three
extra turns. Each eligible recycle prepends to its selected pool; for multiple
ready records, this reverses their traversal order within that pool. This is not
a universal FIFO rule. Existing allocation and list-reconstruction owners still
determine the surrounding history. The removal helper assumes consistent live
links and does not add a general double-retirement guard.

## Consequences and ordered remaining prerequisites

Swarm immediately loses a retired building from acquisition's cell chain, and
later pursuit rejects its class-zero/deleted record. Neither operation clears
Swarm's target/history IDs. Genuine slot reuse can later resolve that same raw ID
to another live class; the accepted pursuit predicate does not add a generation
or class-2 check.

1. **Bind authored bootstrap next.** Allocation `004ed8a0`, fixed index setup
   `004ed880`, building insertion `00403610`, relocation `00403d50/004ee580`,
   and the retirement chain above have retained bodies. `00484a10` shows authored
   allocation followed by trigger/Vault postprocessing and calls
   `load_level_init_units`; that final call's concrete body and effects on
   membership/order are still unbound here. The smallest next finite source pass
   is to bind this tail, then correspond it to `world-initialization.ts`'s
   ordinary-building and neutral-Vault creation. No missing-asset assertion or
   arbitrary array ordering follows from the unresolved symbol.
2. **Represent actual port lifetimes.** Native plan allocation (`004b8470`) and
   Hut upgrade (`004050c0`) already prove distinct class-2 creation/replacement.
   The port still needs separate building-lifetime identity versus its class-9
   plan/ten-bit terrain handle, and a neutral Vault body identity distinct from
   the shrine/trigger. Current position, membership links, liveness and pending
   reuse ownership must be attached to those real events. A class-2 projection
   alone cannot reproduce cross-class raw-ID reuse or establish shared allocator
   slot choices; the allocator body exists, but the current port stream is absent.
3. **Bind restoration explicitly.** `004ee300`'s list-reconstruction body is
   retained; its exact startup/Load invocation and native save reconstruction
   order are not established by this packet. The browser store already clones
   the typed World, but an owner claiming continuation must preserve ID lookup,
   membership/order, pending counters/list order, free-pool order and Swarm's
   target/history fields. Legacy saves lack that owner/history. Rebuilding from
   present arrays or adding generation-based rejection would invent semantics.

These are source/ownership prerequisites, not authorization for an allocator
rewrite or runtime implementation. The earlier accepted queue-preserving
occupant-ejection mapping remains unchanged.

## Verification and limits

The current executable was verified before and after decoding at SHA256
`3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f`, 2,275,840
bytes. Existing GNU objdump 2.44 matched SHA256
`96afb8521834982d0e711b5d6e9785252bf82129fb0106b93a6bd54d83fae11f`.
All five short data-only decoder invocations exited 0 on CPU 4 with empty stderr.
The initial wider helper output remains bound by hash locally; the exact helper
is published here without its unrelated neighbors. No failed decoder attempt
is hidden.

The four assembly files are unchanged accepted outputs. No original code,
native probe, game, browser, installer, extractor or bootstrap was executed.
No runtime test was needed or run for this source-only publication. Original
execution equivalence, native save-file format, full allocation history,
walltime cadence and gameplay parity remain unproved. No executable, binary
archive, game asset, profile or credential is published; issue #61 stays open.

[mapping]: https://github.com/JohnDeved/populous-new-dawn/blob/7b3f4b775e4b7b7ca162c3ba98f33ea664a064fb/decomp/research/swarm-class2-lifecycle-ownership.md
