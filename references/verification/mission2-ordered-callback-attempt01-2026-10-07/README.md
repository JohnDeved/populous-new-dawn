# Mission2 ordered callbacks: retained failed attempt01

The one granted invocation at source `77839a91` failed and is retained in full.
Tool session24973 began at05:34:12.719 UTC and finished at05:34:16.107 UTC on
2026-10-07. The existing supervisor receipt covers05:34:13.800–05:34:15.244 UTC.
Its exit status is1. All61 recorded input hashes and source snapshots are stable.
Owned process groups6/26 are empty; CPU4 is released. No retry occurred.

Native calls1–4 returned at the exact EIP/ESP boundaries: pool pointer/index/list
bootstrap and class-seed reset. The pool partition check passed after call3.
Call5 entered real `0042b7f0`, then the declared native-write observer stopped at
`0042b7fe` on a4-byte write to `0089798d`. The Unicorn timeout flag is false. The
raw error, registers, pool image, list heads, zeroed seeds and argument state are
preserved before exit. Zero allocations occurred.

This is a source-bound write-range omission caught by the observer. It is not a
Mission2 startup success or2,011-call result. No record processing, linked-head
callbacks, roster/site/order initialization or class1 allocation history has
been observed. The failed immutable freeze remains intact. Any correction
requires its own source review and a separate execution grant.

`receipt.json` embeds original stdout/stderr and before/after source dictionaries;
`stdout.log`/`stderr.log` retain the exact raw streams separately. The launch
session, supervisor streams, owned cleanup and prior executable ACCEPT are also
retained. `result.json` gives the bounded partial finding. These files contain
no original executable, tool binary, profile or credential.
