# Spell dispatch boundary (#1008)

Read-only continuation, 13 November 2026. No implementation or tests.

At main 532cd9ef, generated/00479cf0.c is absent. Code search finds emitter callsites, not its body. This does not prove binary absence.

Existing check-native-command-target.py, check-native-drag-selection.py, check-native-person-selection.py and check-native-hud-selection.py intercept 0x479cf0, capture stack arguments and return without executing that function. Their supplied native cases therefore do not establish emitter-to-consumer record layout or dispatch. Do not use these tests to close the linkage gate from 20be426a.

Retained generated/004b3920.c (blob637593d000118653c0f3690a84e485acc733235b) provides a separate recorded-data consumer path: reads a chunk, verifies a value against FUN_004439d0, then calls process_tribe_cmd(player_tribe_num*0xc65+0x89d1c8, local_14). This demonstrates playback consumption, not the live right-click emitter link. Decompiler unreachable-block warnings and inferred local layout remain limits.

Next evidence: retained machine-code body of 00479cf0 and its live queue consumer/record shape, plus exact helper/index argument confirmation. No speculative gameplay patch.
