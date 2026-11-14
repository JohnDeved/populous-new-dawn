| Record | Input | Event | Action | Predicate / callback | Gate | Handler case | Pseudocode excerpt (inferred) |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 005d5de8 | Up (any modifiers) | continuous | 0x01 | callback 004ae200 | 1 | continuous callback (00489520) | - |
| 005d5df4 | Numpad 8 (any modifiers) | continuous | 0x01 | callback 004ae200 | 1 | continuous callback (00489520) | - |
| 005d5e00 | Down (any modifiers) | continuous | 0x02 | callback 004ae200 | 1 | continuous callback (00489520) | - |
| 005d5e0c | Numpad 2 (any modifiers) | continuous | 0x02 | callback 004ae200 | 1 | continuous callback (00489520) | - |
| 005d5e18 | Delete (any modifiers) | continuous | 0x03 | callback 004ae200 | 1 | continuous callback (00489520) | - |
| 005d5e24 | Numpad 4 (any modifiers) | continuous | 0xc7 | callback 004ae200 | 1 | continuous callback (00489520) | - |
| 005d5e30 | Page Down (any modifiers) | continuous | 0x04 | callback 004ae200 | 1 | continuous callback (00489520) | - |
| 005d5e3c | Numpad 6 (any modifiers) | continuous | 0xc8 | callback 004ae200 | 1 | continuous callback (00489520) | - |
| 005d5e48 | Left (any modifiers) | continuous | 0x05 | callback 004ae200 | 1 | continuous callback (00489520) | - |
| 005d5e54 | Numpad 7 (any modifiers) | continuous | 0xc9 | callback 004ae200 | 1 | continuous callback (00489520) | - |
| 005d5e60 | Right (any modifiers) | continuous | 0x06 | callback 004ae200 | 1 | continuous callback (00489520) | - |
| 005d5e6c | Numpad 9 (any modifiers) | continuous | 0xca | callback 004ae200 | 1 | continuous callback (00489520) | - |
| 005d5e78 | Home | press | 0xaa | 004ff3e0 | 1 | 004ab8ed (shared) | uVar22 = CONCAT22(uVar19,DAT_0098e908) & 0xffff0020; FUN_00479ef0(param_1,CONCAT31((int3)(uVar22 >> 8),(sho... |
| 005d5e84 | End | press | 0xab | 004ff3e0 | 1 | 004ab8ed (shared) | uVar22 = CONCAT22(uVar19,DAT_0098e908) & 0xffff0020; FUN_00479ef0(param_1,CONCAT31((int3)(uVar22 >> 8),(sho... |
| 005d5e90 | P | press | 0x0f | - | 0 | 004aabfe | if ((DAT_0089c6e7 != '\x04') && (iVar15 = FUN_00451370(2), iVar15 == 0)) { if ((land_flags_1 & 8) == 0) { F... |
| 005d5e9c | T | press | 0x10 | - | 2 | 004aac4f | if ((DAT_0089c6e7 != '\x04') && (iVar15 = FUN_00451370(2), iVar15 == 0)) { set_tribe_command(player_tribe_n... |
| 005d5ea8 | Enter | press | 0xb0 | 004ff530 | 0 | 004ab959 | if ((DAT_0089bb81 == '\x02') \|\| (DAT_0089bb81 == '\x03')) { DAT_0089bb81 = '\0'; DAT_0089bb83 = '\x01'; |
| 005d5eb4 | Mouse left | press | 0xba | 004ff0e0 | 1 | 004abae9 | iVar15 = FUN_00451370(2); if (iVar15 == 0) { FUN_0045db60(1); |
| 005d5ec0 | Mouse right | release | 0xb9 | 004ff0e0 | 1 | 004aba98 | iVar15 = FUN_00451370(2); if (iVar15 == 0) { FUN_0047a550(CONCAT22(player_tribe_num >> 7,(short)DAT_0089c6ea), |
| 005d5ecc | Escape | press | 0xb9 | 004ff0e0 | 1 | 004aba98 | iVar15 = FUN_00451370(2); if (iVar15 == 0) { FUN_0047a550(CONCAT22(player_tribe_num >> 7,(short)DAT_0089c6ea), |
| 005d5ed8 | Enter | press | 0x46 | 004ff550 | 1 | 004ab137 | FUN_00486b60(); |
| 005d5ee4 | Escape | press | 0x46 | 004ff550 | 1 | 004ab137 | FUN_00486b60(); |
| 005d5ef0 | Tab | press | 0x4f | - | 0 | 004ab289 | DAT_0098e908 = DAT_0098e908 \| 2; |
| 005d5efc | Tab (any modifiers) | release | 0x50 | - | 0 | 004ab295 | DAT_0098e908 = DAT_0098e908 & 0xfffd; |
| 005d5f08 | F11 | press | 0x51 | 004ff420 | 0 | 004ab2a3 | if ((land_flags_1 & 0x8000) == 0) { DAT_0098e908 = DAT_0098e908 & 0xfffd; FUN_004aee40(4,5); |
| 005d5f14 | F1 | press | 0x52 | 004ff420 | 2 | 004ab34d | if ((land_flags_1 & 8) == 0) { set_tribe_command(CONCAT31(uVar18,player_tribe_num),0x31,0,10000); } |
| 005d5f20 | F2 | press | 0x54 | 004ff420 | 2 | 004ab39c | if ((land_flags_1 & 8) == 0) { set_tribe_command(CONCAT31(uVar18,player_tribe_num),0x41,0,0); } |
| 005d5f2c | F3 | press | 0x55 | 004ff420 | 2 | 004ab3c2 | if ((land_flags_1 & 8) == 0) { set_tribe_command(CONCAT31(uVar18,player_tribe_num),0x44,0,0); } |
| 005d5f38 | F4 | press | 0x56 | 004ff420 | 2 | 004ab3e8 | if ((land_flags_1 & 8) == 0) { set_tribe_command(CONCAT31(uVar18,player_tribe_num),0x45,0,0); } |
| 005d5f44 | F5 | press | 0x53 | 004ff420 | 2 | 004ab376 | if ((land_flags_1 & 8) == 0) { set_tribe_command(CONCAT31(uVar18,player_tribe_num),0x76,0,0); } |
| 005d5f50 | F10 | press | 0x13 | 004ff400 | 3 | 004aaca5 | FUN_00479f00(8,0,0); |
| 005d5f5c | F12 | press | 0x14 | - | 3 | 004aacb8 | if ((land_flags_1 & 8) == 0) { set_tribe_command(CONCAT31(uVar18,player_tribe_num),0x17,1,1); } |
| 005d5f68 | Enter | press | 0x15 | - | 1 | 004aacde | if (DAT_0059ce08 == 0) { if ((game_state._838239_1_ & 1) == 0) { FUN_0041fad0(); |
| 005d5f74 | Shift+Enter | press | 0xc5 | - | 1 | 004abb83 | if (DAT_0059ce08 == 0) { if ((game_state._838239_1_ & 1) == 0) { FUN_0041fad0(); |
| 005d5f80 | Ctrl+Enter | press | 0xc5 | - | 1 | 004abb83 | if (DAT_0059ce08 == 0) { if ((game_state._838239_1_ & 1) == 0) { FUN_0041fad0(); |
| 005d5f8c | F1 | press | 0x16 | - | 1 | 004aad12 | FUN_0045db60(0); |
| 005d5f98 | Ctrl+F1 | press | 0x17 | - | 3 | 004aad21 | FUN_00486b60(); |
| 005d5fa4 | F2 | press | 0x1b | - | 3 | 004abbe2 (no-op) | - |
| 005d5fb0 | F3 | press | 0x1c | - | 3 | 004abbe2 (no-op) | - |
| 005d5fbc | F4 | press | 0x1a | - | 3 | 004ad5b9 (no-op) | - |
| 005d5fc8 | F5 | press | 0x19 | - | 3 | 004abbe2 (no-op) | - |
| 005d5fd4 | Shift+F1 | press | 0x1d | - | 3 | 004abbe2 (no-op) | - |
| 005d5fe0 | ] | press | 0x2c | - | 3 | 004abbe2 (no-op) | - |
| 005d5fec | [ | press | 0x2d | - | 3 | 004abbe2 (no-op) | - |
| 005d5ff8 | Ctrl+F6 | press | 0x36 | - | 3 | 004aaec9 | z_pos_camera = z_pos_camera + 200; if (0x6e00 < z_pos_camera) { z_pos_camera = 0x6e00; |
| 005d6004 | Ctrl+F7 | press | 0x37 | - | 3 | 004aaeee | z_pos_camera = z_pos_camera + -200; if (z_pos_camera < -0x6e00) { z_pos_camera = -0x6e00; |
| 005d6010 | Shift+F6 | press | 0x38 | - | 3 | 004aaf13 | maybe_fog = maybe_fog + '\x01'; |
| 005d601c | Shift+F7 | press | 0x39 | - | 3 | 004aaf1e | maybe_fog = maybe_fog + -1; |
| 005d6028 | Ctrl+F6 | press | 0x3a | - | 3 | 004aaf29 (shadowed by 005d5ff8) | DAT_0089ce49 = DAT_0089ce49 + 200; if (0x6e00 < DAT_0089ce49) { DAT_0089ce49 = 0x6e00; |
| 005d6034 | Ctrl+F7 | press | 0x3b | - | 3 | 004aaf4e (shadowed by 005d6004) | DAT_0089ce49 = DAT_0089ce49 + -200; if (DAT_0089ce49 < -0x6e00) { DAT_0089ce49 = -0x6e00; |
| 005d6040 | Shift+Ctrl+F6 | press | 0x3c | - | 3 | 004aaf73 | DAT_0089ce42 = DAT_0089ce42 + '\x01'; |
| 005d604c | Shift+Ctrl+F7 | press | 0x3d | - | 3 | 004aaf7e | DAT_0089ce42 = DAT_0089ce42 + -1; |
| 005d6058 | - | press | 0x2b | - | 0 | 004abcdc (shared) | if ((game_state._838239_1_ & 1) == 0) { FUN_00479f00(0xf,0,(-(uint)(param_1 == 0x2a) & 2) - 1); |
| 005d6064 | + | press | 0x2a | - | 0 | 004abcdc (shared) | if ((game_state._838239_1_ & 1) == 0) { FUN_00479f00(0xf,0,(-(uint)(param_1 == 0x2a) & 2) - 1); |
| 005d6070 | Shift+- | press | 0x3e | - | 0 | 004aaf89 | if (((load_level_flags & 0x4000000) == 0) && (((land_flags_1 & 8) == 0 \|\| ((land_flags_1 & 0x8000) != 0))... |
| 005d607c | Shift++ | press | 0x3f | - | 0 | 004aafc5 | if (((load_level_flags & 0x4000000) == 0) && (((land_flags_1 & 8) == 0 \|\| ((land_flags_1 & 0x8000) != 0))... |
| 005d6088 | F8 | press | 0x40 | - | 0 | 004ab001 | if (((load_level_flags & 0x4000000) == 0) \|\| ((land_flags_1 & 0x8000) != 0)) { if ((land_flags_1 & 8) == ... |
| 005d6094 | Shift+F8 | press | 0x41 | - | 0 | 004ab04a | if (((load_level_flags & 0x4000000) == 0) \|\| ((land_flags_1 & 0x8000) != 0)) { if ((land_flags_1 & 8) == ... |
| 005d60a0 | F9 | press | 0x42 | - | 0 | 004ab093 | if (((load_level_flags & 0x4000000) == 0) \|\| ((land_flags_1 & 0x8000) != 0)) { if ((land_flags_1 & 8) == ... |
| 005d60ac | Shift+F9 | press | 0x43 | - | 0 | 004ab0dc | if ((((load_level_flags & 0x4000000) == 0) \|\| ((land_flags_1 & 0x8000) != 0)) && ((land_flags_1 & 8) == 0... |
| 005d60b8 | Shift+Ctrl+F8 | press | 0x44 | - | 2 | 004ab112 | if ((land_flags_1 & 8) != 0) { set_tribe_command(CONCAT31(uVar18,player_tribe_num),0x14,iVar23,0); } |
| 005d60c4 | Escape | press | 0x9b | 004fee70 | 1 | 004ab61a | if (DAT_0059ce08 == 0) { if ((land_flags_1 & 8) == 0) { FUN_00418810(); |
| 005d60d0 | Enter | press | 0x9c | 004ff450 | 1 | 004ab6e2 (shadowed by 005d5f68) | switch(DAT_0089ce5a) { |
| 005d60dc | Numpad Enter | press | 0x9c | 004ff450 | 1 | 004ab6e2 | switch(DAT_0089ce5a) { |
| 005d60e8 | Y | press | 0x9c | 004ff450 | 1 | 004ab6e2 | switch(DAT_0089ce5a) { |
| 005d60f4 | N | press | 0x9d | 004ff450 | 1 | 004ab895 | DAT_005fcb14 = 2; land_flags_1 = land_flags_1 & 0x7fffffff; |
| 005d6100 | Escape | press | 0x9d | 004ff450 | 1 | 004ab895 | DAT_005fcb14 = 2; land_flags_1 = land_flags_1 & 0x7fffffff; |
| 005d610c | O | press | 0x47 | - | 2 | 004ab141 | DAT_0098e908 = DAT_0098e908 \| 1; |
| 005d6118 | O (any modifiers) | release | 0x48 | 004ff3d0 | 2 | 004ab14d | DAT_0098e908 = DAT_0098e908 & 0xfffe; |
| 005d6124 | Up | press | 0x4a | 004ff3d0 | 2 | 004ab19e | DAT_00895d9a = DAT_00895d9a + -1; if (DAT_00895d9a < 0) { DAT_00895d9a = DAT_00895d9e + -1; |
| 005d6130 | Down | press | 0x49 | 004ff3d0 | 2 | 004ab15b | DAT_00895d9a = DAT_00895d9a + 1; sVar7 = DAT_00895d9a; if (DAT_00895d9e + -1 < (int)DAT_00895d9a) { |
| 005d613c | Numpad 8 | press | 0x4a | 004ff3d0 | 2 | 004ab19e | DAT_00895d9a = DAT_00895d9a + -1; if (DAT_00895d9a < 0) { DAT_00895d9a = DAT_00895d9e + -1; |
| 005d6148 | Numpad 2 | press | 0x49 | 004ff3d0 | 2 | 004ab15b | DAT_00895d9a = DAT_00895d9a + 1; sVar7 = DAT_00895d9a; if (DAT_00895d9e + -1 < (int)DAT_00895d9a) { |
| 005d6154 | Left | press | 0x4c | 004ff3d0 | 2 | 004ab203 | set_tribe_command(CONCAT31((int3)cVar11,player_tribe_num),0x17,(int)DAT_00895d9a, *(undefined4 *)(&DAT_005a... |
| 005d6160 | Right | press | 0x4b | 004ff3d0 | 2 | 004ab1d5 | set_tribe_command(CONCAT31((int3)cVar11,player_tribe_num),0x17,(int)DAT_00895d9a, -*(int *)(&DAT_005a8ac1 +... |
| 005d616c | Numpad 4 | press | 0x4c | 004ff3d0 | 2 | 004ab203 | set_tribe_command(CONCAT31((int3)cVar11,player_tribe_num),0x17,(int)DAT_00895d9a, *(undefined4 *)(&DAT_005a... |
| 005d6178 | Numpad 6 | press | 0x4b | 004ff3d0 | 2 | 004ab1d5 | set_tribe_command(CONCAT31((int3)cVar11,player_tribe_num),0x17,(int)DAT_00895d9a, -*(int *)(&DAT_005a8ac1 +... |
| 005d6184 | Shift+Left | press | 0x4e | 004ff3d0 | 2 | 004ab25d | set_tribe_command(CONCAT31((int3)cVar11,player_tribe_num),0x17,(int)DAT_00895d9a, *(undefined4 *)(&DAT_005a... |
| 005d6190 | Shift+Right | press | 0x4d | 004ff3d0 | 2 | 004ab22f | set_tribe_command(CONCAT31((int3)cVar11,player_tribe_num),0x17,(int)DAT_00895d9a, -*(int *)(&DAT_005a8ac5 +... |
| 005d619c | Shift+Numpad 4 | press | 0x4e | 004ff3d0 | 2 | 004ab25d | set_tribe_command(CONCAT31((int3)cVar11,player_tribe_num),0x17,(int)DAT_00895d9a, *(undefined4 *)(&DAT_005a... |
| 005d61a8 | Shift+Numpad 6 | press | 0x4d | 004ff3d0 | 2 | 004ab22f | set_tribe_command(CONCAT31((int3)cVar11,player_tribe_num),0x17,(int)DAT_00895d9a, -*(int *)(&DAT_005a8ac5 +... |
| 005d61b4 | 7 | press | 0x57 | - | 3 | 004ab40e | sunlight_init_2(); set_landscape_c_4_and_texture(0,0x40); |
| 005d61c0 | 0 | press | 0x58 | - | 3 | 004ab424 | if ((game_state._838239_1_ & 1) == 0) { FUN_00479f00(0xd,CONCAT22(uVar19,(short)vconfig_index_start),0); } |
| 005d61cc | M | press | 0x5f | - | 0 | 004abdef | if ((land_flags_1 & 8) != 0) { FUN_004aee40(4,0); |
| 005d61d8 | B | press | 0xbf | - | 0 | 004ad2bc | set_tribe_command(player_tribe_num,0x7c,0,0); write_str_to_debug_buffer(DAT_00973020,0x10,player_tribe_num,... |
| 005d61e4 | Backslash | press | 0x60 | - | 1 | 004abe13 | FUN_00419a60(3,0,0); FUN_00419a20(0); |
| 005d61f0 | Shift+Backslash | press | 0x61 | - | 1 | 004abe36 | if (*(short *)&game_state.tribes_array[player_tribe_num].field_0xa37 != 0) { puVar24 = (unit_struct *)0x0; ... |
| 005d61fc | D | press | 0xc0 | - | 0 | 004ad2fe | set_tribe_command(iVar23,0x7e,0,0); |
| 005d6208 | N | press | 0x62 | - | 0 | 004abf0f | set_tribe_command(iVar23,0x68,0,0); |
| 005d6214 | S | press | 0x63 | 004ff430 | 1 | 004ab498 | if ((10 < game_state.offset_counter_2) && ((load_level_flags & 0x4000000) == 0)) { if ((land_flags_1 & 0x60... |
| 005d6220 | G | press | 0xc1 | - | 0 | 004ad318 | uVar16 = FUN_004999d0(0); set_tribe_command(iVar23,0x82,uVar16); |
| 005d622c | Period | press | 0x5d | - | 0 | 004ab44b | puVar21 = game_state.tribes_array[iVar23].shaman; if (puVar21 != (unit_struct *)0x0) { set_data_to_rddata_c... |
| 005d6238 | Apostrophe | press | 0x64 | - | 2 | 004ab4ea | _render_state_flags = _render_state_flags \| 8; |
| 005d6244 | Apostrophe (any modifiers) | release | 0x65 | - | 2 | 004ab4f6 | _render_state_flags = _render_state_flags & 0xfffffff7; |
| 005d6250 | Comma | press | 0xb7 | - | 2 | 004aba5a | _DAT_0089d168 = 0xffffffff; DAT_0089d16c = 0xffff; |
| 005d625c | Comma (any modifiers) | release | 0xb8 | - | 2 | 004aba82 | _DAT_0089d168 = 0; DAT_0089d16c = 0; |
| 005d6268 | Mouse left (ignores Shift/Ctrl) | press | 0xc4 | 004ff030 | 0 | 004ad41a | iVar17 = FUN_004c28a0(player_tribe_num * 0xc65 + 0x89d1c8,(int)DAT_0089ce81); if (iVar17 != 3) { |
| 005d6274 | Alt+Mouse left | press | 0xc2 | 004feef0 | 0 | 004ad339 (shared) | cVar12 = FUN_004c2830(); if (cVar12 != '\0') { local_320._1_3_ = (undefined3)(minimap_state_and_cache >> 8); |
| 005d6280 | Alt+Mouse right | press | 0xc3 | 004feef0 | 0 | 004ad339 (shared) | cVar12 = FUN_004c2830(); if (cVar12 != '\0') { local_320._1_3_ = (undefined3)(minimap_state_and_cache >> 8); |
| 005d628c | Mouse left | release | 0x6a | 004fefe0 | 0 | 004ac172 (shared) | if (draw_mode != 2) { iVar17 = FUN_004c28a0(player_tribe_num * 0xc65 + 0x89d1c8,(int)DAT_0089ce81); uVar22 ... |
| 005d6298 | Ctrl+Mouse left | release | 0x6b | 004fefe0 | 0 | 004ac172 (shared) | if (draw_mode != 2) { iVar17 = FUN_004c28a0(player_tribe_num * 0xc65 + 0x89d1c8,(int)DAT_0089ce81); uVar22 ... |
| 005d62a4 | Mouse left (any modifiers) | release | 0x6d | 004ff090 | 0 | 004ac45b | if ((draw_mode != 2) && (game_state.tribes_array[player_tribe_num].shaman != (unit_struct *)0x0) ) { local_... |
| 005d62b0 | Mouse right (any modifiers) | release | 0x6c | 004ff080 | 0 | 004ac406 | if (draw_mode != 2) { set_tribe_command(player_tribe_num,0x6f,0,0); FUN_0047a550(0,player_tribe_num * 0xc65... |
| 005d62bc | Escape | press | 0x6c | 004ff080 | 0 | 004ac406 | if (draw_mode != 2) { set_tribe_command(player_tribe_num,0x6f,0,0); FUN_0047a550(0,player_tribe_num * 0xc65... |
| 005d62c8 | Shift+1 | press | 0x84 | - | 0 | 004ad035 (shared) | - |
| 005d62d4 | Shift+2 | press | 0x85 | - | 0 | 004ad035 (shared) | - |
| 005d62e0 | Shift+3 | press | 0x86 | - | 0 | 004ad035 (shared) | - |
| 005d62ec | Shift+4 | press | 0x87 | - | 0 | 004ad035 (shared) | - |
| 005d62f8 | Shift+5 | press | 0x88 | - | 0 | 004ad035 (shared) | - |
| 005d6304 | Shift+6 | press | 0x89 | - | 0 | 004ad035 (shared) | - |
| 005d6310 | 1 (ignores Ctrl) | press | 0x8a | 004fee90 | 0 | 004ad052 (shared) | uVar16 = 1; if (((DAT_009845ae != '\0') && (DAT_009846ae == '\0')) \|\| ((DAT_0098462e != '\0' && (DAT_0098... |
| 005d631c | 2 (ignores Ctrl) | press | 0x8b | 004fee90 | 0 | 004ad052 (shared) | uVar16 = 1; if (((DAT_009845ae != '\0') && (DAT_009846ae == '\0')) \|\| ((DAT_0098462e != '\0' && (DAT_0098... |
| 005d6328 | 3 (ignores Ctrl) | press | 0x8c | 004fee90 | 0 | 004ad052 (shared) | uVar16 = 1; if (((DAT_009845ae != '\0') && (DAT_009846ae == '\0')) \|\| ((DAT_0098462e != '\0' && (DAT_0098... |
| 005d6334 | 4 (ignores Ctrl) | press | 0x8d | 004fee90 | 0 | 004ad052 (shared) | uVar16 = 1; if (((DAT_009845ae != '\0') && (DAT_009846ae == '\0')) \|\| ((DAT_0098462e != '\0' && (DAT_0098... |
| 005d6340 | 5 (ignores Ctrl) | press | 0x8e | 004fee90 | 0 | 004ad052 (shared) | uVar16 = 1; if (((DAT_009845ae != '\0') && (DAT_009846ae == '\0')) \|\| ((DAT_0098462e != '\0' && (DAT_0098... |
| 005d634c | 6 (ignores Ctrl) | press | 0x8f | 004fee90 | 0 | 004ad052 (shared) | uVar16 = 1; if (((DAT_009845ae != '\0') && (DAT_009846ae == '\0')) \|\| ((DAT_0098462e != '\0' && (DAT_0098... |
| 005d6358 | Alt+1 (ignores Ctrl) | press | 0x90 | 004fee90 | 0 | 004ad099 (shared) | uVar16 = 1; if (((DAT_009845ae != '\0') && (DAT_009846ae == '\0')) \|\| ((DAT_0098462e != '\0' && (DAT_0098... |
| 005d6364 | Alt+2 (ignores Ctrl) | press | 0x91 | 004fee90 | 0 | 004ad099 (shared) | uVar16 = 1; if (((DAT_009845ae != '\0') && (DAT_009846ae == '\0')) \|\| ((DAT_0098462e != '\0' && (DAT_0098... |
| 005d6370 | Alt+3 (ignores Ctrl) | press | 0x92 | 004fee90 | 0 | 004ad099 (shared) | uVar16 = 1; if (((DAT_009845ae != '\0') && (DAT_009846ae == '\0')) \|\| ((DAT_0098462e != '\0' && (DAT_0098... |
| 005d637c | Alt+4 (ignores Ctrl) | press | 0x93 | 004fee90 | 0 | 004ad099 (shared) | uVar16 = 1; if (((DAT_009845ae != '\0') && (DAT_009846ae == '\0')) \|\| ((DAT_0098462e != '\0' && (DAT_0098... |
| 005d6388 | Alt+5 (ignores Ctrl) | press | 0x94 | 004fee90 | 0 | 004ad099 (shared) | uVar16 = 1; if (((DAT_009845ae != '\0') && (DAT_009846ae == '\0')) \|\| ((DAT_0098462e != '\0' && (DAT_0098... |
| 005d6394 | Alt+6 (ignores Ctrl) | press | 0x95 | 004fee90 | 0 | 004ad099 (shared) | uVar16 = 1; if (((DAT_009845ae != '\0') && (DAT_009846ae == '\0')) \|\| ((DAT_0098462e != '\0' && (DAT_0098... |
| 005d63a0 | H | press | 0x96 | - | 1 | 004ad0e0 | iVar17 = (int)player_tribe_num; local_320 = CONCAT31(local_320._1_3_, (char)((ushort)*(undefined2 *)&game_s... |
| 005d63ac | L | press | 0x97 | - | 0 | 004ab51f | if ((game_state.tribes_array[iVar23].field_0x93d & 0x80) == 0) { set_tribe_command(CONCAT31(uVar18,player_t... |
| 005d63b8 | Shift+L | press | 0xb4 | - | 0 | 004ab9fc | iVar15 = FUN_004999d0(); if (iVar15 == 0) { FUN_004999f0(); |
| 005d63c4 | Alt+V | press | 0x9e | - | 3 | 004ab8ab | FUN_00479f00(0xb,0,0); |
| 005d63d0 | Shift+Z | press | 0x1e | - | 1 | 004aad2b (shared) | FUN_0047c590(param_1 + -0x1e); |
| 005d63dc | Shift+X | press | 0x1f | - | 1 | 004aad2b (shared) | FUN_0047c590(param_1 + -0x1e); |
| 005d63e8 | Shift+C | press | 0x20 | - | 1 | 004aad2b (shared) | FUN_0047c590(param_1 + -0x1e); |
| 005d63f4 | Shift+V | press | 0x21 | - | 1 | 004aad2b (shared) | FUN_0047c590(param_1 + -0x1e); |
| 005d6400 | Z | press | 0x22 | - | 1 | 004aad3c (shared) | if ((*(uint *)&game_state.tribes_array[iVar23].field_0x941 & 1 << (cVar12 - 0x20U & 0x1f)) != 0) { local_22... |
| 005d640c | X | press | 0x23 | - | 1 | 004aad3c (shared) | if ((*(uint *)&game_state.tribes_array[iVar23].field_0x941 & 1 << (cVar12 - 0x20U & 0x1f)) != 0) { local_22... |
| 005d6418 | C | press | 0x24 | - | 1 | 004aad3c (shared) | if ((*(uint *)&game_state.tribes_array[iVar23].field_0x941 & 1 << (cVar12 - 0x20U & 0x1f)) != 0) { local_22... |
| 005d6424 | V | press | 0x25 | - | 1 | 004aad3c (shared) | if ((*(uint *)&game_state.tribes_array[iVar23].field_0x941 & 1 << (cVar12 - 0x20U & 0x1f)) != 0) { local_22... |
| 005d6430 | Backspace | press | 0xaf | - | 0 | 004ab91d | iVar15 = FUN_00451370(2); if ((iVar15 == 0) && (DAT_0089bb89 != 0)) { FUN_004af440(DAT_0089bb82,(int)DAT_00... |
| 005d643c | Shift+Backspace | press | 0x98 | 004fee90 | 0 | 004ad144 | FUN_0047c350(0,1,0,0); |
| 005d6448 | Mouse button 2/3 | press | 0x99 | 004ff4b0 | 1 | 004ab558 | DAT_0089ce6a = (undefined2)param_3; DAT_0089ce68 = (undefined2)param_2; if ((int)(screen_height * 0xd + (sc... |
| 005d6454 | Mouse button 2/3 | release | 0x9a | 004fefc0 | 1 | 004ab609 | DAT_0098e910 = '\0'; DAT_0089ce6c = 0; |
| 005d6460 | Shift+Mouse left | press | 0x74 | 004ff150 | 0 | 004aca73 | uVar22 = (_minimap_centre_x & 0xfe) * 2 \| _minimap_centre_x & 0xfe00; set_tribe_command(CONCAT31((int3)((_... |
| 005d646c | Mouse left | release | 0x76 | 004ff270 | 0 | 004acb52 | set_tribe_command(CONCAT31(uVar18,player_tribe_num),0x67,1,unit_index_2); if (unit_index_2 != 0) { DAT_0089... |
| 005d6478 | Mouse left (ignores Shift/Alt) | press | 0x6e | 004fef20 | 0 | 004ac5a7 (shared) | if (draw_mode == 2) { |
| 005d6484 | Ctrl+Mouse left (ignores Shift/Alt) | press | 0x6f | 004fef20 | 0 | 004ac5a7 (shared) | if (draw_mode == 2) { |
| 005d6490 | Mouse left (any modifiers) | release | 0x71 | 004fefa0 | 0 | 004ac90a | if (DAT_0089c6e7 == '\t') { set_data_to_rddata_chunk(0x6c,(DAT_0098e908 & 0x100) != 0,_minimap_related_1); } |
| 005d649c | Mouse left | release | 0x77 | 004ff3c0 | 0 | 004acbad (shared) | bVar3 = false; bVar4 = false; bVar6 = true; |
| 005d64a8 | Ctrl+Mouse left | release | 0x78 | 004ff3c0 | 0 | 004acbad (shared) | bVar3 = false; bVar4 = false; bVar6 = true; |
| 005d64b4 | Alt+Mouse left | release | 0x78 | 004ff3c0 | 0 | 004acbad (shared) | bVar3 = false; bVar4 = false; bVar6 = true; |
| 005d64c0 | Mouse right (any modifiers) | release | 0x7c | 004ff3c0 | 0 | 004ace71 | FUN_004b9150(); FUN_004ba5d0(); FUN_0047a550(0,player_tribe_num * 0xc65 + 0x89d1c8); |
| 005d64cc | Space | press | 0x7b | 004ff3c0 | 0 | 004ace3a | pcVar1 = &DAT_005a885a + DAT_00895de0 * 0x12; cVar12 = *pcVar1; *pcVar1 = cVar12 + '\x01'; |
| 005d64d8 | Shift+Mouse right | release | 0x79 | 004ff2d0 | 0 | 004acdc1 | set_tribe_command(CONCAT31(uVar18,player_tribe_num),0x11,0,_minimap_centre_x); FUN_0044b100(); |
| 005d64e4 | Shift+Mouse right | release | 0x7a | 004ff360 | 0 | 004acdea | puVar21 = (unit_struct *)0x0; if (((unit_index_2 != 0) && (puVar24 = unit_land_array[unit_index_2], (*(byte... |
| 005d64f0 | Escape | press | 0x7c | 004ff3c0 | 0 | 004ace71 | FUN_004b9150(); FUN_004ba5d0(); FUN_0047a550(0,player_tribe_num * 0xc65 + 0x89d1c8); |
| 005d64fc | Right Shift (any modifiers) | press | 0xbb | - | 0 | 004abb5b | DAT_0098e908 = DAT_0098e908 \| 0x400; |
| 005d6508 | Right Shift (any modifiers) | release | 0xbc | - | 0 | 004abb64 | DAT_0098e908 = DAT_0098e908 & 0xfbff; |
| 005d6514 | Left Shift (any modifiers) | press | 0xbb | - | 0 | 004abb5b | DAT_0098e908 = DAT_0098e908 \| 0x400; |
| 005d6520 | Left Shift (any modifiers) | release | 0xbc | - | 0 | 004abb64 | DAT_0098e908 = DAT_0098e908 & 0xfbff; |
| 005d652c | Right Alt (any modifiers) | press | 0xbd | - | 0 | 004abb6f | DAT_0098e908 = DAT_0098e908 \| 0x800; |
| 005d6538 | Right Alt (any modifiers) | release | 0xbe | - | 0 | 004abb78 | DAT_0098e908 = DAT_0098e908 & 0xf7ff; |
| 005d6544 | Left Alt (any modifiers) | press | 0xbd | - | 0 | 004abb6f | DAT_0098e908 = DAT_0098e908 \| 0x800; |
| 005d6550 | Left Alt (any modifiers) | release | 0xbe | - | 0 | 004abb78 | DAT_0098e908 = DAT_0098e908 & 0xf7ff; |
| 005d655c | Mouse left (ignores Shift/Alt) | release | 0x7e | 004ff480 | 0 | 004acf2e | if (draw_mode != 2) { uVar22 = FUN_004999d0(); if ((DAT_0098e908 & 0x800) != 0) { |
| 005d6568 | Ctrl+Mouse left (ignores Shift/Alt) | release | 0x7f | 004ff480 | 0 | 004acf85 | if (draw_mode != 2) { uVar22 = FUN_004999d0(); if ((DAT_0098e908 & 0x800) != 0) { |
| 005d6574 | Mouse right (any modifiers) | release | 0x83 | 004ff460 | 0 | 004acffb | if (draw_mode != 2) { set_tribe_command(player_tribe_num,0x1e,0,0); FUN_004199b0(&DAT_00895de6); |
| 005d6580 | Escape (ignores Shift/Alt) | press | 0x83 | 004ff460 | 0 | 004acffb | if (draw_mode != 2) { set_tribe_command(player_tribe_num,0x1e,0,0); FUN_004199b0(&DAT_00895de6); |
| 005d658c | Shift+Mouse left | release | 0x75 | 004ff1d0 | 0 | 004acaf7 | set_tribe_command(CONCAT31(uVar18,player_tribe_num),0x60,unit_index_2,0); if (unit_index_2 != 0) { DAT_0089... |
| 005d6598 | Mouse right | press | 0x72 | 004feed0 | 1 | 004aca13 | iVar17 = FUN_00451370(2); if (((iVar17 == 0) && ((level_flags_1 & 0x20) == 0)) && (cVar12 = FUN_0047ae00(1,... |
| 005d65a4 | Mouse right | release | 0x73 | 004ff3f0 | 1 | 004aca5f | DAT_0098e908 = DAT_0098e908 & 0xff7f; |
| 005d65b0 | Alt+F11 | press | 0x11 | - | 2 | 004abbe2 (no-op) | - |
| 005d65bc | F11 | press | 0x12 | - | 2 | 004aac87 | if ((land_flags_1 & 0x8000) != 0) { FUN_004b36e0(1,1); } |
| 005d65c8 | Space | press | 0x5a | 004ff510 | 0 | 004abd76 | FUN_00483930(); |
| 005d65d4 | Space (any modifiers) | press | 0x5b | 004ff4f0 | 0 | 004abd86 | if (10 < game_state.offset_counter_2) { if ((load_level_flags & 0x4000000) != 0) { FUN_0041b4f0(); |
| 005d65e0 | Space | press | 0x59 | - | 0 | 004abd0d | if (-1 < DAT_0089c6a1) { local_320 = CONCAT22(local_320._2_2_,(short)DAT_0089c6a1); iVar17 = local_320; |
| 005d65ec | A | press | 0xa0 | - | 3 | 004ab8be | DAT_0098e908 = DAT_0098e908 \| 8; |
| 005d65f8 | Ctrl+A | press | 0xa2 | - | 3 | 004ab8e1 | DAT_0098e908 = DAT_0098e908 \| 0x20; |
| 005d6604 | A (any modifiers) | release | 0xa1 | 004ff3e0 | 3 | 004ab8ca (shared) | DAT_0098e908 = DAT_0098e908 & 0xffd7; |
| 005d6610 | Up | press | 0xa4 | 004ff3e0 | 3 | 004ab8ed (shared) | uVar22 = CONCAT22(uVar19,DAT_0098e908) & 0xffff0020; FUN_00479ef0(param_1,CONCAT31((int3)(uVar22 >> 8),(sho... |
| 005d661c | Down | press | 0xa5 | 004ff3e0 | 3 | 004ab8ed (shared) | uVar22 = CONCAT22(uVar19,DAT_0098e908) & 0xffff0020; FUN_00479ef0(param_1,CONCAT31((int3)(uVar22 >> 8),(sho... |
| 005d6628 | Left | press | 0xa6 | 004ff3e0 | 3 | 004ab8ed (shared) | uVar22 = CONCAT22(uVar19,DAT_0098e908) & 0xffff0020; FUN_00479ef0(param_1,CONCAT31((int3)(uVar22 >> 8),(sho... |
| 005d6634 | Right | press | 0xa7 | 004ff3e0 | 3 | 004ab8ed (shared) | uVar22 = CONCAT22(uVar19,DAT_0098e908) & 0xffff0020; FUN_00479ef0(param_1,CONCAT31((int3)(uVar22 >> 8),(sho... |
| 005d6640 | Shift+Left | press | 0xa8 | 004ff3e0 | 3 | 004ab8ed (shared) | uVar22 = CONCAT22(uVar19,DAT_0098e908) & 0xffff0020; FUN_00479ef0(param_1,CONCAT31((int3)(uVar22 >> 8),(sho... |
| 005d664c | Shift+Right | press | 0xa9 | 004ff3e0 | 3 | 004ab8ed (shared) | uVar22 = CONCAT22(uVar19,DAT_0098e908) & 0xffff0020; FUN_00479ef0(param_1,CONCAT31((int3)(uVar22 >> 8),(sho... |
| 005d6658 | Home | press | 0xaa | 004ff3e0 | 3 | 004ab8ed (shared) | uVar22 = CONCAT22(uVar19,DAT_0098e908) & 0xffff0020; FUN_00479ef0(param_1,CONCAT31((int3)(uVar22 >> 8),(sho... |
| 005d6664 | Mouse button 2/3 | press | 0x9f | 004ff4d0 | 1 | 004abbe2 (no-op) | - |
| 005d6670 | Numpad 0 | press | 0xae | - | 1 | 004ab90e | FUN_00417aa0(0); |
| 005d667c | Shift+Mouse right | release | 0xb3 | 004ff0f0 | 0 | 004ad1f0 | iVar17 = FUN_0049a220(_minimap_centre_x & 0xffff,iVar23); if (iVar17 != 0) { set_tribe_command(iVar23,0x78,... |
| 005d6688 | Print Screen | release | 0xc6 | - | 2 | 004ad5b2 | level_flags_2 = level_flags_2 ^ 2; |
| 005d6694 | Insert (any modifiers) | press | 0xcd | - | 0 | 004abbd6 | FUN_0044bb50(); |
| 005d66a0 | Home (any modifiers) | press | 0xcc | - | 0 | 004abbcf | FUN_0044bb30(); |
| 005d66ac | Page Up (any modifiers) | press | 0xce | - | 0 | 004abbdd | FUN_0044bb60(); |
