# Mission 1 Red hut producer

## Finding

Mission 1 does not autonomously request another Red hut from its supplied initial
state. The initial completed Red model-3 hut contributes five housing slots through
native `004f6520`; the script's attribute-10 target is three. On Red producer turns
62, 126, and so on, `004e5580` therefore returns without allocating task type 0 or
advancing RNG.

This corrects the earlier implementation premise that the script's model-1 hut latch
proved a reachable first-hut producer. The existing browser test manually inserts a
hut plan and proves only that the script closes state bit 0 and clears attributes 9
and 10 after observing it.

## Conditional task-0 path

If housing is supplied below three, the same native producer requests model 1 at the
Red shaman cell `0x1c08`. Task `004c6da0` then:

- scans at most 2,000 `0049c890` spiral candidates, 40 per visit;
- uses fixed scan rotation 1 when attribute 30 is zero;
- advances RNG once for building orientation;
- inserts a plan only after world, building-validity, and route leaves accept a cell;
- selects exactly two nearest eligible model-2 people through `004f8490`; and
- emits command 6 with the accepted plan id and cell.

The first examined candidate is `0x1e0a`, not a proven accepted Mission 1 site. Site,
route, and insertion leaves were controlled to observe their order and arguments.
The existing browser `spiralCell`, building validity, selection, and command-6 paths
are the reusable primitives if a naturally reachable task-0 scenario is later found.

## Evidence and limits

Run:

```sh
.tools/decomp/oracle/bin/python scripts/check-native-mission1-red-hut.py /path/to/d3dpoptb.exe
```

The probe hash-checks the user-supplied executable, executes native `004f6520`, and
then executes `004e5580` with the Mission 1 housing/producer state. Only the model-
availability query is supplied; the housing count, gate, task allocation decision,
and RNG result execute natively. It does not prove a complete task-0 construction
run or an accepted terrain cell. Community names and Ghidra types remain hypotheses.

