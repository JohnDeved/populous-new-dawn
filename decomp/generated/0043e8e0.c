/* Ghidra 12.1.3 pseudocode; entry 0043e8e0; process_tribe_cmd.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */

void process_tribe_cmd(int param_1,int param_2)

{
  byte bVar1;
  undefined4 uVar2;
  bool bVar3;
  uint3 uVar4;
  uint3 uVar5;
  short sVar6;
  byte bVar7;
  char cVar8;
  undefined2 uVar9;
  ushort uVar10;
  undefined2 extraout_var;
  unit_struct *puVar11;
  int iVar12;
  byte bVar13;
  ushort *puVar14;
  unit_struct *puVar15;
  undefined1 uVar16;
  undefined2 *puVar17;
  unit_struct *puVar18;
  int iVar19;
  uint uVar20;
  short *psVar21;
  unit_struct *puVar22;
  uint uVar23;
  int iVar24;
  byte *pbVar25;
  wchar_t *_Format;
  undefined4 uVar26;
  char local_3cd;
  short local_3c8;
  short sStack_3c6;
  undefined2 uStack_3c4;
  unit_struct *local_3c0;
  undefined4 local_3bc;
  undefined4 local_3b8;
  undefined4 local_3b4;
  undefined4 local_3b0;
  short local_370;
  short sStack_36e;
  undefined2 uStack_36c;
  unit_struct *local_368;
  undefined2 local_364;
  undefined2 local_362;
  undefined2 local_360;
  byte local_35c;
  byte bStack_35b;
  ushort uStack_35a;
  undefined1 local_358;
  undefined1 uStack_357;
  int local_25c [16];
  byte local_21c;
  byte bStack_21b;
  undefined2 uStack_21a;
  undefined1 uStack_218;
  undefined1 uStack_217;

  bVar1 = *(byte *)(param_1 + 0xc22);
  iVar19 = 0;
  local_3c0 = (unit_struct *)0x0;
  local_3b4 = 0;
  switch(*(byte *)(param_2 + 0xc)) {
  case 0xc:
  case 0x1c:
    switch(*(undefined4 *)(param_2 + 4)) {
    case 1:
      if ((land_flags_1 & 8) == 0) {
        if ((int)player_tribe_num == (uint)bVar1) {
          DAT_00895d8f = 3;
          iVar19 = 0xee;
        }
      }
      else {
        iVar19 = 0xed;
        if ((int)player_tribe_num == (uint)bVar1) {
          land_flags_1 = land_flags_1 & 0xf7ffffff;
          DAT_00895d8f = 2;
        }
      }
      if (DAT_00895d8f != 0) {
        DAT_00895d97._0_1_ = *(undefined1 *)(param_2 + 0xc);
      }
      FUN_0047aaa0();
      _swprintf((wchar_t *)&local_21c,u__s_____0059cca4,(&DAT_00972ba8)[iVar19]);
      pbVar25 = &local_21c;
      uVar26 = 0x18;
      goto LAB_0044228c;
    case 3:
      DAT_0059dee0 = 1;
      level_number_1b = (undefined1)level_number;
      if (interface_state == '\x02') {
        screen_resolution_index = screen_resolution_index_current;
      }
      interface_state_2 = 7;
      interface_state_3 = 5;
      interface_state_4 = 0;
      DAT_0089569d = 0;
      break;
    case 4:
      FUN_0047aaa0();
      _swprintf((wchar_t *)&local_21c,u__s_____0059cc94,DAT_00973350);
      write_str_to_debug_buffer(&local_21c,0x18,bVar1,0);
      if ((level_flags_1._3_1_ & 0x80) != 0) {
        FUN_00458710();
      }
    case 2:
      if ((int)player_tribe_num == (uint)bVar1) {
        clear_tribe_session(1);
      }
      else if (game_state.tribes_array[bVar1].field_0xc20 != '\0') {
        game_state._858439_1_ = game_state._858439_1_ + -1;
        FUN_0047aaa0();
        clear_tribe_commands(bVar1);
      }
    }
    break;
  case 0xe:
    uVar26 = *(undefined4 *)(param_2 + 8);
    uVar2 = *(undefined4 *)(param_2 + 4);
    local_35c = (byte)uVar2;
    bStack_35b = (byte)((uint)uVar2 >> 8);
    cVar8 = FUN_004b9a20(uVar26,CONCAT22(uStack_35a,(short)uVar2),
                         CONCAT13(local_358,CONCAT21(uStack_35a,bStack_35b)),bVar1);
    if (cVar8 != '\0') {
      FUN_004b9190(uVar26,CONCAT22(uStack_35a,CONCAT11(bStack_35b,local_35c)),
                   CONCAT13(local_358,CONCAT21(uStack_35a,bStack_35b)),bVar1,2);
    }
    break;
  case 0x11:
    puVar11 = (unit_struct *)0x0;
    local_3b0 = *(unit_struct **)(param_2 + 8);
    uVar10 = (&game_state.level_data[0].unit_index_2)
             [(((uint)local_3b0 & 0xfe) * 2 | (uint)local_3b0 & 0xfe00) * 2] & 0x3ff;
    if (((uVar10 != 0) && (puVar18 = unit_land_array[uVar10], (*(byte *)&puVar18->flags_2 & 1) == 0)
        ) && (puVar18->unit_class != '\0')) {
      puVar11 = puVar18;
    }
    if (puVar11 != (unit_struct *)0x0) {
      FUN_004ba940(puVar11);
      FUN_004b9190(local_3b0,0,0,bVar1,3);
    }
    break;
  case 0x12:
    local_3b0 = *(unit_struct **)(param_2 + 8);
    local_21c = (byte)local_3b0;
    bStack_21b = (byte)((uint)local_3b0 >> 8);
    uVar20 = (uint)bVar1;
    local_21c = local_21c & 0xfe;
    bStack_21b = bStack_21b & 0xfe;
    game_state.tribes_array[uVar20].tribe_index_1 = (ushort)local_21c << 8;
    game_state.tribes_array[uVar20].tribe_index_2 = (ushort)bStack_21b << 8;
    FUN_004d4840(CONCAT31((int3)(uVar20 * 0xc65 >> 8),bVar1),0x10);
    break;
  case 0x14:
    FUN_00415990(param_1);
    break;
  case 0x15:
    DAT_00895dac = DAT_00895dac + *(char *)(param_2 + 4);
    if ((land_flags_1 & 0x8000) == 0) {
      if (DAT_00895dac < '\0') {
        DAT_00895dac = '\0';
      }
      if ('\x04' < DAT_00895dac) {
        DAT_00895dac = '\x04';
      }
    }
    else {
      if (DAT_00895dac < '\0') {
        DAT_00895dac = '\0';
      }
      if (' ' < DAT_00895dac) {
        DAT_00895dac = ' ';
      }
    }
    _swprintf((wchar_t *)&local_21c,u__s____d_0059cc84,DAT_00972f48,DAT_00895dac + 1);
    pbVar25 = &local_21c;
    uVar26 = 0x10;
    goto LAB_0044228c;
  case 0x17:
    FUN_00443520(param_2,param_1);
    break;
  case 0x1b:
    if (level_number == -1) {
      clear_tribe_session(1);
    }
    else {
      _swprintf((wchar_t *)&local_21c,u__s_____0059ccb4,DAT_00972f64);
      write_str_to_debug_buffer(&local_21c,10,0xffffffff,0);
      land_flags_1 = land_flags_1 | 0x8000000;
      FUN_004154a0();
      if ((int)player_tribe_num == (uint)bVar1) {
        load_level_hdr_2((int)level_number);
        level_process_hdr_1();
        load_level_3(level_hdr_mem.level_num,level_hdr_mem.obj_num,level_hdr_mem.level_flags);
        game_state.offset_counter = 1;
        empty_3();
        FUN_0042b940();
        update_vfconfig();
      }
      set_tribe_start_pos(param_1);
      FUN_00415580();
      mldplay_func_1();
      if (game_state._858439_1_ != '\x01') {
        FUN_00415610(0);
      }
    }
    break;
  case 0x1d:
    FUN_00479f00(5,bVar1,0);
    break;
  case 0x1e:
  case 0x26:
  case 0x27:
  case 0x37:
  case 0x38:
  case 0x39:
  case 0x3a:
  case 0x3b:
  case 0x3c:
  case 0x3d:
  case 0x3e:
  case 0x57:
  case 0x58:
  case 0x59:
  case 0x5a:
  case 0x5b:
  case 0x5c:
  case 0x5d:
  case 0x5e:
    FUN_00444f60(param_1,param_2);
    break;
  case 0x1f:
    FUN_00479f00(10,bVar1,0);
    DAT_00895d97._0_1_ = 0x20;
    break;
  case 0x20:
    FUN_00479f00(10,bVar1,1);
    break;
  case 0x28:
    cVar8 = write_gamnt_dat_ver(*(undefined4 *)(param_2 + 4),game_state.offset_counter);
    if (cVar8 == '\0') {
      _Format = u__s___s_0059cc2c;
      uVar26 = DAT_00972f38;
    }
    else {
      _Format = u__s___s_0059cc3c;
      uVar26 = DAT_00972f34;
    }
    _swprintf((wchar_t *)&local_21c,_Format,DAT_00972f78,uVar26);
    pbVar25 = &local_21c;
    uVar26 = 0x10;
    goto LAB_0044228c;
  case 0x29:
    DAT_0089ce44 = *(byte *)(param_2 + 8);
    if (4 < DAT_0089ce44) {
      level_flags_2 = level_flags_2 & 0xfffffffd;
      FUN_0041c9b0(1);
      level_flags_2 = level_flags_2 | 0x200;
    }
    cVar8 = FUN_00443260(*(undefined4 *)(param_2 + 4));
    if (cVar8 == '\0') {
      _swprintf((wchar_t *)&local_21c,u__s_00599970,DAT_00973e8c);
      clear_tribe_session(0);
    }
    else {
      land_flags_1 = land_flags_1 & 0xfffffdff;
      _swprintf((wchar_t *)&local_21c,u__s_00599970,DAT_00973e88);
    }
    write_str_to_debug_buffer(&local_21c,0x40,bVar1,0);
    mldplay_func_1();
    if (game_state._858439_1_ != '\x01') {
      FUN_00415610(0);
    }
    break;
  case 0x2a:
    puVar11 = (unit_struct *)0x0;
    DAT_00895e9c = 1;
    if (((*(ushort *)(param_2 + 8) != 0) &&
        (puVar18 = unit_land_array[*(ushort *)(param_2 + 8)], (*(byte *)&puVar18->flags_2 & 1) == 0)
        ) && (puVar18->unit_class != '\0')) {
      puVar11 = puVar18;
    }
    if (puVar11 != (unit_struct *)0x0) {
      if ((*(byte *)&puVar11->loc_1_x & 0x80) == 0) {
        cVar8 = FUN_004e3430(puVar11,1);
        if (cVar8 != '\0') {
          uVar20 = *(uint *)(param_2 + 4);
          *(byte *)&puVar11->loc_1_x = *(byte *)&puVar11->loc_1_x | 0x80;
          uVar23 = uVar20 & 4;
          if (uVar23 == 0) {
            puVar11->flags_3 = puVar11->flags_3 & 0xefffffff;
          }
          else {
            puVar11->flags_3 = puVar11->flags_3 | 0x10000000;
          }
          if ((puVar11->tribe_index == player_tribe_num) &&
             (game_state._838930_2_ != puVar11->unit_index)) {
            game_state._838940_1_ = 0;
            game_state._838943_1_ = game_state._838943_1_ & 0xfd;
            game_state._838930_2_ = puVar11->unit_index;
          }
          if (((uVar20 & 2) == 0) && (puVar11->unit_land_array_index != 0)) {
            puVar18 = unit_land_array[(ushort)puVar11->unit_land_array_index];
            puVar15 = (unit_struct *)0x0;
            if (((*(byte *)&puVar18->flags_2 & 1) == 0) && (puVar18->unit_class != '\0')) {
              puVar15 = puVar18;
            }
            if (((puVar15 != (unit_struct *)0x0) && (puVar15->field_0x9e != '\0')) &&
               (iVar19 = (int)(char)unit_type_array_vehicle[(byte)puVar15->unit_type].field_0x8,
               0 < iVar19)) {
              puVar14 = &puVar15->loc_1_x;
              do {
                puVar18 = (unit_struct *)0x0;
                if (((*puVar14 != 0) &&
                    (puVar15 = unit_land_array[*puVar14], (*(byte *)&puVar15->flags_2 & 1) == 0)) &&
                   (puVar15->unit_class != '\0')) {
                  puVar18 = puVar15;
                }
                if ((puVar18 != (unit_struct *)0x0) && (puVar18 != puVar11)) {
                  *(byte *)&puVar18->loc_1_x = *(byte *)&puVar18->loc_1_x | 0x80;
                  if (uVar23 == 0) {
                    puVar18->flags_3 = puVar18->flags_3 & 0xefffffff;
                  }
                  else {
                    puVar18->flags_3 = puVar18->flags_3 | 0x10000000;
                  }
                  if (puVar18->tribe_index == player_tribe_num) {
                    FUN_00442480(puVar18);
                  }
                }
                puVar14 = puVar14 + 1;
                iVar19 = iVar19 + -1;
              } while (iVar19 != 0);
            }
          }
          local_3b4 = 1;
          local_3c0 = puVar11;
        }
      }
      else {
        puVar11->flags_3 = puVar11->flags_3 & 0xffffff7f;
        *(byte *)&puVar11->loc_1_x = *(byte *)&puVar11->loc_1_x & 0x7f;
        if (puVar11->unit_land_array_index != 0) {
          puVar18 = unit_land_array[(ushort)puVar11->unit_land_array_index];
          puVar15 = (unit_struct *)0x0;
          if (((*(byte *)&puVar18->flags_2 & 1) == 0) && (puVar18->unit_class != '\0')) {
            puVar15 = puVar18;
          }
          if (((puVar15 != (unit_struct *)0x0) && (puVar15->field_0x9e != '\0')) &&
             (iVar19 = (int)(char)unit_type_array_vehicle[(byte)puVar15->unit_type].field_0x8,
             0 < iVar19)) {
            puVar14 = &puVar15->loc_1_x;
            do {
              puVar18 = (unit_struct *)0x0;
              if (((*puVar14 != 0) &&
                  (puVar15 = unit_land_array[*puVar14], (puVar15->flags_2 & 1) == 0)) &&
                 (puVar15->unit_class != '\0')) {
                puVar18 = puVar15;
              }
              if ((puVar18 != (unit_struct *)0x0) && (puVar18 != puVar11)) {
                puVar18->flags_3 = puVar18->flags_3 & 0xffffff7f;
                *(byte *)&puVar18->loc_1_x = *(byte *)&puVar18->loc_1_x & 0x7f;
              }
              puVar14 = puVar14 + 1;
              iVar19 = iVar19 + -1;
            } while (iVar19 != 0);
          }
        }
      }
    }
    FUN_0047a550(0xc,param_1);
    break;
  case 0x2b:
    remove_person_from_hut(unit_land_array[*(int *)(param_2 + 4)],0);
    break;
  case 0x2c:
    game_state.pseudo_random_val = 0x23cece7;
    break;
  case 0x31:
    _swprintf((wchar_t *)&local_21c,u__s_00599970,DAT_00972cac);
    write_str_to_debug_buffer(&local_21c,0x10,bVar1,0);
    add_mana(param_1,*(undefined4 *)(param_2 + 8),0);
    break;
  case 0x3f:
    DAT_00895e9c = 1;
    local_21c = (byte)*(undefined4 *)(param_2 + 8);
    bStack_21b = (byte)((uint)*(undefined4 *)(param_2 + 8) >> 8);
    local_21c = local_21c & 0xfe;
    bStack_21b = bStack_21b & 0xfe;
    local_3c8 = (local_21c + 1) * 0x100;
    sStack_3c6 = (bStack_21b + 1) * 0x100;
    uStack_3c4 = calc_point_height(CONCAT22(sStack_3c6,local_3c8),CONCAT22(uStack_3c4,sStack_3c6));
    for (iVar19 = *(int *)(param_1 + 0x881); iVar19 != 0; iVar19 = *(int *)(iVar19 + 8)) {
      if (((((*(byte *)(iVar19 + 0x7a) & 0x80) != 0) &&
           ((uint)*(byte *)(iVar19 + 0x2b) == *(uint *)(param_2 + 4))) &&
          (cVar8 = FUN_00451ac0(iVar19,&local_3c8,*(uint *)(param_1 + 0x93d) & 0x80), cVar8 != '\0')
          ) && (FUN_004e9b40(iVar19), (*(uint *)(iVar19 + 0xc) & 0x100000) == 0)) {
        *(undefined1 *)(iVar19 + 0x7d) = *(undefined1 *)(iVar19 + 0x2c);
        if ((game_state._4_4_ & 2) == 0) {
          bVar1 = *(byte *)(iVar19 + 0x2b);
LAB_0043f334:
          uVar16 = unit_type_array_person[bVar1].next_state;
        }
        else {
          bVar1 = *(byte *)(iVar19 + 0x2b);
          if (bVar1 != 7) goto LAB_0043f334;
          uVar16 = 0x27;
        }
        empty_unit_function(iVar19);
        *(undefined1 *)(iVar19 + 0x2c) = uVar16;
        init_unit_class(iVar19);
      }
    }
    break;
  case 0x40:
    puVar11 = (unit_struct *)0x0;
    if (((*(ushort *)(param_2 + 8) != 0) &&
        (puVar18 = unit_land_array[*(ushort *)(param_2 + 8)], (*(byte *)&puVar18->flags_2 & 1) == 0)
        ) && (puVar18->unit_class != '\0')) {
      puVar11 = puVar18;
    }
    if (((puVar11 != (unit_struct *)0x0) &&
        (FUN_0040a0c0(puVar11,*(undefined4 *)(param_2 + 4)), *(int *)(param_2 + 4) != 0)) &&
       (puVar11->tribe_index == player_tribe_num)) {
      FUN_00499d90(0x2000,0x252);
    }
    break;
  case 0x41:
    _swprintf((wchar_t *)&local_21c,u__s_00599970,DAT_00972cbc);
    write_str_to_debug_buffer(&local_21c,0x10,bVar1,0);
    *(uint *)(param_1 + 0x93d) = *(uint *)(param_1 + 0x93d) | 8;
    break;
  case 0x43:
    puVar11 = (unit_struct *)0x0;
    if (((*(ushort *)(param_2 + 8) != 0) &&
        (puVar18 = unit_land_array[*(ushort *)(param_2 + 8)], (*(byte *)&puVar18->flags_2 & 1) == 0)
        ) && (puVar18->unit_class != '\0')) {
      puVar11 = puVar18;
    }
    remove_person_from_hut(unit_land_array[*(int *)(param_2 + 4)],puVar11);
    break;
  case 0x44:
    _swprintf((wchar_t *)&local_21c,u__s_00599970,DAT_00972cc0);
    iVar19 = 1;
    psVar21 = &DAT_005a810e;
    write_str_to_debug_buffer(&local_21c,0x10,bVar1,0);
    do {
      if (*psVar21 == 1) {
        set_struct_56B_field_0_spell(iVar19,bVar1);
      }
      psVar21 = psVar21 + 0x1f;
      iVar19 = iVar19 + 1;
    } while (psVar21 < (short *)0x5a85e7);
    break;
  case 0x45:
    _swprintf((wchar_t *)&local_21c,u__s_00599970,DAT_00972cc4);
    write_str_to_debug_buffer(&local_21c,0x10,bVar1,0);
    iVar19 = 1;
    do {
      iVar24 = iVar19 + 1;
      struct_56B_set_field_4(iVar19,bVar1);
      iVar19 = iVar24;
    } while (iVar24 < 0x14);
    break;
  case 0x46:
    bVar1 = *(byte *)(param_2 + 4);
    for (iVar19 = *(int *)(param_1 + 0x881); iVar19 != 0; iVar19 = *(int *)(iVar19 + 8)) {
      bVar7 = *(byte *)(iVar19 + 0x7a);
      bVar13 = (byte)(1 << (bVar1 & 0x1f));
      if ((bVar7 & 0x80) == 0) {
        bVar13 = ~bVar13 & bVar7;
      }
      else {
        bVar13 = bVar13 | bVar7 | 1;
        *(byte *)(iVar19 + 0x7a) = bVar7 | 1;
      }
      *(byte *)(iVar19 + 0x7a) = bVar13;
    }
    break;
  case 0x47:
    bVar3 = false;
    local_3b0 = *(unit_struct **)(param_1 + 0x881);
    local_25c[0] = 0;
    iVar19 = 1 << (*(byte *)(param_2 + 4) & 0x1f);
    local_35c = (byte)iVar19;
    bStack_35b = (byte)((uint)iVar19 >> 8);
    uStack_35a = (ushort)((uint)iVar19 >> 0x10);
    for (; local_3b0 != (unit_struct *)0x0; local_3b0 = local_3b0->next_unit) {
      if (((local_35c & *(byte *)&local_3b0->loc_1_x) != 0) &&
         (cVar8 = FUN_004e3430(local_3b0,1), cVar8 != '\0')) {
        if ((!bVar3) && (bVar3 = true, *(int *)(param_2 + 8) != 0)) {
          for (puVar11 = *(unit_struct **)(param_1 + 0x881); puVar11 != (unit_struct *)0x0;
              puVar11 = puVar11->next_unit) {
            FUN_004458d0(puVar11,0,0);
            if (puVar11->unit_land_array_index != 0) {
              puVar18 = unit_land_array[(ushort)puVar11->unit_land_array_index];
              puVar15 = (unit_struct *)0x0;
              if (((puVar18->flags_2 & 1) == 0) && (puVar18->unit_class != '\0')) {
                puVar15 = puVar18;
              }
              if (((puVar15 != (unit_struct *)0x0) && (puVar15->field_0x9e != '\0')) &&
                 (iVar19 = (int)(char)unit_type_array_vehicle[(byte)puVar15->unit_type].field_0x8,
                 0 < iVar19)) {
                puVar14 = &puVar15->loc_1_x;
                do {
                  puVar18 = (unit_struct *)0x0;
                  if (((*puVar14 != 0) &&
                      (puVar15 = unit_land_array[*puVar14], (puVar15->flags_2 & 1) == 0)) &&
                     (puVar15->unit_class != '\0')) {
                    puVar18 = puVar15;
                  }
                  if ((puVar18 != (unit_struct *)0x0) && (puVar11 != puVar18)) {
                    FUN_004458d0(puVar18,0,0);
                  }
                  puVar14 = puVar14 + 1;
                  iVar19 = iVar19 + -1;
                } while (iVar19 != 0);
              }
            }
          }
        }
        FUN_004458d0(local_3b0,1,0);
        if (local_3b0->unit_land_array_index != 0) {
          puVar11 = unit_land_array[(ushort)local_3b0->unit_land_array_index];
          puVar18 = (unit_struct *)0x0;
          if (((*(byte *)&puVar11->flags_2 & 1) == 0) && (puVar11->unit_class != '\0')) {
            puVar18 = puVar11;
          }
          if (((puVar18 != (unit_struct *)0x0) && (puVar18->field_0x9e != '\0')) &&
             (iVar19 = (int)(char)unit_type_array_vehicle[(byte)puVar18->unit_type].field_0x8,
             0 < iVar19)) {
            puVar14 = &puVar18->loc_1_x;
            do {
              puVar11 = (unit_struct *)0x0;
              if (((*puVar14 != 0) &&
                  (puVar18 = unit_land_array[*puVar14], (puVar18->flags_2 & 1) == 0)) &&
                 (puVar18->unit_class != '\0')) {
                puVar11 = puVar18;
              }
              if ((puVar11 != (unit_struct *)0x0) && (local_3b0 != puVar11)) {
                FUN_004458d0(puVar11,1,0);
              }
              puVar14 = puVar14 + 1;
              iVar19 = iVar19 + -1;
            } while (iVar19 != 0);
          }
        }
        local_25c[0] = local_25c[0] + 1;
        local_3c0 = local_3b0;
      }
    }
    if ((local_25c[0] != 0) && ((int)player_tribe_num == (uint)bVar1)) {
      FUN_0047a550(0xc,param_1);
    }
    break;
  case 0x48:
    if ((*(int *)(param_2 + 4) == 0) && ((*(byte *)(param_1 + 0x93d) & 0x80) != 0)) {
      *(undefined4 *)(param_2 + 4) = 1;
    }
    iVar19 = *(int *)(param_2 + 4);
    if (iVar19 == 0) {
      puVar11 = *(unit_struct **)(param_1 + 0x881);
      local_25c[0] = 0;
      for (; puVar11 != (unit_struct *)0x0; puVar11 = puVar11->next_unit) {
        if ((puVar11->unit_type != '\a') && (cVar8 = FUN_004e3430(puVar11,1), cVar8 != '\0')) {
          FUN_004458d0(puVar11,1,0);
          if (puVar11->unit_land_array_index != 0) {
            puVar18 = unit_land_array[(ushort)puVar11->unit_land_array_index];
            puVar15 = (unit_struct *)0x0;
            if (((puVar18->flags_2 & 1) == 0) && (puVar18->unit_class != '\0')) {
              puVar15 = puVar18;
            }
            if (((puVar15 != (unit_struct *)0x0) && (puVar15->field_0x9e != '\0')) &&
               (iVar19 = (int)(char)unit_type_array_vehicle[(byte)puVar15->unit_type].field_0x8,
               0 < iVar19)) {
              puVar14 = &puVar15->loc_1_x;
              do {
                puVar18 = (unit_struct *)0x0;
                if (((*puVar14 != 0) &&
                    (puVar15 = unit_land_array[*puVar14], (puVar15->flags_2 & 1) == 0)) &&
                   (puVar15->unit_class != '\0')) {
                  puVar18 = puVar15;
                }
                if ((puVar18 != (unit_struct *)0x0) && (puVar18 != puVar11)) {
                  FUN_004458d0(puVar18,1,0);
                }
                puVar14 = puVar14 + 1;
                iVar19 = iVar19 + -1;
              } while (iVar19 != 0);
            }
          }
          local_25c[0] = local_25c[0] + 1;
          local_3c0 = puVar11;
        }
      }
    }
    else if (iVar19 == 1) {
      puVar11 = *(unit_struct **)(param_1 + 0x881);
      local_25c[0] = 0;
      local_21c = (byte)*(undefined4 *)(param_2 + 8);
      bStack_21b = (byte)((uint)*(undefined4 *)(param_2 + 8) >> 8);
      local_21c = local_21c & 0xfe;
      bStack_21b = bStack_21b & 0xfe;
      local_3b8 = CONCAT22((bStack_21b + 1) * 0x100,(local_21c + 1) * 0x100);
      for (; puVar11 != (unit_struct *)0x0; puVar11 = puVar11->next_unit) {
        iVar19 = calc_squared_distance_toroidal(&puVar11->pos,&local_3b8);
        if (((iVar19 < 0x2400000) && (puVar11->unit_type != '\a')) &&
           (cVar8 = FUN_004e3430(puVar11,1), cVar8 != '\0')) {
          FUN_004458d0(puVar11,1,0);
          if (((puVar11->unit_land_array_index != 0) &&
              (iVar19 = FUN_004077e0(CONCAT22(extraout_var,puVar11->unit_land_array_index)),
              iVar19 != 0)) &&
             ((*(char *)(iVar19 + 0x9e) != '\0' &&
              (iVar24 = (int)(char)unit_type_array_vehicle[*(byte *)(iVar19 + 0x2b)].field_0x8,
              0 < iVar24)))) {
            puVar17 = (undefined2 *)(iVar19 + 0x7a);
            do {
              puVar18 = (unit_struct *)FUN_004077e0(*puVar17);
              if ((puVar18 != (unit_struct *)0x0) && (puVar11 != puVar18)) {
                FUN_004458d0(puVar18,1,0);
              }
              puVar17 = puVar17 + 1;
              iVar24 = iVar24 + -1;
            } while (iVar24 != 0);
          }
          local_25c[0] = local_25c[0] + 1;
          local_3c0 = puVar11;
        }
      }
    }
    else if (iVar19 == 2) {
      puVar11 = *(unit_struct **)(param_1 + 0x881);
      local_25c[0] = 0;
      local_21c = (byte)*(undefined4 *)(param_2 + 8);
      bStack_21b = (byte)((uint)*(undefined4 *)(param_2 + 8) >> 8);
      local_21c = local_21c & 0xfe;
      bStack_21b = bStack_21b & 0xfe;
      local_3b8 = CONCAT22((bStack_21b + 1) * 0x100,(local_21c + 1) * 0x100);
      for (; puVar11 != (unit_struct *)0x0; puVar11 = puVar11->next_unit) {
        if (((((*(uint *)&unit_type_related_1_ARRAY_005a6f78[(byte)puVar11->state].field_0x1 & 8) !=
               0) && ((puVar11->flags_2 & 0x800000) == 0)) &&
            (iVar19 = calc_squared_distance_toroidal(&puVar11->pos,&local_3b8), iVar19 < 0x2400000))
           && ((puVar11->unit_type != '\a' && (cVar8 = FUN_004e3430(puVar11,1), cVar8 != '\0')))) {
          FUN_00445750(puVar11,1,0);
          local_25c[0] = local_25c[0] + 1;
          local_3c0 = puVar11;
        }
      }
    }
    if ((local_25c[0] != 0) && ((int)player_tribe_num == (uint)bVar1)) {
      FUN_0047a550(0xc,param_1);
    }
    break;
  case 0x49:
    if (((bVar1 == 0xff) || (bVar7 = *(byte *)(param_2 + 4), bVar7 == 0xff)) || (bVar7 == bVar1)) {
      bVar7 = 1;
    }
    else {
      bVar7 = *(byte *)((int)game_state.start_n1 + (char)bVar1 + 0x9c) & '\x01' << (bVar7 & 0x1f);
    }
    if (bVar7 == 0) {
      set_tribe_flag_1(bVar1,*(undefined4 *)(param_2 + 4));
    }
    else {
      reset_tribe_flag_1();
    }
    break;
  case 0x4a:
    next_level(*(undefined4 *)(param_2 + 4));
    break;
  case 0x4e:
    puVar11 = (unit_struct *)0x0;
    if (((*(ushort *)(param_2 + 8) != 0) &&
        (puVar18 = unit_land_array[*(ushort *)(param_2 + 8)], (*(byte *)&puVar18->flags_2 & 1) == 0)
        ) && (puVar18->unit_class != '\0')) {
      puVar11 = puVar18;
    }
    if (puVar11 != (unit_struct *)0x0) {
      FUN_004de7f0(puVar11);
    }
    break;
  case 0x4f:
  case 0x50:
  case 0x51:
    local_3b8 = *(undefined4 *)(param_2 + 8);
    local_3bc = local_3b8;
    if (*(char *)(param_1 + 0xc5e) == '\0') {
      local_3c8 = (short)local_3b8;
      local_3bc._2_2_ = (short)((uint)local_3b8 >> 0x10);
      sStack_3c6 = local_3bc._2_2_;
      uVar26 = CONCAT22(uStack_3c4,local_3bc._2_2_);
      uStack_3c4 = calc_point_height(local_3b8,uVar26);
      uVar26 = *(undefined4 *)(param_2 + 4);
      local_35c = (byte)uVar26;
      bStack_35b = (byte)((uint)uVar26 >> 8);
      uStack_35a = (ushort)((uint)uVar26 >> 0x10);
      bVar3 = true;
      *(short *)(param_1 + 0xa09) = (short)uVar26;
      uVar23 = (uint)uStack_35a;
      uVar20 = (uint)(uStack_35a >> 0xb);
      if (((*(char *)(param_2 + 0xc) == 'Q') && (*(char *)(param_1 + 0xc1f) == '\x02')) &&
         (iVar19 = struct_56B_get_spell_array_val(bVar1,uVar20), iVar19 < 1)) {
        bVar3 = false;
      }
      if (bVar3) {
        uVar26 = 0;
        if (*(char *)(param_2 + 0xc) != 'Q') {
          uVar26 = *(undefined4 *)((int)&DAT_005a80d4 + uVar20 * 0x3e);
        }
        ptr_unit_related_20B->field0_0x0 = uVar26;
        ptr_unit_related_20B->field1_0x4 = uVar23 & 0x7ff;
        ptr_unit_related_20B->unit_ptr = (unit_struct *)0x0;
        ptr_unit_related_20B->field3_0xc = 0;
        ptr_unit_related_20B->field4_0x10 = 0;
        ptr_unit_related_20B = ptr_unit_related_20B + 1;
        unit_allocation_flag = 1;
        alloc_unit(0xb,uVar20,bVar1,&local_3c8);
        if ((*(char *)(param_2 + 0xc) == 'Q') &&
           (iVar19 = struct_56B_get_spell_array_val(bVar1,uVar20), iVar19 != 0)) {
          set_struct_56B_array_spell_val(bVar1,uVar20,iVar19 + -1);
          struct_56B_spell_dec(bVar1,uVar20);
        }
      }
    }
    break;
  case 0x53:
    DAT_00895e9c = 1;
    local_21c = (byte)*(undefined4 *)(param_2 + 8);
    bStack_21b = (byte)((uint)*(undefined4 *)(param_2 + 8) >> 8);
    local_21c = local_21c & 0xfe;
    bStack_21b = bStack_21b & 0xfe;
    local_3c8 = (local_21c + 1) * 0x100;
    sStack_3c6 = (bStack_21b + 1) * 0x100;
    uStack_3c4 = calc_point_height(CONCAT22(sStack_3c6,local_3c8),CONCAT22(uStack_3c4,sStack_3c6));
    uVar26 = *(undefined4 *)(param_2 + 4);
    local_35c = (byte)((uint)uVar26 >> 0x10);
    bStack_35b = (byte)((uint)uVar26 >> 0x18);
    uStack_35a = (ushort)((int)uVar26 >> 0x1f);
    for (puVar11 = *(unit_struct **)(param_1 + 0x881); puVar11 != (unit_struct *)0x0;
        puVar11 = puVar11->next_unit) {
      puVar18 = local_3c0;
      if ((((uint)(byte)puVar11->unit_type == CONCAT22(uStack_35a,CONCAT11(bStack_35b,local_35c)))
          && (cVar8 = FUN_00451ac0(puVar11,&local_3c8,*(uint *)(param_1 + 0x93d) & 0x80),
             puVar18 = local_3c0, cVar8 != '\0')) &&
         (cVar8 = FUN_004e3430(puVar11,1), puVar18 = local_3c0, cVar8 != '\0')) {
        *(byte *)&puVar11->loc_1_x = *(byte *)&puVar11->loc_1_x | 0x80;
        puVar11->flags_3 = puVar11->flags_3 & 0xefffffff;
        if (puVar11->tribe_index == player_tribe_num) {
          FUN_00442480(puVar11);
        }
        puVar18 = puVar11;
        if (puVar11->unit_land_array_index != 0) {
          puVar15 = unit_land_array[(ushort)puVar11->unit_land_array_index];
          puVar22 = (unit_struct *)0x0;
          if (((*(byte *)&puVar15->flags_2 & 1) == 0) && (puVar15->unit_class != '\0')) {
            puVar22 = puVar15;
          }
          if (((puVar22 != (unit_struct *)0x0) && (puVar22->field_0x9e != '\0')) &&
             (iVar19 = (int)(char)unit_type_array_vehicle[(byte)puVar22->unit_type].field_0x8,
             0 < iVar19)) {
            puVar14 = &puVar22->loc_1_x;
            do {
              puVar15 = (unit_struct *)0x0;
              if (((*puVar14 != 0) &&
                  (puVar22 = unit_land_array[*puVar14], (*(byte *)&puVar22->flags_2 & 1) == 0)) &&
                 (puVar22->unit_class != '\0')) {
                puVar15 = puVar22;
              }
              if ((puVar15 != (unit_struct *)0x0) && (puVar11 != puVar15)) {
                FUN_004458d0(puVar15,1,0);
              }
              puVar14 = puVar14 + 1;
              iVar19 = iVar19 + -1;
            } while (iVar19 != 0);
          }
        }
      }
      local_3c0 = puVar18;
    }
    FUN_0047a550(0xc,param_1);
    break;
  case 0x54:
    DAT_00895e9c = 1;
    local_21c = (byte)*(undefined4 *)(param_2 + 8);
    bStack_21b = (byte)((uint)*(undefined4 *)(param_2 + 8) >> 8);
    local_21c = local_21c & 0xfe;
    bStack_21b = bStack_21b & 0xfe;
    local_3c8 = (local_21c + 1) * 0x100;
    sStack_3c6 = (bStack_21b + 1) * 0x100;
    uStack_3c4 = calc_point_height(CONCAT22(sStack_3c6,local_3c8),CONCAT22(uStack_3c4,sStack_3c6));
    local_3b0 = (unit_struct *)(*(uint *)(param_2 + 4) & 0xffff);
    puVar11 = *(unit_struct **)(param_1 + 0x881);
    if (local_3b0 == (unit_struct *)0x1) {
      for (; puVar11 != (unit_struct *)0x0; puVar11 = puVar11->next_unit) {
        if (((puVar11->unit_type != '\a') && ((*(byte *)&puVar11->loc_1_x & 0x80) != 0)) &&
           (cVar8 = FUN_00451ac0(puVar11,&local_3c8,*(uint *)(param_1 + 0x93d) & 0x80),
           cVar8 != '\0')) {
          puVar11->flags_3 = puVar11->flags_3 & 0xffffff7f;
          *(byte *)&puVar11->loc_1_x = *(byte *)&puVar11->loc_1_x & 0x7f;
          if (puVar11->unit_land_array_index != 0) {
            puVar18 = unit_land_array[(ushort)puVar11->unit_land_array_index];
            puVar15 = (unit_struct *)0x0;
            if (((puVar18->flags_2 & 1) == 0) && (puVar18->unit_class != '\0')) {
              puVar15 = puVar18;
            }
            if (((puVar15 != (unit_struct *)0x0) && (puVar15->field_0x9e != '\0')) &&
               (iVar19 = (int)(char)unit_type_array_vehicle[(byte)puVar15->unit_type].field_0x8,
               0 < iVar19)) {
              puVar14 = &puVar15->loc_1_x;
              do {
                puVar18 = (unit_struct *)0x0;
                if (((*puVar14 != 0) &&
                    (puVar15 = unit_land_array[*puVar14], (puVar15->flags_2 & 1) == 0)) &&
                   (puVar15->unit_class != '\0')) {
                  puVar18 = puVar15;
                }
                if ((puVar18 != (unit_struct *)0x0) && (puVar11 != puVar18)) {
                  FUN_004458d0(puVar18,0,0);
                }
                puVar14 = puVar14 + 1;
                iVar19 = iVar19 + -1;
              } while (iVar19 != 0);
            }
          }
        }
      }
    }
    else {
      for (; puVar11 != (unit_struct *)0x0; puVar11 = puVar11->next_unit) {
        puVar18 = local_3c0;
        if ((((puVar11->unit_type != '\a') &&
             (puVar15 = (unit_struct *)FUN_004513e0(puVar11), puVar18 = local_3c0,
             puVar15 == local_3b0)) &&
            (cVar8 = FUN_00451ac0(puVar11,&local_3c8,*(uint *)(param_1 + 0x93d) & 0x80),
            puVar18 = local_3c0, cVar8 != '\0')) &&
           (cVar8 = FUN_004e3430(puVar11,1), puVar18 = local_3c0, cVar8 != '\0')) {
          *(byte *)&puVar11->loc_1_x = *(byte *)&puVar11->loc_1_x | 0x80;
          puVar11->flags_3 = puVar11->flags_3 & 0xefffffff;
          if (puVar11->tribe_index == player_tribe_num) {
            FUN_00442480(puVar11);
          }
          puVar18 = puVar11;
          if (puVar11->unit_land_array_index != 0) {
            puVar15 = unit_land_array[(ushort)puVar11->unit_land_array_index];
            puVar22 = (unit_struct *)0x0;
            if (((*(byte *)&puVar15->flags_2 & 1) == 0) && (puVar15->unit_class != '\0')) {
              puVar22 = puVar15;
            }
            if (((puVar22 != (unit_struct *)0x0) && (puVar22->field_0x9e != '\0')) &&
               (iVar19 = (int)(char)unit_type_array_vehicle[(byte)puVar22->unit_type].field_0x8,
               0 < iVar19)) {
              puVar14 = &puVar22->loc_1_x;
              do {
                puVar15 = (unit_struct *)0x0;
                if (((*puVar14 != 0) &&
                    (puVar22 = unit_land_array[*puVar14], (*(byte *)&puVar22->flags_2 & 1) == 0)) &&
                   (puVar22->unit_class != '\0')) {
                  puVar15 = puVar22;
                }
                if ((puVar15 != (unit_struct *)0x0) && (puVar11 != puVar15)) {
                  FUN_004458d0(puVar15,1,0);
                }
                puVar14 = puVar14 + 1;
                iVar19 = iVar19 + -1;
              } while (iVar19 != 0);
            }
          }
        }
        local_3c0 = puVar18;
      }
    }
    FUN_0047a550(0xc,param_1);
    break;
  case 0x55:
    DAT_00895e9c = 1;
    local_21c = (byte)*(undefined4 *)(param_2 + 8);
    bStack_21b = (byte)((uint)*(undefined4 *)(param_2 + 8) >> 8);
    local_21c = local_21c & 0xfe;
    bStack_21b = bStack_21b & 0xfe;
    local_3c8 = (local_21c + 1) * 0x100;
    sStack_3c6 = (bStack_21b + 1) * 0x100;
    uStack_3c4 = calc_point_height(CONCAT22(sStack_3c6,local_3c8),CONCAT22(uStack_3c4,sStack_3c6));
    uVar20 = *(uint *)(param_2 + 4);
    local_3b0 = (unit_struct *)(uVar20 & 0xffff);
    local_35c = (byte)(uVar20 >> 0x10);
    bStack_35b = (byte)(uVar20 >> 0x18);
    uStack_35a = (ushort)((int)uVar20 >> 0x1f);
    puVar11 = *(unit_struct **)(param_1 + 0x881);
    if (local_3b0 == (unit_struct *)0x1) {
      for (; puVar11 != (unit_struct *)0x0; puVar11 = puVar11->next_unit) {
        if ((((uint)(byte)puVar11->unit_type == CONCAT22(uStack_35a,CONCAT11(bStack_35b,local_35c)))
            && (cVar8 = FUN_00451ac0(puVar11,&local_3c8,*(uint *)(param_1 + 0x93d) & 0x80),
               cVar8 != '\0')) && ((*(byte *)&puVar11->loc_1_x & 0x80) != 0)) {
          puVar11->flags_3 = puVar11->flags_3 & 0xffffff7f;
          *(byte *)&puVar11->loc_1_x = *(byte *)&puVar11->loc_1_x & 0x7f;
          if (puVar11->unit_land_array_index != 0) {
            puVar18 = unit_land_array[(ushort)puVar11->unit_land_array_index];
            puVar15 = (unit_struct *)0x0;
            if (((puVar18->flags_2 & 1) == 0) && (puVar18->unit_class != '\0')) {
              puVar15 = puVar18;
            }
            if (((puVar15 != (unit_struct *)0x0) && (puVar15->field_0x9e != '\0')) &&
               (iVar19 = (int)(char)unit_type_array_vehicle[(byte)puVar15->unit_type].field_0x8,
               0 < iVar19)) {
              puVar14 = &puVar15->loc_1_x;
              do {
                puVar18 = (unit_struct *)0x0;
                if (((*puVar14 != 0) &&
                    (puVar15 = unit_land_array[*puVar14], (puVar15->flags_2 & 1) == 0)) &&
                   (puVar15->unit_class != '\0')) {
                  puVar18 = puVar15;
                }
                if ((puVar18 != (unit_struct *)0x0) && (puVar18 != puVar11)) {
                  FUN_004458d0(puVar18,0,0);
                }
                puVar14 = puVar14 + 1;
                iVar19 = iVar19 + -1;
              } while (iVar19 != 0);
            }
          }
        }
      }
    }
    else {
      for (; puVar11 != (unit_struct *)0x0; puVar11 = puVar11->next_unit) {
        puVar18 = local_3c0;
        if (((((uint)(byte)puVar11->unit_type == CONCAT22(uStack_35a,CONCAT11(bStack_35b,local_35c))
              ) && (puVar15 = (unit_struct *)FUN_004513e0(puVar11), puVar18 = local_3c0,
                   puVar15 == local_3b0)) &&
            (cVar8 = FUN_00451ac0(puVar11,&local_3c8,*(uint *)(param_1 + 0x93d) & 0x80),
            puVar18 = local_3c0, cVar8 != '\0')) &&
           (cVar8 = FUN_004e3430(puVar11,1), puVar18 = local_3c0, cVar8 != '\0')) {
          *(byte *)&puVar11->loc_1_x = *(byte *)&puVar11->loc_1_x | 0x80;
          puVar11->flags_3 = puVar11->flags_3 & 0xefffffff;
          if (puVar11->tribe_index == player_tribe_num) {
            FUN_00442480(puVar11);
          }
          puVar18 = puVar11;
          if (puVar11->unit_land_array_index != 0) {
            puVar15 = unit_land_array[(ushort)puVar11->unit_land_array_index];
            puVar22 = (unit_struct *)0x0;
            if (((*(byte *)&puVar15->flags_2 & 1) == 0) && (puVar15->unit_class != '\0')) {
              puVar22 = puVar15;
            }
            if (((puVar22 != (unit_struct *)0x0) && (puVar22->field_0x9e != '\0')) &&
               (iVar19 = (int)(char)unit_type_array_vehicle[(byte)puVar22->unit_type].field_0x8,
               0 < iVar19)) {
              puVar14 = &puVar22->loc_1_x;
              do {
                puVar15 = (unit_struct *)0x0;
                if (((*puVar14 != 0) &&
                    (puVar22 = unit_land_array[*puVar14], (*(byte *)&puVar22->flags_2 & 1) == 0)) &&
                   (puVar22->unit_class != '\0')) {
                  puVar15 = puVar22;
                }
                if ((puVar15 != (unit_struct *)0x0) && (puVar15 != puVar11)) {
                  FUN_004458d0(puVar15,1,0);
                }
                puVar14 = puVar14 + 1;
                iVar19 = iVar19 + -1;
              } while (iVar19 != 0);
            }
          }
        }
        local_3c0 = puVar18;
      }
    }
    FUN_0047a550(0xc,param_1);
    break;
  case 0x56:
    if (*(int *)(param_2 + 8) == 0) {
      struct_56B_set_field_16(bVar1,*(undefined4 *)(param_2 + 4));
    }
    else {
      FUN_004c2be0(bVar1,*(undefined4 *)(param_2 + 4));
    }
    *(uint *)(param_1 + 0x9e9) = *(uint *)(param_1 + 0x9e9) & 0xfffffffe;
    break;
  case 0x5f:
    if (*(int *)(param_2 + 4) == 0) {
      *(uint *)(param_1 + 0x93d) = *(uint *)(param_1 + 0x93d) & 0xffffff7f;
    }
    else {
      *(uint *)(param_1 + 0x93d) = *(uint *)(param_1 + 0x93d) | 0x80;
    }
    break;
  case 0x60:
    puVar11 = (unit_struct *)0x0;
    if (((*(ushort *)(param_2 + 4) != 0) &&
        (puVar18 = unit_land_array[*(ushort *)(param_2 + 4)], (*(byte *)&puVar18->flags_2 & 1) == 0)
        ) && (puVar18->unit_class != '\0')) {
      puVar11 = puVar18;
    }
    if (puVar11 != (unit_struct *)0x0) {
      if (*(int *)(param_2 + 8) == 0) {
        iVar19 = 1;
      }
      else {
        iVar19 = (int)(char)unit_type_array_vehicle[(byte)puVar11->unit_type].field_0x8;
      }
      if (0 < iVar19) {
        do {
          if (puVar11->field_0x9e != '\0') {
            puVar18 = (unit_struct *)0x0;
            if (((puVar11->loc_1_x != 0) &&
                (puVar15 = unit_land_array[(ushort)puVar11->loc_1_x],
                (*(byte *)&puVar15->flags_2 & 1) == 0)) && (puVar15->unit_class != '\0')) {
              puVar18 = puVar15;
            }
            if (puVar18 != (unit_struct *)0x0) {
              *(undefined2 *)&puVar18->field_0xa1 = 0;
              FUN_00436ca0(puVar18);
              FUN_00466c80(puVar18,0);
            }
          }
          iVar19 = iVar19 + -1;
        } while (iVar19 != 0);
      }
    }
    break;
  case 0x61:
  case 0x67:
    puVar11 = (unit_struct *)0x0;
    if (((*(ushort *)(param_2 + 8) != 0) &&
        (puVar18 = unit_land_array[*(ushort *)(param_2 + 8)], (*(byte *)&puVar18->flags_2 & 1) == 0)
        ) && (puVar18->unit_class != '\0')) {
      puVar11 = puVar18;
    }
    if (puVar11 != (unit_struct *)0x0) {
      iVar19 = 0;
      cVar8 = puVar11->unit_class;
      if (cVar8 == '\x02') {
        iVar19 = 6;
        local_3b0 = (unit_struct *)&puVar11->loc_3_x;
      }
      else if (cVar8 == '\x04') {
        iVar19 = (int)(char)puVar11->field_0x9e;
        local_3b0 = (unit_struct *)&puVar11->loc_1_x;
      }
      else if (cVar8 == '\t') {
        iVar19 = 0x14;
        local_3b0 = (unit_struct *)((int)&puVar11->coord_scale_4 + 2);
      }
      if (0 < iVar19) {
        local_35c = (byte)iVar19;
        bStack_35b = (byte)((uint)iVar19 >> 8);
        uStack_35a = (ushort)((uint)iVar19 >> 0x10);
        do {
          puVar11 = (unit_struct *)0x0;
          if (((*(ushort *)&local_3b0->prev_unit != 0) &&
              (puVar18 = unit_land_array[*(ushort *)&local_3b0->prev_unit],
              (*(byte *)&puVar18->flags_2 & 1) == 0)) && (puVar18->unit_class != '\0')) {
            puVar11 = puVar18;
          }
          puVar18 = local_3c0;
          if (puVar11 != (unit_struct *)0x0) {
            if (*(int *)(param_2 + 4) == 0) {
              puVar11->flags_3 = puVar11->flags_3 & 0xffffff7f;
              *(byte *)&puVar11->loc_1_x = *(byte *)&puVar11->loc_1_x & 0x7f;
              if (puVar11->unit_land_array_index != 0) {
                puVar15 = unit_land_array[(ushort)puVar11->unit_land_array_index];
                puVar22 = (unit_struct *)0x0;
                if (((*(byte *)&puVar15->flags_2 & 1) == 0) && (puVar15->unit_class != '\0')) {
                  puVar22 = puVar15;
                }
                if (((puVar22 != (unit_struct *)0x0) && (puVar22->field_0x9e != '\0')) &&
                   (iVar19 = (int)(char)unit_type_array_vehicle[(byte)puVar22->unit_type].field_0x8,
                   0 < iVar19)) {
                  puVar14 = &puVar22->loc_1_x;
                  do {
                    puVar18 = (unit_struct *)0x0;
                    if (((*puVar14 != 0) &&
                        (puVar15 = unit_land_array[*puVar14], (*(byte *)&puVar15->flags_2 & 1) == 0)
                        ) && (puVar15->unit_class != '\0')) {
                      puVar18 = puVar15;
                    }
                    if ((puVar18 != (unit_struct *)0x0) && (puVar18 != puVar11)) {
                      FUN_004458d0(puVar18,0,0);
                    }
                    puVar14 = puVar14 + 1;
                    iVar19 = iVar19 + -1;
                    puVar18 = local_3c0;
                  } while (iVar19 != 0);
                }
              }
            }
            else {
              cVar8 = FUN_004e3430(puVar11,1);
              puVar18 = local_3c0;
              if (cVar8 != '\0') {
                *(byte *)&puVar11->loc_1_x = *(byte *)&puVar11->loc_1_x | 0x80;
                puVar11->flags_3 = puVar11->flags_3 & 0xefffffff;
                if ((puVar11->tribe_index == player_tribe_num) &&
                   (game_state._838930_2_ != puVar11->unit_index)) {
                  game_state._838940_1_ = 0;
                  game_state._838943_1_ = game_state._838943_1_ & 0xfd;
                  game_state._838930_2_ = puVar11->unit_index;
                }
                puVar18 = puVar11;
                if (puVar11->unit_land_array_index != 0) {
                  puVar15 = unit_land_array[(ushort)puVar11->unit_land_array_index];
                  puVar22 = (unit_struct *)0x0;
                  if (((*(byte *)&puVar15->flags_2 & 1) == 0) && (puVar15->unit_class != '\0')) {
                    puVar22 = puVar15;
                  }
                  if (((puVar22 != (unit_struct *)0x0) && (puVar22->field_0x9e != '\0')) &&
                     (iVar19 = (int)(char)unit_type_array_vehicle[(byte)puVar22->unit_type].
                                          field_0x8, 0 < iVar19)) {
                    puVar14 = &puVar22->loc_1_x;
                    do {
                      puVar15 = (unit_struct *)0x0;
                      if (((*puVar14 != 0) &&
                          (puVar22 = unit_land_array[*puVar14],
                          (*(byte *)&puVar22->flags_2 & 1) == 0)) && (puVar22->unit_class != '\0'))
                      {
                        puVar15 = puVar22;
                      }
                      if ((puVar15 != (unit_struct *)0x0) && (puVar15 != puVar11)) {
                        FUN_004458d0(puVar15,1,0);
                      }
                      puVar14 = puVar14 + 1;
                      iVar19 = iVar19 + -1;
                    } while (iVar19 != 0);
                  }
                }
              }
            }
          }
          local_3c0 = puVar18;
          local_3b0 = (unit_struct *)((int)&local_3b0->prev_unit + 2);
          iVar19 = CONCAT22(uStack_35a,CONCAT11(bStack_35b,local_35c)) + -1;
          local_35c = (byte)iVar19;
          bStack_35b = (byte)((uint)iVar19 >> 8);
          uStack_35a = (ushort)((uint)iVar19 >> 0x10);
        } while (iVar19 != 0);
      }
      FUN_0047a550(0xc,param_1);
    }
    break;
  case 0x62:
    puVar11 = *(unit_struct **)(param_2 + 8);
    local_3b0 = puVar11;
    cVar8 = FUN_004b98f0(puVar11,bVar1,1);
    if (cVar8 != '\0') {
      FUN_004ba9b0(param_1,1,0,local_3b0);
    }
    for (puVar18 = unit_land_array
                   [(short)(&game_state.level_data[0].unit_index)
                           [(((uint)local_3b0 & 0xfe) * 2 | (uint)local_3b0 & 0xfe00) * 2]];
        puVar18 != (unit_struct *)0x0; puVar18 = unit_land_array[puVar18->next_unit_index]) {
      if ((((puVar18->unit_class == '\x01') && ((int)(char)puVar18->tribe_index == (uint)bVar1)) &&
          ((*(byte *)&puVar18->loc_1_x & 0x80) == 0)) &&
         (((*(uint *)&unit_type_related_1_ARRAY_005a6f78[(byte)puVar18->state].field_0x1 & 8) != 0
          && ((puVar18->flags_2 & 0x100000) == 0)))) {
        *(undefined1 *)((int)&puVar18->loc_1_y + 1) = puVar18->state;
        empty_unit_function(puVar18);
        puVar18->state = 0x2b;
        init_unit_class(puVar18);
      }
    }
    if (((int)player_tribe_num == (uint)bVar1) &&
       (cVar8 = FUN_004b98f0(puVar11,bVar1,0), cVar8 != '\0')) {
      local_3b0 = (unit_struct *)((uint)local_3b0 & 0xfffffefe);
      local_35c = 0;
      bStack_35b = (byte)local_3b0;
      uStack_35a = (ushort)local_3b0._1_1_ << 8;
      uVar9 = calc_point_height((uint)CONCAT21(uStack_35a,(byte)local_3b0) << 8,
                                (uint)CONCAT12(uStack_357,CONCAT11(local_358,local_3b0._1_1_)) << 8)
      ;
      local_358 = (undefined1)uVar9;
      uStack_357 = (undefined1)((ushort)uVar9 >> 8);
      cVar8 = FUN_004edae0(10,0x10);
      if (cVar8 != '\0') {
        alloc_unit_2(10,0x10,player_tribe_num,&local_35c);
      }
    }
    break;
  case 99:
  case 100:
  case 0x65:
    uVar26 = *(undefined4 *)(param_2 + 8);
    local_35c = (byte)uVar26;
    bStack_35b = (byte)((uint)uVar26 >> 8);
    uStack_35a = (ushort)((uint)uVar26 >> 0x10);
    cVar8 = FUN_0047bf00(bVar1,uVar26,1);
    if ((cVar8 != '\0') && (DAT_005aa464 <= *(int *)(param_1 + 0x94d))) {
      local_35c = local_35c & 0xfe;
      uVar4 = CONCAT21((short)((uint)DAT_005aa464 >> 0x10),bStack_35b);
      bStack_35b = bStack_35b & 0xfe;
      calc_point_height((uint)local_35c << 8,(uint)(uVar4 & 0xfffffe) << 8);
    }
    break;
  case 0x66:
    for (puVar11 = *(unit_struct **)(param_1 + 0x881); puVar11 != (unit_struct *)0x0;
        puVar11 = puVar11->next_unit) {
      cVar8 = FUN_004daab0(puVar11,*(undefined4 *)(param_2 + 8));
      puVar18 = local_3c0;
      if (cVar8 != '\0') {
        if (*(int *)(param_2 + 4) == 0) {
          puVar11->flags_3 = puVar11->flags_3 & 0xffffff7f;
          *(byte *)&puVar11->loc_1_x = *(byte *)&puVar11->loc_1_x & 0x7f;
          if (puVar11->unit_land_array_index != 0) {
            puVar15 = unit_land_array[(ushort)puVar11->unit_land_array_index];
            puVar22 = (unit_struct *)0x0;
            if (((*(byte *)&puVar15->flags_2 & 1) == 0) && (puVar15->unit_class != '\0')) {
              puVar22 = puVar15;
            }
            if (((puVar22 != (unit_struct *)0x0) && (puVar22->field_0x9e != '\0')) &&
               (iVar19 = (int)(char)unit_type_array_vehicle[(byte)puVar22->unit_type].field_0x8,
               0 < iVar19)) {
              puVar14 = &puVar22->loc_1_x;
              do {
                puVar18 = (unit_struct *)0x0;
                if (((*puVar14 != 0) &&
                    (puVar15 = unit_land_array[*puVar14], (*(byte *)&puVar15->flags_2 & 1) == 0)) &&
                   (puVar15->unit_class != '\0')) {
                  puVar18 = puVar15;
                }
                if ((puVar18 != (unit_struct *)0x0) && (puVar18 != puVar11)) {
                  FUN_004458d0(puVar18,0,0);
                }
                puVar14 = puVar14 + 1;
                iVar19 = iVar19 + -1;
                puVar18 = local_3c0;
              } while (iVar19 != 0);
            }
          }
        }
        else {
          cVar8 = FUN_004e3430(puVar11,1);
          puVar18 = local_3c0;
          if (cVar8 != '\0') {
            *(byte *)&puVar11->loc_1_x = *(byte *)&puVar11->loc_1_x | 0x80;
            puVar11->flags_3 = puVar11->flags_3 & 0xefffffff;
            if ((puVar11->tribe_index == player_tribe_num) &&
               (game_state._838930_2_ != puVar11->unit_index)) {
              game_state._838940_1_ = 0;
              game_state._838943_1_ = game_state._838943_1_ & 0xfd;
              game_state._838930_2_ = puVar11->unit_index;
            }
            puVar18 = puVar11;
            if (puVar11->unit_land_array_index != 0) {
              puVar15 = unit_land_array[(ushort)puVar11->unit_land_array_index];
              puVar22 = (unit_struct *)0x0;
              if (((*(byte *)&puVar15->flags_2 & 1) == 0) && (puVar15->unit_class != '\0')) {
                puVar22 = puVar15;
              }
              if (((puVar22 != (unit_struct *)0x0) && (puVar22->field_0x9e != '\0')) &&
                 (iVar19 = (int)(char)unit_type_array_vehicle[(byte)puVar22->unit_type].field_0x8,
                 0 < iVar19)) {
                puVar14 = &puVar22->loc_1_x;
                do {
                  puVar15 = (unit_struct *)0x0;
                  if (((*puVar14 != 0) &&
                      (puVar22 = unit_land_array[*puVar14], (*(byte *)&puVar22->flags_2 & 1) == 0))
                     && (puVar22->unit_class != '\0')) {
                    puVar15 = puVar22;
                  }
                  if ((puVar15 != (unit_struct *)0x0) && (puVar15 != puVar11)) {
                    FUN_004458d0(puVar15,1,0);
                  }
                  puVar14 = puVar14 + 1;
                  iVar19 = iVar19 + -1;
                } while (iVar19 != 0);
              }
            }
          }
        }
      }
      local_3c0 = puVar18;
    }
    FUN_0047a550(0xc,param_1);
    break;
  case 0x68:
    FUN_0043d6e0(bVar1);
    break;
  case 0x69:
    uVar26 = *(undefined4 *)(param_2 + 4);
    local_21c = (byte)uVar26;
    bStack_21b = (byte)((uint)uVar26 >> 8);
    local_3b0 = *(unit_struct **)(param_2 + 8);
    FUN_004ba7a0(local_3b0,CONCAT22(uStack_21a,(short)uVar26),
                 CONCAT13(uStack_218,CONCAT21(uStack_21a,bStack_21b)),
                 CONCAT31((int3)((uint)uVar26 >> 8),bVar1),0);
    break;
  case 0x6d:
  case 0x79:
    FUN_004449d0(param_1,param_2);
    break;
  case 0x6e:
    iVar19 = *(int *)(param_1 + 0x89d);
    if ((iVar19 != 0) && ((*(byte *)(iVar19 + 0x10) & 0x80) == 0)) {
      *(undefined4 *)(iVar19 + 0x4f) = *(undefined4 *)(param_2 + 8);
      *(undefined1 *)(*(int *)(param_1 + 0x89d) + 0xa8) = *(undefined1 *)(param_2 + 4);
      iVar19 = *(int *)(param_1 + 0x89d);
      if ((*(byte *)(iVar19 + 0xe) & 0x10) == 0) {
        *(undefined1 *)(iVar19 + 0x7d) = *(undefined1 *)(iVar19 + 0x2c);
        empty_unit_function(iVar19);
        *(undefined1 *)(iVar19 + 0x2c) = 0x26;
        init_unit_class(iVar19);
      }
    }
    break;
  case 0x70:
    if ((game_state._4_4_ & 2) == 0) {
      local_21c = (byte)*(undefined4 *)(param_2 + 4);
      bStack_21b = (byte)((uint)*(undefined4 *)(param_2 + 4) >> 8);
      bStack_35b = local_21c & 0xfe;
      local_35c = 0;
      uStack_35a = (ushort)(bStack_21b & 0xfe) << 8;
      uVar9 = CONCAT11(local_358,bStack_21b);
      uVar4 = CONCAT21(uStack_35a,local_21c);
      local_21c = bStack_35b;
      bStack_21b = bStack_21b & 0xfe;
      uVar9 = calc_point_height((uVar4 & 0xfffffe) << 8,
                                (uint)(CONCAT12(uStack_357,uVar9) & 0xfffffe) << 8);
      local_358 = (undefined1)uVar9;
      uStack_357 = (undefined1)((ushort)uVar9 >> 8);
      ptr_unit_related_20B->field0_0x0 = *(undefined4 *)(param_2 + 8);
      ptr_unit_related_20B->field1_0x4 = 0;
      ptr_unit_related_20B->unit_ptr = (unit_struct *)0x0;
      ptr_unit_related_20B->field3_0xc = 0;
      ptr_unit_related_20B->field4_0x10 = 0;
      ptr_unit_related_20B = ptr_unit_related_20B + 1;
      unit_allocation_flag = 1;
      alloc_unit(7,0x56,bVar1,&local_35c);
    }
    break;
  case 0x71:
    local_3b0 = (unit_struct *)0x0;
    if (((*(ushort *)(param_2 + 8) != 0) &&
        (puVar11 = unit_land_array[*(ushort *)(param_2 + 8)], (*(byte *)&puVar11->flags_2 & 1) == 0)
        ) && (puVar11->unit_class != '\0')) {
      local_3b0 = puVar11;
    }
    if (local_3b0 != (unit_struct *)0x0) {
      local_35c = 0;
      bStack_35b = 0;
      uStack_35a = 0;
      while (puVar11 = (unit_struct *)FUN_0043c600(local_3b0,&local_35c,bVar1),
            puVar11 != (unit_struct *)0x0) {
        if (*(int *)(param_2 + 4) == 0) {
          puVar11->flags_3 = puVar11->flags_3 & 0xffffff7f;
          *(byte *)&puVar11->loc_1_x = *(byte *)&puVar11->loc_1_x & 0x7f;
          puVar18 = local_3c0;
          if (puVar11->unit_land_array_index != 0) {
            puVar15 = unit_land_array[(ushort)puVar11->unit_land_array_index];
            puVar22 = (unit_struct *)0x0;
            if (((*(byte *)&puVar15->flags_2 & 1) == 0) && (puVar15->unit_class != '\0')) {
              puVar22 = puVar15;
            }
            if (((puVar22 != (unit_struct *)0x0) && (puVar22->field_0x9e != '\0')) &&
               (iVar19 = (int)(char)unit_type_array_vehicle[(byte)puVar22->unit_type].field_0x8,
               0 < iVar19)) {
              puVar14 = &puVar22->loc_1_x;
              do {
                puVar18 = (unit_struct *)0x0;
                if (((*puVar14 != 0) &&
                    (puVar15 = unit_land_array[*puVar14], (*(byte *)&puVar15->flags_2 & 1) == 0)) &&
                   (puVar15->unit_class != '\0')) {
                  puVar18 = puVar15;
                }
                if ((puVar18 != (unit_struct *)0x0) && (puVar11 != puVar18)) {
                  FUN_004458d0(puVar18,0,0);
                }
                puVar14 = puVar14 + 1;
                iVar19 = iVar19 + -1;
                puVar18 = local_3c0;
              } while (iVar19 != 0);
            }
          }
        }
        else {
          cVar8 = FUN_004e3430(puVar11,1);
          puVar18 = local_3c0;
          if (cVar8 != '\0') {
            *(byte *)&puVar11->loc_1_x = *(byte *)&puVar11->loc_1_x | 0x80;
            puVar11->flags_3 = puVar11->flags_3 & 0xefffffff;
            if ((puVar11->tribe_index == player_tribe_num) &&
               (game_state._838930_2_ != puVar11->unit_index)) {
              game_state._838940_1_ = 0;
              game_state._838943_1_ = game_state._838943_1_ & 0xfd;
              game_state._838930_2_ = puVar11->unit_index;
            }
            puVar18 = puVar11;
            if (puVar11->unit_land_array_index != 0) {
              puVar15 = unit_land_array[(ushort)puVar11->unit_land_array_index];
              puVar22 = (unit_struct *)0x0;
              if (((*(byte *)&puVar15->flags_2 & 1) == 0) && (puVar15->unit_class != '\0')) {
                puVar22 = puVar15;
              }
              if (((puVar22 != (unit_struct *)0x0) && (puVar22->field_0x9e != '\0')) &&
                 (iVar19 = (int)(char)unit_type_array_vehicle[(byte)puVar22->unit_type].field_0x8,
                 0 < iVar19)) {
                puVar14 = &puVar22->loc_1_x;
                do {
                  puVar15 = (unit_struct *)0x0;
                  if (((*puVar14 != 0) &&
                      (puVar22 = unit_land_array[*puVar14], (*(byte *)&puVar22->flags_2 & 1) == 0))
                     && (puVar22->unit_class != '\0')) {
                    puVar15 = puVar22;
                  }
                  if ((puVar15 != (unit_struct *)0x0) && (puVar11 != puVar15)) {
                    FUN_004458d0(puVar15,1,0);
                  }
                  puVar14 = puVar14 + 1;
                  iVar19 = iVar19 + -1;
                } while (iVar19 != 0);
              }
            }
          }
        }
        local_3c0 = puVar18;
        iVar19 = CONCAT22(uStack_35a,CONCAT11(bStack_35b,local_35c)) + 1;
        local_35c = (byte)iVar19;
        bStack_35b = (byte)((uint)iVar19 >> 8);
        uStack_35a = (ushort)((uint)iVar19 >> 0x10);
      }
      FUN_0047a550(0xc,param_1);
    }
    break;
  case 0x72:
    DAT_00895e9c = 1;
    local_21c = (byte)*(undefined4 *)(param_2 + 8);
    bStack_21b = (byte)((uint)*(undefined4 *)(param_2 + 8) >> 8);
    local_21c = local_21c & 0xfe;
    bStack_21b = bStack_21b & 0xfe;
    local_3c8 = (local_21c + 1) * 0x100;
    sStack_3c6 = (bStack_21b + 1) * 0x100;
    uStack_3c4 = calc_point_height(CONCAT22(sStack_3c6,local_3c8),CONCAT22(uStack_3c4,sStack_3c6));
    uVar20 = *(uint *)(param_2 + 4);
    local_3b0 = (unit_struct *)(uVar20 & 0xffff);
    local_3cd = '\0';
    local_35c = (byte)(uVar20 >> 0x10);
    bStack_35b = (byte)(uVar20 >> 0x18);
    uStack_35a = (ushort)((int)uVar20 >> 0x1f);
    local_25c[0] = 0;
    if (0 < DAT_005aa598) {
      do {
        puVar11 = (unit_struct *)
                  FUN_00451720(bVar1,CONCAT22(uStack_35a,CONCAT11(bStack_35b,local_35c)),local_3b0,
                               &local_3c8);
        if (puVar11 != (unit_struct *)0x0) {
          *(byte *)&puVar11->loc_1_x = *(byte *)&puVar11->loc_1_x | 0x80;
          puVar11->flags_3 = puVar11->flags_3 & 0xefffffff;
          if (puVar11->tribe_index == player_tribe_num) {
            FUN_00442480(puVar11);
          }
          if (puVar11->unit_land_array_index != 0) {
            puVar18 = unit_land_array[(ushort)puVar11->unit_land_array_index];
            puVar15 = (unit_struct *)0x0;
            if (((*(byte *)&puVar18->flags_2 & 1) == 0) && (puVar18->unit_class != '\0')) {
              puVar15 = puVar18;
            }
            if (((puVar15 != (unit_struct *)0x0) && (puVar15->field_0x9e != '\0')) &&
               (iVar19 = (int)(char)unit_type_array_vehicle[(byte)puVar15->unit_type].field_0x8,
               0 < iVar19)) {
              puVar14 = &puVar15->loc_1_x;
              do {
                puVar18 = (unit_struct *)0x0;
                if (((*puVar14 != 0) &&
                    (puVar15 = unit_land_array[*puVar14], (*(byte *)&puVar15->flags_2 & 1) == 0)) &&
                   (puVar15->unit_class != '\0')) {
                  puVar18 = puVar15;
                }
                if ((puVar18 != (unit_struct *)0x0) && (puVar11 != puVar18)) {
                  FUN_004458d0(puVar18,1,0);
                }
                puVar14 = puVar14 + 1;
                iVar19 = iVar19 + -1;
              } while (iVar19 != 0);
            }
          }
          local_3cd = local_3cd + '\x01';
        }
        local_25c[0] = local_25c[0] + 1;
      } while (local_25c[0] < DAT_005aa598);
    }
    if (local_3cd != '\0') {
      FUN_0047a550(0xc,param_1);
    }
    break;
  case 0x73:
    game_state.array_56b_4[bVar1].field_0x36 = *(undefined1 *)(param_2 + 4);
    break;
  case 0x74:
    iVar19 = 0;
    do {
      if ((game_state.array_56b_4[bVar1].spells & 1 << ((byte)iVar19 & 0x1f)) != 0) {
        if (*(int *)(param_2 + 8) == 0) {
          struct_56B_set_field_16((uint)bVar1,iVar19);
        }
        else {
          FUN_004c2be0();
        }
      }
      iVar19 = iVar19 + 1;
    } while (iVar19 < 0x20);
    *(uint *)(param_1 + 0x9e9) = *(uint *)(param_1 + 0x9e9) & 0xfffffffe;
    break;
  case 0x75:
    if (((uint)*(byte *)(param_1 + 0xc25) != *(uint *)(param_2 + 4)) ||
       (bVar3 = true, (*(byte *)(param_1 + 0x9e9) & 1) == 0)) {
      bVar3 = false;
    }
    if (bVar3) {
      iVar19 = 0;
      do {
        uVar20 = 1 << ((byte)iVar19 & 0x1f);
        if ((game_state.array_56b_4[bVar1].spells & uVar20) != 0) {
          if ((*(uint *)(param_1 + 0x9e9) & uVar20) == 0) {
            struct_56B_set_field_16((uint)bVar1,iVar19);
          }
          else {
            FUN_004c2be0();
          }
        }
        iVar19 = iVar19 + 1;
      } while (iVar19 < 0x20);
      *(uint *)(param_1 + 0x9e9) = *(uint *)(param_1 + 0x9e9) & 0xfffffffe;
      *(undefined1 *)(param_1 + 0xc25) = 0;
    }
    else {
      iVar19 = 0;
      *(undefined4 *)(param_1 + 0x9e9) = 0;
      uVar20 = (uint)bVar1;
      do {
        uVar23 = 1 << ((byte)iVar19 & 0x1f);
        if (((game_state.array_56b_4[uVar20].spells & uVar23) != 0) &&
           (iVar24 = check_struct_56B_field_16(uVar20,iVar19), iVar24 != 0)) {
          *(uint *)(param_1 + 0x9e9) = *(uint *)(param_1 + 0x9e9) | uVar23;
          struct_56B_set_field_16(uVar20,iVar19);
        }
        iVar19 = iVar19 + 1;
      } while (iVar19 < 0x20);
      FUN_004c2be0(uVar20,*(undefined4 *)(param_2 + 4));
      *(undefined1 *)(param_1 + 0xc25) = *(undefined1 *)(param_2 + 4);
      *(uint *)(param_1 + 0x9e9) = *(uint *)(param_1 + 0x9e9) | 1;
    }
    break;
  case 0x76:
    _swprintf((wchar_t *)&local_21c,u__s_00599970,DAT_00972cb0);
    write_str_to_debug_buffer(&local_21c,0x10,bVar1,0);
    FUN_0041aeb0(param_1);
    break;
  case 0x77:
    uVar20 = (*(uint *)(param_2 + 8) & 0xfe) * 2 | *(uint *)(param_2 + 8) & 0xfe00;
    if ((((*(byte *)((int)&game_state.level_data[0].flags + uVar20 * 4 + 1) & 2) != 0) &&
        (local_3b0 = unit_land_array
                     [(ushort)(&game_state.level_data[0].unit_index_2)[uVar20 * 2] & 0x3ff],
        local_3b0 != (unit_struct *)0x0)) && (local_3b0->unit_class == '\x02')) {
      for (puVar11 = *(unit_struct **)(param_1 + 0x881); puVar11 != (unit_struct *)0x0;
          puVar11 = puVar11->next_unit) {
        iVar19 = FUN_0040ba20(puVar11,local_3b0);
        puVar18 = local_3c0;
        if (iVar19 != 0) {
          if (*(int *)(param_2 + 4) == 0) {
            puVar11->flags_3 = puVar11->flags_3 & 0xffffff7f;
            *(byte *)&puVar11->loc_1_x = *(byte *)&puVar11->loc_1_x & 0x7f;
            if (puVar11->unit_land_array_index != 0) {
              puVar15 = unit_land_array[(ushort)puVar11->unit_land_array_index];
              puVar22 = (unit_struct *)0x0;
              if (((*(byte *)&puVar15->flags_2 & 1) == 0) && (puVar15->unit_class != '\0')) {
                puVar22 = puVar15;
              }
              if (((puVar22 != (unit_struct *)0x0) && (puVar22->field_0x9e != '\0')) &&
                 (iVar19 = (int)(char)unit_type_array_vehicle[(byte)puVar22->unit_type].field_0x8,
                 0 < iVar19)) {
                puVar14 = &puVar22->loc_1_x;
                do {
                  puVar18 = (unit_struct *)0x0;
                  if (((*puVar14 != 0) &&
                      (puVar15 = unit_land_array[*puVar14], (*(byte *)&puVar15->flags_2 & 1) == 0))
                     && (puVar15->unit_class != '\0')) {
                    puVar18 = puVar15;
                  }
                  if ((puVar18 != (unit_struct *)0x0) && (puVar11 != puVar18)) {
                    FUN_004458d0(puVar18,0,0);
                  }
                  puVar14 = puVar14 + 1;
                  iVar19 = iVar19 + -1;
                  puVar18 = local_3c0;
                } while (iVar19 != 0);
              }
            }
          }
          else {
            cVar8 = FUN_004e3430(puVar11,1);
            puVar18 = local_3c0;
            if (cVar8 != '\0') {
              *(byte *)&puVar11->loc_1_x = *(byte *)&puVar11->loc_1_x | 0x80;
              puVar11->flags_3 = puVar11->flags_3 & 0xefffffff;
              if ((puVar11->tribe_index == player_tribe_num) &&
                 (game_state._838930_2_ != puVar11->unit_index)) {
                game_state._838940_1_ = 0;
                game_state._838943_1_ = game_state._838943_1_ & 0xfd;
                game_state._838930_2_ = puVar11->unit_index;
              }
              puVar18 = puVar11;
              if (puVar11->unit_land_array_index != 0) {
                puVar15 = unit_land_array[(ushort)puVar11->unit_land_array_index];
                puVar22 = (unit_struct *)0x0;
                if (((*(byte *)&puVar15->flags_2 & 1) == 0) && (puVar15->unit_class != '\0')) {
                  puVar22 = puVar15;
                }
                if (((puVar22 != (unit_struct *)0x0) && (puVar22->field_0x9e != '\0')) &&
                   (iVar19 = (int)(char)unit_type_array_vehicle[(byte)puVar22->unit_type].field_0x8,
                   0 < iVar19)) {
                  puVar14 = &puVar22->loc_1_x;
                  do {
                    puVar15 = (unit_struct *)0x0;
                    if (((*puVar14 != 0) &&
                        (puVar22 = unit_land_array[*puVar14], (*(byte *)&puVar22->flags_2 & 1) == 0)
                        ) && (puVar22->unit_class != '\0')) {
                      puVar15 = puVar22;
                    }
                    if ((puVar15 != (unit_struct *)0x0) && (puVar15 != puVar11)) {
                      FUN_004458d0(puVar15,1,0);
                    }
                    puVar14 = puVar14 + 1;
                    iVar19 = iVar19 + -1;
                  } while (iVar19 != 0);
                }
              }
            }
          }
        }
        local_3c0 = puVar18;
      }
      FUN_0047a550(0xc,param_1);
    }
    break;
  case 0x78:
    local_3b0 = *(unit_struct **)(param_2 + 8);
    iVar19 = FUN_0049a220(local_3b0,bVar1);
    if (iVar19 != 0) {
      *(undefined2 *)(iVar19 + 0x6c) = 0;
    }
    break;
  case 0x7a:
    *(undefined1 *)(param_1 + 0xc5c) = 0;
    break;
  case 0x7b:
    DAT_00895e9c = 1;
    local_35c = 0;
    bStack_35b = 0;
    uStack_35a = 0;
    if (((*(ushort *)(param_2 + 8) != 0) &&
        (puVar11 = unit_land_array[*(ushort *)(param_2 + 8)], (*(byte *)&puVar11->flags_2 & 1) == 0)
        ) && (puVar11->unit_class != '\0')) {
      local_35c = (byte)puVar11;
      bStack_35b = (byte)((uint)puVar11 >> 8);
      uStack_35a = (ushort)((uint)puVar11 >> 0x10);
    }
    if (CONCAT22(uStack_35a,CONCAT11(bStack_35b,local_35c)) != 0) {
      iVar19 = CONCAT22(uStack_35a,CONCAT11(bStack_35b,local_35c));
      if ((*(byte *)(iVar19 + 0x7a) & 0x80) == 0) {
        cVar8 = FUN_004e3430(iVar19,1);
        if (cVar8 != '\0') {
          if (*(int *)(param_2 + 4) == 0) {
            for (puVar11 = *(unit_struct **)(param_1 + 0x881); puVar11 != (unit_struct *)0x0;
                puVar11 = puVar11->next_unit) {
              puVar11->flags_3 = puVar11->flags_3 & 0xffffff7f;
              *(byte *)&puVar11->loc_1_x = *(byte *)&puVar11->loc_1_x & 0x7f;
              if (puVar11->unit_land_array_index != 0) {
                puVar18 = unit_land_array[(ushort)puVar11->unit_land_array_index];
                puVar15 = (unit_struct *)0x0;
                if (((puVar18->flags_2 & 1) == 0) && (puVar18->unit_class != '\0')) {
                  puVar15 = puVar18;
                }
                if (((puVar15 != (unit_struct *)0x0) && (puVar15->field_0x9e != '\0')) &&
                   (iVar19 = (int)(char)unit_type_array_vehicle[(byte)puVar15->unit_type].field_0x8,
                   0 < iVar19)) {
                  puVar14 = &puVar15->loc_1_x;
                  do {
                    puVar18 = (unit_struct *)0x0;
                    if (((*puVar14 != 0) &&
                        (puVar15 = unit_land_array[*puVar14], (puVar15->flags_2 & 1) == 0)) &&
                       (puVar15->unit_class != '\0')) {
                      puVar18 = puVar15;
                    }
                    if ((puVar18 != (unit_struct *)0x0) && (puVar11 != puVar18)) {
                      FUN_004458d0(puVar18,0,0);
                    }
                    puVar14 = puVar14 + 1;
                    iVar19 = iVar19 + -1;
                  } while (iVar19 != 0);
                }
              }
            }
          }
          iVar19 = CONCAT22(uStack_35a,CONCAT11(bStack_35b,local_35c));
          *(byte *)(iVar19 + 0x7a) = *(byte *)(iVar19 + 0x7a) | 0x80;
          *(uint *)(iVar19 + 0x14) = *(uint *)(iVar19 + 0x14) & 0xefffffff;
          if ((*(char *)(iVar19 + 0x2f) == player_tribe_num) &&
             (game_state._838930_2_ != *(short *)(iVar19 + 0x24))) {
            game_state._838940_1_ = 0;
            game_state._838943_1_ = game_state._838943_1_ & 0xfd;
            game_state._838930_2_ = *(short *)(iVar19 + 0x24);
          }
          uVar10 = *(ushort *)(CONCAT22(uStack_35a,CONCAT11(bStack_35b,local_35c)) + 0x9f);
          if (uVar10 != 0) {
            puVar11 = unit_land_array[uVar10];
            puVar18 = (unit_struct *)0x0;
            if (((*(byte *)&puVar11->flags_2 & 1) == 0) && (puVar11->unit_class != '\0')) {
              puVar18 = puVar11;
            }
            if (((puVar18 != (unit_struct *)0x0) && (puVar18->field_0x9e != '\0')) &&
               (iVar19 = (int)(char)unit_type_array_vehicle[(byte)puVar18->unit_type].field_0x8,
               0 < iVar19)) {
              puVar14 = &puVar18->loc_1_x;
              do {
                puVar11 = (unit_struct *)0x0;
                if (((*puVar14 != 0) &&
                    (puVar18 = unit_land_array[*puVar14], (puVar18->flags_2 & 1) == 0)) &&
                   (puVar18->unit_class != '\0')) {
                  puVar11 = puVar18;
                }
                if ((puVar11 != (unit_struct *)0x0) &&
                   ((unit_struct *)CONCAT22(uStack_35a,CONCAT11(bStack_35b,local_35c)) != puVar11))
                {
                  FUN_004458d0(puVar11,1,0);
                }
                puVar14 = puVar14 + 1;
                iVar19 = iVar19 + -1;
              } while (iVar19 != 0);
            }
          }
          local_3b4 = 1;
          local_3c0 = (unit_struct *)CONCAT22(uStack_35a,CONCAT11(bStack_35b,local_35c));
        }
      }
      else if (*(int *)(param_2 + 4) != 0) {
        iVar19 = CONCAT22(uStack_35a,CONCAT11(bStack_35b,local_35c));
        *(uint *)(iVar19 + 0x14) = *(uint *)(iVar19 + 0x14) & 0xffffff7f;
        *(byte *)(iVar19 + 0x7a) = *(byte *)(iVar19 + 0x7a) & 0x7f;
        if (*(ushort *)(iVar19 + 0x9f) != 0) {
          puVar11 = unit_land_array[*(ushort *)(iVar19 + 0x9f)];
          puVar18 = (unit_struct *)0x0;
          if (((*(byte *)&puVar11->flags_2 & 1) == 0) && (puVar11->unit_class != '\0')) {
            puVar18 = puVar11;
          }
          if (((puVar18 != (unit_struct *)0x0) && (puVar18->field_0x9e != '\0')) &&
             (iVar19 = (int)(char)unit_type_array_vehicle[(byte)puVar18->unit_type].field_0x8,
             0 < iVar19)) {
            puVar14 = &puVar18->loc_1_x;
            do {
              puVar11 = (unit_struct *)0x0;
              if (((*puVar14 != 0) &&
                  (puVar18 = unit_land_array[*puVar14], (puVar18->flags_2 & 1) == 0)) &&
                 (puVar18->unit_class != '\0')) {
                puVar11 = puVar18;
              }
              if ((puVar11 != (unit_struct *)0x0) &&
                 ((unit_struct *)CONCAT22(uStack_35a,CONCAT11(bStack_35b,local_35c)) != puVar11)) {
                FUN_004458d0(puVar11,0,0);
              }
              puVar14 = puVar14 + 1;
              iVar19 = iVar19 + -1;
            } while (iVar19 != 0);
          }
        }
      }
    }
    FUN_0047a550(0xc,param_1);
    break;
  case 0x7c:
    FUN_0040bce0(bVar1);
    break;
  case 0x7d:
    DAT_00895e9c = 1;
    local_21c = (byte)*(undefined4 *)(param_2 + 8);
    bStack_21b = (byte)((uint)*(undefined4 *)(param_2 + 8) >> 8);
    local_21c = local_21c & 0xfe;
    bStack_21b = bStack_21b & 0xfe;
    local_3c8 = (local_21c + 1) * 0x100;
    sStack_3c6 = (bStack_21b + 1) * 0x100;
    uStack_3c4 = calc_point_height(CONCAT22(sStack_3c6,local_3c8),CONCAT22(uStack_3c4,sStack_3c6));
    iVar19 = (int)*(uint *)(param_2 + 4) >> 0x10;
    if (iVar19 == 7) {
      puVar11 = *(unit_struct **)(param_1 + 0x89d);
      if ((puVar11 != (unit_struct *)0x0) && (cVar8 = FUN_004e3430(puVar11,0), cVar8 != '\0')) {
        *(byte *)&puVar11->loc_1_x = *(byte *)&puVar11->loc_1_x | 0x80;
        puVar11->flags_3 = puVar11->flags_3 & 0xefffffff;
        if (puVar11->tribe_index == player_tribe_num) {
          FUN_00442480(puVar11);
        }
        if (puVar11->unit_land_array_index != 0) {
          puVar18 = unit_land_array[(ushort)puVar11->unit_land_array_index];
          puVar15 = (unit_struct *)0x0;
          if (((*(byte *)&puVar18->flags_2 & 1) == 0) && (puVar18->unit_class != '\0')) {
            puVar15 = puVar18;
          }
          if (((puVar15 != (unit_struct *)0x0) && (puVar15->field_0x9e != '\0')) &&
             (iVar19 = (int)(char)unit_type_array_vehicle[(byte)puVar15->unit_type].field_0x8,
             0 < iVar19)) {
            puVar14 = &puVar15->loc_1_x;
            do {
              puVar18 = (unit_struct *)0x0;
              if (((*puVar14 != 0) &&
                  (puVar15 = unit_land_array[*puVar14], (puVar15->flags_2 & 1) == 0)) &&
                 (puVar15->unit_class != '\0')) {
                puVar18 = puVar15;
              }
              if ((puVar18 != (unit_struct *)0x0) && (puVar11 != puVar18)) {
                FUN_004458d0(puVar18,1,0);
              }
              puVar14 = puVar14 + 1;
              iVar19 = iVar19 + -1;
            } while (iVar19 != 0);
          }
        }
LAB_00441c43:
        local_3c0 = puVar11;
        local_3b4 = 1;
      }
    }
    else {
      puVar11 = (unit_struct *)
                FUN_00451720((int)*(char *)(param_1 + 0xc22),iVar19,*(uint *)(param_2 + 4) & 0xffff,
                             &local_3c8);
      if (puVar11 != (unit_struct *)0x0) {
        if ((*(byte *)&puVar11->loc_1_x & 0x80) == 0) {
          cVar8 = FUN_004e3430(puVar11,0);
          if (cVar8 != '\0') {
            *(byte *)&puVar11->loc_1_x = *(byte *)&puVar11->loc_1_x | 0x80;
            puVar11->flags_3 = puVar11->flags_3 & 0xefffffff;
            if (puVar11->tribe_index == player_tribe_num) {
              FUN_00442480(puVar11);
            }
            if (puVar11->unit_land_array_index != 0) {
              puVar18 = unit_land_array[(ushort)puVar11->unit_land_array_index];
              puVar15 = (unit_struct *)0x0;
              if (((*(byte *)&puVar18->flags_2 & 1) == 0) && (puVar18->unit_class != '\0')) {
                puVar15 = puVar18;
              }
              if (((puVar15 != (unit_struct *)0x0) && (puVar15->field_0x9e != '\0')) &&
                 (iVar19 = (int)(char)unit_type_array_vehicle[(byte)puVar15->unit_type].field_0x8,
                 0 < iVar19)) {
                puVar14 = &puVar15->loc_1_x;
                do {
                  puVar18 = (unit_struct *)0x0;
                  if (((*puVar14 != 0) &&
                      (puVar15 = unit_land_array[*puVar14], (puVar15->flags_2 & 1) == 0)) &&
                     (puVar15->unit_class != '\0')) {
                    puVar18 = puVar15;
                  }
                  if ((puVar18 != (unit_struct *)0x0) && (puVar18 != puVar11)) {
                    FUN_004458d0(puVar18,1,0);
                  }
                  puVar14 = puVar14 + 1;
                  iVar19 = iVar19 + -1;
                } while (iVar19 != 0);
              }
            }
            goto LAB_00441c43;
          }
        }
        else {
          puVar11->flags_3 = puVar11->flags_3 & 0xffffff7f;
          *(byte *)&puVar11->loc_1_x = *(byte *)&puVar11->loc_1_x & 0x7f;
          if (puVar11->unit_land_array_index != 0) {
            puVar18 = unit_land_array[(ushort)puVar11->unit_land_array_index];
            puVar15 = (unit_struct *)0x0;
            if (((*(byte *)&puVar18->flags_2 & 1) == 0) && (puVar18->unit_class != '\0')) {
              puVar15 = puVar18;
            }
            if (((puVar15 != (unit_struct *)0x0) && (puVar15->field_0x9e != '\0')) &&
               (iVar19 = (int)(char)unit_type_array_vehicle[(byte)puVar15->unit_type].field_0x8,
               0 < iVar19)) {
              puVar14 = &puVar15->loc_1_x;
              do {
                puVar18 = (unit_struct *)0x0;
                if (((*puVar14 != 0) &&
                    (puVar15 = unit_land_array[*puVar14], (puVar15->flags_2 & 1) == 0)) &&
                   (puVar15->unit_class != '\0')) {
                  puVar18 = puVar15;
                }
                if ((puVar18 != (unit_struct *)0x0) && (puVar11 != puVar18)) {
                  FUN_004458d0(puVar18,0,0);
                }
                puVar14 = puVar14 + 1;
                iVar19 = iVar19 + -1;
              } while (iVar19 != 0);
            }
          }
        }
      }
    }
    FUN_0047a550(0xc,param_1);
    break;
  case 0x7e:
    for (iVar19 = *(int *)(param_1 + 0x881); iVar19 != 0; iVar19 = *(int *)(iVar19 + 8)) {
      if (((((*(byte *)(iVar19 + 0x7a) & 0x80) != 0) && (*(short *)(iVar19 + 0x9f) == 0)) &&
          ((*(uint *)(iVar19 + 0xc) & 0x800000) == 0)) &&
         (((cVar8 = *(char *)(iVar19 + 0x2c), cVar8 != '\x19' && (cVar8 != '\x1d')) &&
          ((*(uint *)(iVar19 + 0xc) & 0x100000) == 0)))) {
        *(char *)(iVar19 + 0x7d) = cVar8;
        empty_unit_function(iVar19);
        *(undefined1 *)(iVar19 + 0x2c) = 0x2b;
        init_unit_class(iVar19);
      }
    }
    break;
  case 0x7f:
    uVar20 = *(uint *)(param_2 + 4);
    local_3b0 = (unit_struct *)(uVar20 & 0xffff);
    local_21c = (byte)*(undefined4 *)(param_2 + 8);
    bStack_21b = (byte)((uint)*(undefined4 *)(param_2 + 8) >> 8);
    local_21c = local_21c & 0xfe;
    bStack_21b = bStack_21b & 0xfe;
    local_3c8 = (local_21c + 1) * 0x100;
    sStack_3c6 = (bStack_21b + 1) * 0x100;
    uStack_3c4 = calc_point_height(CONCAT22(sStack_3c6,local_3c8),CONCAT22(uStack_3c4,sStack_3c6));
    puVar11 = boat_units;
    if ((unit_type_array_vehicle[(int)uVar20 >> 0x10].field_0x15 & 1) != 0) {
      puVar11 = airship_units;
    }
    if (puVar11 != (unit_struct *)0x0) {
      do {
        if ((((int)(char)puVar11->tribe_index == (uint)bVar1) && (puVar11->field_0x9e != '\0')) &&
           (cVar8 = FUN_00451ac0(puVar11,&local_3c8,*(uint *)(param_1 + 0x93d) & 0x80),
           cVar8 != '\0')) {
          local_35c = 1;
          if (local_3b0 != (unit_struct *)0x0) {
            iVar19 = 0;
            bVar3 = false;
            if (0 < (char)unit_type_array_vehicle[(byte)puVar11->unit_type].field_0x8) {
              puVar14 = &puVar11->loc_1_x;
              do {
                if (bVar3) goto LAB_00441e3b;
                puVar18 = (unit_struct *)0x0;
                if (((*puVar14 != 0) &&
                    (puVar15 = unit_land_array[*puVar14], (*(byte *)&puVar15->flags_2 & 1) == 0)) &&
                   (puVar15->unit_class != '\0')) {
                  puVar18 = puVar15;
                }
                if ((puVar18 != (unit_struct *)0x0) &&
                   ((unit_struct *)(uint)(byte)puVar18->unit_type == local_3b0)) {
                  bVar3 = true;
                }
                puVar14 = puVar14 + 1;
                iVar19 = iVar19 + 1;
              } while (iVar19 < (char)unit_type_array_vehicle[(byte)puVar11->unit_type].field_0x8);
            }
            if (!bVar3) {
              local_35c = 0;
            }
          }
LAB_00441e3b:
          if ((local_35c != 0) && (iVar19 = FUN_004e31f0(puVar11,1,&local_368), iVar19 != 0)) {
            local_3c0 = local_368;
          }
        }
        puVar11 = puVar11->next_unit;
      } while (puVar11 != (unit_struct *)0x0);
    }
    FUN_0047a550(0xc,param_1);
    break;
  case 0x80:
  case 0x81:
    uVar20 = *(uint *)(param_2 + 4);
    local_3b0 = (unit_struct *)(uVar20 & 0xffff);
    local_21c = (byte)*(undefined4 *)(param_2 + 8);
    bStack_21b = (byte)((uint)*(undefined4 *)(param_2 + 8) >> 8);
    local_21c = local_21c & 0xfe;
    bStack_21b = bStack_21b & 0xfe;
    local_3c8 = (local_21c + 1) * 0x100;
    sStack_3c6 = (bStack_21b + 1) * 0x100;
    uStack_3c4 = calc_point_height(CONCAT22(sStack_3c6,local_3c8),CONCAT22(uStack_3c4,sStack_3c6));
    if (*(char *)(param_2 + 0xc) == -0x80) {
      local_35c = (byte)DAT_005aa598;
      bStack_35b = (byte)((uint)DAT_005aa598 >> 8);
      uStack_35a = (ushort)((uint)DAT_005aa598 >> 0x10);
    }
    else {
      local_35c = 1;
      bStack_35b = 0;
      uStack_35a = 0;
    }
    iVar19 = 0;
    iVar24 = 0;
    local_3c0 = (unit_struct *)0x0;
    if (0 < CONCAT22(uStack_35a,CONCAT11(bStack_35b,local_35c))) {
      do {
        iVar12 = FUN_004514f0(bVar1,(int)uVar20 >> 0x10,local_3b0,&local_3c8,0);
        if (iVar12 == 0) break;
        iVar12 = FUN_004e31f0(iVar12,1,&local_368);
        if ((iVar12 != 0) && (iVar19 = iVar19 + 1, local_3c0 == (unit_struct *)0x0)) {
          local_3c0 = local_368;
        }
        iVar24 = iVar24 + 1;
      } while (iVar24 < CONCAT22(uStack_35a,CONCAT11(bStack_35b,local_35c)));
    }
    if (iVar19 != 0) {
      FUN_0047a550(0xc,param_1);
    }
    break;
  case 0x82:
    FUN_00443b40(CONCAT31((int3)(*(byte *)(param_2 + 0xc) - 0xc >> 8),bVar1),
                 *(undefined4 *)(param_2 + 4));
    break;
  case 0x83:
    if ((game_state._4_4_ & 0x20) == 0) {
      FUN_0041c140();
    }
    else {
      FUN_0041c520();
    }
    break;
  case 0x84:
    if (*(char *)(param_1 + 0xc5e) == '\0') {
      uVar26 = *(undefined4 *)(param_2 + 8);
      local_3bc._2_2_ = (short)((uint)uVar26 >> 0x10);
      sVar6 = local_3bc._2_2_;
      local_3c8 = (short)uVar26;
      sStack_3c6 = local_3bc._2_2_;
      uStack_3c4 = 0;
      local_3bc = uVar26;
      uStack_3c4 = calc_point_height(uVar26,sVar6);
      uVar26 = *(undefined4 *)(param_2 + 4);
      local_35c = (byte)uVar26;
      bStack_35b = (byte)((uint)uVar26 >> 8);
      uStack_35a = (ushort)((uint)uVar26 >> 0x10);
      local_3b0 = (unit_struct *)CONCAT22(local_3b0._2_2_,(short)uVar26);
      local_3b0 = (unit_struct *)(CONCAT31(local_3b0._1_3_,local_35c) & 0xfffffefe);
      local_370 = ((byte)local_3b0 + 1) * 0x100;
      sStack_36e = (local_3b0._1_1_ + 1) * 0x100;
      uStack_36c = calc_point_height(CONCAT22(sStack_36e,local_370),CONCAT22(uStack_36c,sStack_36e))
      ;
      bVar3 = true;
      uVar10 = uStack_35a >> 0xb;
      if ((*(char *)(param_1 + 0xc1f) == '\x02') &&
         (iVar19 = struct_56B_get_spell_array_val(bVar1,uVar10), iVar19 < 1)) {
        bVar3 = false;
      }
      if (bVar3) {
        FUN_004c2100(uVar10,bVar1,&local_3c8,&local_3c8,&local_370);
        FUN_004c3230(bVar1,uVar10,&local_3bc);
        iVar19 = struct_56B_get_spell_array_val(bVar1,uVar10);
        if (iVar19 != 0) {
          set_struct_56B_array_spell_val(bVar1,uVar10,iVar19 + -1);
        }
        if ((((byte)opened_files_flags & 0x10) == 0) && (*(char *)(param_1 + 0xc1f) == '\x02')) {
          *(undefined1 *)(param_1 + 0xc5e) = 0xc;
        }
      }
    }
    break;
  case 0x85:
    local_3b0 = *(unit_struct **)(param_2 + 8);
    iVar19 = *(int *)(param_2 + 4);
    local_21c = (byte)local_3b0;
    bStack_21b = (byte)((uint)local_3b0 >> 8);
    local_3c8 = (ushort)(local_21c & 0xfe) << 8;
    sStack_3c6 = (ushort)(bStack_21b & 0xfe) << 8;
    uVar4 = CONCAT21(uStack_3c4,bStack_21b);
    uVar5 = CONCAT21(sStack_3c6,local_21c);
    local_21c = local_21c & 0xfe;
    bStack_21b = bStack_21b & 0xfe;
    uStack_3c4 = calc_point_height((uint)(uVar5 & 0xfffffe) << 8,(uint)(uVar4 & 0xfffffe) << 8);
    alloc_unit(7,(iVar19 == 0) + ',',bVar1,&local_3c8);
    break;
  case 0x86:
    uVar26 = *(undefined4 *)(param_2 + 8);
    local_21c = (byte)uVar26;
    bStack_21b = (byte)((uint)uVar26 >> 8);
    uStack_21a = (undefined2)((uint)uVar26 >> 0x10);
    local_364 = (undefined2)uVar26;
    local_362 = uStack_21a;
    local_360 = calc_point_height(uVar26,CONCAT13(uStack_217,CONCAT12(uStack_218,uStack_21a)));
    iVar24 = (int)*(uint *)(param_2 + 4) >> 0x10;
    uVar20 = *(uint *)(param_2 + 4) & 0xffff;
    iVar19 = alloc_unit(iVar24,uVar20,bVar1,&local_364);
    if (iVar19 == 0) break;
    FUN_004194f0();
    _unit_land_array_end = iVar19;
    get_unit_name(iVar24,uVar20,local_25c,&local_3b0);
    _swprintf((wchar_t *)&local_35c,u_CHEAT_THING___s___s___d__d__0059cc4c,local_25c,&local_3b0,
              iVar24,uVar20);
    pbVar25 = &local_35c;
    uVar26 = 0x10;
LAB_0044228c:
    write_str_to_debug_buffer(pbVar25,uVar26,bVar1,0);
  }
  if (local_3c0 != (unit_struct *)0x0) {
    FUN_00489c40(param_1,local_3c0,local_3b4);
  }
  return;
}
