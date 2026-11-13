# Patrol default-binding recovery (#1003)

Source-only continuation of 6f70961d, 2026-11-13. No gameplay edit or test execution.

## Evidence
- `scripts/check-native-deselection.py` blob `01c648ec68fbedecdc7c4acb3877f49c6e8bb6c3` reads original default records at 0x5d6574 and 0x5d6580 using `<BIBBBI` (12 bytes: scan, action, event, modifiers, gates, predicate). It constructs runtime records using `<IBBIBI` (15 bytes: action, event, modifiers, predicate, gates, next).
- `decomp/generated/00489470.c` blob `464b000e50442988836e0c61333b199140dbac82` walks per-scan linked records, checks event bits and modifiers plus eligibility and optional predicate before returning the action.
- `decomp/generated/004a9d90.c` blob `d54a0b4137ba36c8e1c63d2e4e9db0b4d19a2aa2` maps physical modifier scans into a three-bit mask, updates key arrays and invokes this lookup before process_cmd.
- `scripts/check-native-person-selection.py` labels its supplied action0xbd as Alt, but invokes process_cmd directly. That harness proves supplied-action behavior, not a physical Alt default binding.

## Next bounded recovery
Inspect identity-matched executable data around the known default records, recover table bounds from its initializer, and locate action0xbd/0xbe records and their predicates. Do not assume an arbitrary scan of packed data is a valid table. Confirm actual key-down/up path through lookup. Existing original record examples provide a concrete format and anchor, not the missing Alt records themselves.

The current command-state bridge remains valid; Ctrl+Alt binding, N scope and full route lifecycle are still open. No new parity acceptance claimed.
