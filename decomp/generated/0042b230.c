/* Ghidra 12.1.3 pseudocode; entry 0042b230; load_level.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void load_level(int param_1,undefined4 param_2,byte param_3)

{
  bool bVar1;
  undefined2 extraout_var;
  int iVar2;
  int iVar3;
  char cVar4;
  land_pos *plVar5;
  undefined4 *puVar6;
  struct_56B *psVar7;

  bVar1 = false;
  puVar6 = &DAT_0064f480;
  for (iVar2 = 8; iVar2 != 0; iVar2 = iVar2 + -1) {
    *puVar6 = 0;
    puVar6 = puVar6 + 1;
  }
  FUN_00477780(1);
  clear_level_fields();
  land_flags_1 = land_flags_1 & 0xf9ffffff;
  level_flags_1 = level_flags_1 & 0xffffffdf;
  plVar5 = game_state.level_data;
  for (iVar2 = 0x10000; iVar2 != 0; iVar2 = iVar2 + -1) {
    plVar5->flags = 0;
    plVar5 = (land_pos *)&plVar5->height;
  }
  clear_some_array();
  if ((param_3 & 1) == 0) {
    level_flags = level_flags & 0xfffffffd;
  }
  else {
    level_flags = level_flags | 2;
  }
  FUN_00443910(0);
  FUN_0042c8f0();
  game_state._841990_4_ = 0;
  FUN_00493a40();
  game_state._4_4_ = game_state._4_4_ & 0xfffffe01;
  puVar6 = (undefined4 *)&game_state.some_array;
  for (iVar2 = 200; iVar2 != 0; iVar2 = iVar2 + -1) {
    *puVar6 = 0;
    puVar6 = puVar6 + 1;
  }
  *(undefined2 *)puVar6 = 0;
  FUN_00430bb0();
  FUN_00448ea0();
  FUN_00479f00(8,0,0xffffffff);
  FUN_00479f00(10,(short)player_tribe_num,0);
  FUN_004af1c0(1);
  cVar4 = (char)param_1;
  if (level_number != 0) {
    if ((level_number_1 != param_1) &&
       ((level_number_1 = cVar4, game_state.field112137_0xd1958 = cVar4, init_file_names(param_1),
        landscape_flags_1 == '\x02' || (landscape_flags_1 == '\x03')))) {
      load_files();
      if (level_number_1 == '6') {
        load_watdisp_1();
      }
      else {
        load_watdisp_2();
      }
      if (DAT_0089c6f3 != '\0') {
        level_flags_1 = level_flags_1 | 1;
      }
      d3d_palette_chanage();
    }
    load_objs_1(param_2);
    iVar2 = load_level2((int)level_number);
    if (iVar2 != 0) {
      bVar1 = true;
    }
  }
  if (bVar1) {
    game_state.objs_number = (undefined1)param_2;
    game_state.flags_1 = param_3;
    game_state.field112137_0xd1958 = cVar4;
    init_tribe_struct();
    FUN_00503230();
    iVar2 = 0x89d1c8;
    game_state._841990_4_ = DAT_0089bc76;
    iVar3 = 4;
    do {
      *(undefined4 *)(iVar2 + 0x921) = 6;
      iVar2 = iVar2 + 0xc65;
      iVar3 = iVar3 + -1;
    } while (iVar3 != 0);
    iVar2 = 0;
    iVar3 = 0x89d1c8;
    if (game_state.num_tribes != 0) {
      do {
        set_tribe_start_pos(iVar3);
        if ((load_level_flags & 0x200) == 0) {
          clear_tribe_1(iVar3);
          process_tribe_1(iVar3);
          *(uint *)(iVar3 + 0x93d) = *(uint *)(iVar3 + 0x93d) & 0xfffeffff;
        }
        iVar2 = iVar2 + 1;
        iVar3 = iVar3 + 0xc65;
      } while (iVar2 < (int)(uint)game_state.num_tribes);
    }
    FUN_00516eb0();
    FUN_0042ca00();
    if ((param_3 & 2) == 0) {
      level_flags = level_flags & 0xffff7fff;
    }
    else {
      level_flags = level_flags | 0x8000;
    }
    FUN_004438a0(0);
    FUN_0042cbc0(0);
    FUN_004c3200();
    FUN_00417270(CONCAT22(extraout_var,DAT_0089c6c3),1);
    DAT_0089ce7a = 0xffff;
    FUN_0044a280();
    FUN_0044cf80();
    if ((level_flags & 0x800) != 0) {
      FUN_0044cf70();
    }
    clear_some_game_state_structs();
    if (((land_flags_1 & 8) != 0) && ((level_hdr_mem.level_flags & 8) != 0)) {
      FUN_0041c140();
    }
    if (5 < level_number) {
      iVar2 = 0;
      psVar7 = game_state.array_56b_4;
      do {
        iVar3 = 0;
        do {
          if ((psVar7->spells & 1 << ((byte)iVar3 & 0x1f)) != 0) {
            struct_56B_set_field_16(iVar2,iVar3);
          }
          iVar3 = iVar3 + 1;
        } while (iVar3 < 0x20);
        if ((*(byte *)&psVar7->spells & 4) != 0) {
          FUN_004c2be0(iVar2,2);
        }
        if ((*(byte *)((int)&psVar7->spells + 2) & 2) != 0) {
          FUN_004c2be0(iVar2,0x11);
        }
        psVar7 = psVar7 + 1;
        iVar2 = iVar2 + 1;
      } while (psVar7 < &game_state.field_0xc3672);
      return;
    }
  }
  else {
    set_level_height_100();
    sunlight_init_default();
  }
  return;
}
