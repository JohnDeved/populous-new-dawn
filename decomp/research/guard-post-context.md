# Guard Post source continuation (2026-11-13)

Issue #1010 remains open with zero comments. Search for open PR references to 1010 found none; guard-post phrase search returned broader existing work, not dedicated placement.

Verified original help topic1004: no wood; any follower; circle single post; Ctrl multi-post looping; N releases guard to queued next actions; own-only visibility; Shift+right-click removal. Topic995 links Guard Post as building-menu item21; topic1037 documents selected-follower context Guard command.

New source bridge at current main: decomp/generated/00437010.c traverses terrain cell unit chain and recognizes class10/model16, writes exact unit ID to DAT_00895e82, ORs context 0x801000. Do not implement it solely via generic rendered-model picker. This loop itself contains no owner filter: visibility/owner admission must be traced upstream, not inferred from this fragment.

00437750.c tests context bit0x1000 and selects command0x0b (11), subject to descriptor-selected-model eligibility and earlier command priorities. Existing command-rest-anchor research confirms command11 has packed-a coordinate semantics. This is not proof of allocation, terrain validation or patrol command lifetime.

Missing before gameplay implementation: native placement/removal producer, resource/terrain/capacity limits, owner-visible target production, exact order queue loop and N-release semantics, save lifecycle and current port integration. No code, original execution, tests or browser run. Retained Ghidra is pseudocode, not complete native execution evidence.

Sources:
https://github.com/JohnDeved/populous-new-dawn/issues/1010
https://github.com/JohnDeved/populous-new-dawn/blob/532cd9efb13acf0a36f2b9774c8892b18f918be6/decomp/generated/00437010.c
https://github.com/JohnDeved/populous-new-dawn/blob/532cd9efb13acf0a36f2b9774c8892b18f918be6/decomp/generated/00437750.c
https://github.com/JohnDeved/populous-new-dawn/blob/532cd9efb13acf0a36f2b9774c8892b18f918be6/decomp/research/command-rest-anchor.md

Local retained original-help JSON SHA256: 9dc78529ebceb14084e368626e81098fef66c5e3fe69b09bed0ac3fff42b6ad8
