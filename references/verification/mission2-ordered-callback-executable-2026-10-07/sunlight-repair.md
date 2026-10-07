# Exact generated sunlight table endpoint

Attempt02 at5d8b30c4 remains failed and published at ee3e4c37. Calls1–5 returned;
setup6 stopped before its final second-table byte. This correction is unexecuted.

The full existing sunlight closure is audited in `sunlight-store-audit.json`.
00401790 starts ESI=0; its first byte store004018ad covers0089bc8e..0089c08d.
It increments ESI before00401906, so the second table covers0089c08e..0089c48d.
The actual exclusive end is0089c48e. Only that final missing byte is added to
the declared native-write interval, with a guard requiring PC00401906, width1,
address0089c48d, ESI1024 and setup6/entry6 or setup9/entry9. The value remains the
native computation; no table value is supplied.

All other stores in the existing initializer were checked. Its seven explicit
local stores and sqrt586000 register saves use scratch. Default wrapper401040
writes scalar words/bytes937aa8..937ab0, clears762 DWORDs plus one WORD from
937c46 to938830 exclusive, and clears WORD96aa7c. The sunlight-array clear stops
exactly before938830 order storage. Wrapper401090 rewrites three scalar WORDs
then tail-jumps to the same real table producer. These ranges were already
admitted; no further range or native function is added.

Host-only boundary checks admit the new byte at both declared stages and reject
wrong PC, width, index, stage, entry and neighboring writes. All original
calls, closure bytes, input delivery, observations and30s+5s/25CPU/1GiB bounds
remain unchanged. Fresh attempt03 is declared. Both failures remain intact;
independent exact review and the parent's separate grant precede execution.
