/* Ghidra 12.1.3 pseudocode; entry 004aab80; process_cmd.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */

void process_cmd(int param_1,int param_2,int param_3)

{
  char *pcVar1;
  undefined1 uVar2;
  bool bVar3;
  bool bVar4;
  bool bVar5;
  bool bVar6;
  short sVar7;
  uint uVar8;
  byte bVar9;
  undefined1 uVar10;
  char cVar11;
  char cVar12;
  ushort uVar13;
  undefined3 uVar18;
  struct_g2 *psVar14;
  int iVar15;
  undefined2 extraout_var;
  undefined4 uVar16;
  int iVar17;
  int *piVar20;
  unit_struct *puVar21;
  uint uVar22;
  int iVar23;
  unit_struct *puVar24;
  wchar_t *pwVar25;
  byte bStack_338;
  byte bStack_337;
  undefined4 local_334;
  uint local_330;
  short local_32c;
  short local_32a;
  undefined1 local_328;
  undefined1 uStack_327;
  undefined2 local_326;
  undefined1 uStack_325;
  undefined4 local_320;
  undefined4 local_31c;
  int local_318;
  int local_314;
  int local_310 [60];
  undefined4 local_220;
  char local_110 [272];
  undefined2 uVar19;

  iVar23 = (int)player_tribe_num;
  bVar3 = true;
  iVar17 = iVar23 * 0xc65 + 0x89d1c8;
  cVar12 = (char)param_1;
  uVar19 = (undefined2)((uint)(iVar23 * 0xc65) >> 0x10);
  uVar18 = (undefined3)((uint)(iVar23 * 0xc65) >> 8);
  cVar11 = (char)((ushort)DAT_00895d9a >> 8);
  switch(param_1) {
  case 0xd:
    FUN_00479f00(1,0,0);
    break;
  case 0xe:
    FUN_00479f00(1,1,0);
    break;
  case 0xf:
    if ((DAT_0089c6e7 != '\x04') && (iVar15 = FUN_00451370(2), iVar15 == 0)) {
      if ((land_flags_1 & 8) == 0) {
        FUN_00479f00(5,iVar23,0);
      }
      else {
        set_tribe_command(player_tribe_num,0x1d,0);
      }
    }
    break;
  case 0x10:
    if ((DAT_0089c6e7 != '\x04') && (iVar15 = FUN_00451370(2), iVar15 == 0)) {
      set_tribe_command(player_tribe_num,0x1f,0,0);
    }
    break;
  case 0x11:
  case 0x19:
  case 0x1b:
  case 0x1c:
  case 0x1d:
  case 0x2c:
  case 0x2d:
  case 0x9f:
    break;
  case 0x12:
    if ((land_flags_1 & 0x8000) != 0) {
      FUN_004b36e0(1,1);
    }
    break;
  case 0x13:
    FUN_00479f00(8,0,0);
    break;
  case 0x14:
    if ((land_flags_1 & 8) == 0) {
      set_tribe_command(CONCAT31(uVar18,player_tribe_num),0x17,1,1);
    }
    break;
  case 0x15:
    if (DAT_0059ce08 == 0) {
      if ((game_state._838239_1_ & 1) == 0) {
        FUN_0041fad0();
        FUN_00418890();
      }
    }
    else {
      DAT_0059ce08 = 0;
    }
    break;
  case 0x16:
    FUN_0045db60(0);
    break;
  case 0x17:
    FUN_00486b60();
    break;
  default:
    bVar3 = false;
    break;
  case 0x1e:
  case 0x1f:
  case 0x20:
  case 0x21:
    FUN_0047c590(param_1 + -0x1e);
    break;
  case 0x22:
  case 0x23:
  case 0x24:
  case 0x25:
    if ((*(uint *)&game_state.tribes_array[iVar23].field_0x941 & 1 << (cVar12 - 0x20U & 0x1f)) != 0)
    {
      local_220 = (unit_struct *)
                  (CONCAT31(local_220._1_3_,
                            (char)((ushort)*(undefined2 *)(&game_state.field_0xc34e6 + param_1 * 4)
                                  >> 8)) & 0xfffffffe);
      uVar13 = CONCAT11((char)((ushort)*(undefined2 *)(&game_state.field_0xc34e8 + param_1 * 4) >> 8
                              ),(undefined1)local_220);
      local_220 = (unit_struct *)(CONCAT22(local_220._2_2_,uVar13) & 0xfffffeff);
      set_data_to_rddata_chunk
                (0x16,uVar13 & 0xfeff,
                 *(undefined2 *)(&game_state.start_20[0x28].field_0x4 + param_1 * 2));
    }
    break;
  case 0x2e:
    game_state.sunlight_var_5 = game_state.sunlight_var_5 - 1;
    if (game_state.sunlight_var_5 == 0xff) {
      game_state.sunlight_var_5 = 0;
    }
    sunlight_init();
    break;
  case 0x2f:
    game_state.sunlight_var_5 = game_state.sunlight_var_5 + 1;
    if (0x3f < game_state.sunlight_var_5) {
      game_state.sunlight_var_5 = 0x3f;
    }
    sunlight_init();
    break;
  case 0x30:
    game_state.sunlight_var_4 = game_state.sunlight_var_4 - 1;
    if (game_state.sunlight_var_4 == 0xff) {
      game_state.sunlight_var_4 = 0;
    }
    sunlight_init();
    break;
  case 0x31:
    game_state.sunlight_var_4 = game_state.sunlight_var_4 + 1;
    if (0x1f < game_state.sunlight_var_4) {
      game_state.sunlight_var_4 = 0x1f;
    }
    sunlight_init();
    break;
  case 0x32:
    DAT_0089ce40 = DAT_0089ce40 - 1;
    if (DAT_0089ce40 < 2) {
      DAT_0089ce40 = 2;
    }
    break;
  case 0x33:
    DAT_0089ce40 = DAT_0089ce40 + 1;
    if ((int)(DAT_0089ce3f - 3) < (int)(uint)DAT_0089ce40) {
      DAT_0089ce40 = DAT_0089ce3f - 3;
    }
    break;
  case 0x34:
    DAT_0089ce3f = DAT_0089ce3f - 1;
    if ((uint)DAT_0089ce3f < DAT_0089ce40 + 3) {
      DAT_0089ce3f = DAT_0089ce40 + 3;
    }
    break;
  case 0x35:
    DAT_0089ce3f = DAT_0089ce3f + 1;
    if (0x32 < DAT_0089ce3f) {
      DAT_0089ce3f = 0x32;
    }
    break;
  case 0x36:
    z_pos_camera = z_pos_camera + 200;
    if (0x6e00 < z_pos_camera) {
      z_pos_camera = 0x6e00;
    }
    break;
  case 0x37:
    z_pos_camera = z_pos_camera + -200;
    if (z_pos_camera < -0x6e00) {
      z_pos_camera = -0x6e00;
    }
    break;
  case 0x38:
    maybe_fog = maybe_fog + '\x01';
    break;
  case 0x39:
    maybe_fog = maybe_fog + -1;
    break;
  case 0x3a:
    DAT_0089ce49 = DAT_0089ce49 + 200;
    if (0x6e00 < DAT_0089ce49) {
      DAT_0089ce49 = 0x6e00;
    }
    break;
  case 0x3b:
    DAT_0089ce49 = DAT_0089ce49 + -200;
    if (DAT_0089ce49 < -0x6e00) {
      DAT_0089ce49 = -0x6e00;
    }
    break;
  case 0x3c:
    DAT_0089ce42 = DAT_0089ce42 + '\x01';
    break;
  case 0x3d:
    DAT_0089ce42 = DAT_0089ce42 + -1;
    break;
  case 0x3e:
    if (((load_level_flags & 0x4000000) == 0) &&
       (((land_flags_1 & 8) == 0 || ((land_flags_1 & 0x8000) != 0)))) {
      set_tribe_command(CONCAT31(uVar18,player_tribe_num),0x15,0xffffffff,0);
    }
    break;
  case 0x3f:
    if (((load_level_flags & 0x4000000) == 0) &&
       (((land_flags_1 & 8) == 0 || ((land_flags_1 & 0x8000) != 0)))) {
      set_tribe_command(CONCAT31(uVar18,player_tribe_num),0x15,1,0);
    }
    break;
  case 0x40:
    if (((load_level_flags & 0x4000000) == 0) || ((land_flags_1 & 0x8000) != 0)) {
      if ((land_flags_1 & 8) == 0) {
        FUN_00479f00(6,0,0);
      }
      else {
        set_tribe_command(CONCAT31(uVar18,player_tribe_num),0x29,0xc);
      }
    }
    break;
  case 0x41:
    if (((load_level_flags & 0x4000000) == 0) || ((land_flags_1 & 0x8000) != 0)) {
      if ((land_flags_1 & 8) == 0) {
        FUN_00479f00(6,1,0);
      }
      else {
        set_tribe_command(CONCAT31(uVar18,player_tribe_num),0x29,0xc);
      }
    }
    break;
  case 0x42:
    if (((load_level_flags & 0x4000000) == 0) || ((land_flags_1 & 0x8000) != 0)) {
      if ((land_flags_1 & 8) == 0) {
        FUN_00479f00(7,0,0);
      }
      else {
        set_tribe_command(CONCAT31(uVar18,player_tribe_num),0x28,0xc);
      }
    }
    break;
  case 0x43:
    if ((((load_level_flags & 0x4000000) == 0) || ((land_flags_1 & 0x8000) != 0)) &&
       ((land_flags_1 & 8) == 0)) {
      FUN_00479f00(7,0xc,0);
    }
    break;
  case 0x44:
    if ((land_flags_1 & 8) != 0) {
      set_tribe_command(CONCAT31(uVar18,player_tribe_num),0x14,iVar23,0);
    }
    break;
  case 0x46:
    FUN_00486b60();
    break;
  case 0x47:
    DAT_0098e908 = DAT_0098e908 | 1;
    break;
  case 0x48:
    DAT_0098e908 = DAT_0098e908 & 0xfffe;
    break;
  case 0x49:
    DAT_00895d9a = DAT_00895d9a + 1;
    sVar7 = DAT_00895d9a;
    if (DAT_00895d9e + -1 < (int)DAT_00895d9a) {
      DAT_00895d9a = 0;
    }
    set_tribe_command(CONCAT31((int3)(char)((ushort)sVar7 >> 8),player_tribe_num),0x17,
                      (int)DAT_00895d9a,0);
    break;
  case 0x4a:
    DAT_00895d9a = DAT_00895d9a + -1;
    if (DAT_00895d9a < 0) {
      DAT_00895d9a = DAT_00895d9e + -1;
    }
    set_tribe_command(player_tribe_num,0x17,(int)DAT_00895d9a,0);
    break;
  case 0x4b:
    set_tribe_command(CONCAT31((int3)cVar11,player_tribe_num),0x17,(int)DAT_00895d9a,
                      -*(int *)(&DAT_005a8ac1 + DAT_00895d9a * 0x34));
    break;
  case 0x4c:
    set_tribe_command(CONCAT31((int3)cVar11,player_tribe_num),0x17,(int)DAT_00895d9a,
                      *(undefined4 *)(&DAT_005a8ac1 + DAT_00895d9a * 0x34));
    break;
  case 0x4d:
    set_tribe_command(CONCAT31((int3)cVar11,player_tribe_num),0x17,(int)DAT_00895d9a,
                      -*(int *)(&DAT_005a8ac5 + DAT_00895d9a * 0x34));
    break;
  case 0x4e:
    set_tribe_command(CONCAT31((int3)cVar11,player_tribe_num),0x17,(int)DAT_00895d9a,
                      *(undefined4 *)(&DAT_005a8ac5 + DAT_00895d9a * 0x34));
    break;
  case 0x4f:
    DAT_0098e908 = DAT_0098e908 | 2;
    break;
  case 0x50:
    DAT_0098e908 = DAT_0098e908 & 0xfffd;
    break;
  case 0x51:
    if ((land_flags_1 & 0x8000) == 0) {
      DAT_0098e908 = DAT_0098e908 & 0xfffd;
      FUN_004aee40(4,5);
    }
    else {
      land_flags_1 = land_flags_1 & 0xffff7fff;
      get_global_file_path(&local_220,s_SAVE_005999ec,0);
      _sprintf(local_110,s__s_key_def_dat_005ae02c,&local_220);
      iVar15 = get_file_attrs(local_110);
      if (iVar15 != 0) {
        FUN_00488fb0(local_110);
      }
      write_str_to_debug_buffer(DAT_00972cb8,0x10,player_tribe_num,0);
    }
    break;
  case 0x52:
    if ((land_flags_1 & 8) == 0) {
      set_tribe_command(CONCAT31(uVar18,player_tribe_num),0x31,0,10000);
    }
    break;
  case 0x53:
    if ((land_flags_1 & 8) == 0) {
      set_tribe_command(CONCAT31(uVar18,player_tribe_num),0x76,0,0);
    }
    break;
  case 0x54:
    if ((land_flags_1 & 8) == 0) {
      set_tribe_command(CONCAT31(uVar18,player_tribe_num),0x41,0,0);
    }
    break;
  case 0x55:
    if ((land_flags_1 & 8) == 0) {
      set_tribe_command(CONCAT31(uVar18,player_tribe_num),0x44,0,0);
    }
    break;
  case 0x56:
    if ((land_flags_1 & 8) == 0) {
      set_tribe_command(CONCAT31(uVar18,player_tribe_num),0x45,0,0);
    }
    break;
  case 0x57:
    sunlight_init_2();
    set_landscape_c_4_and_texture(0,0x40);
    break;
  case 0x58:
    if ((game_state._838239_1_ & 1) == 0) {
      FUN_00479f00(0xd,CONCAT22(uVar19,(short)vconfig_index_start),0);
    }
    break;
  case 0x5d:
    puVar21 = game_state.tribes_array[iVar23].shaman;
    if (puVar21 != (unit_struct *)0x0) {
      set_data_to_rddata_chunk
                (0x16,CONCAT11((char)((ushort)(puVar21->pos).y >> 8),
                               (char)((ushort)(puVar21->pos).x >> 8)) & 0xfefe,
                 (int)(short)game_state.tribes_array[iVar23].angle_1);
    }
    break;
  case 99:
    if ((10 < game_state.offset_counter_2) && ((load_level_flags & 0x4000000) == 0)) {
      if ((land_flags_1 & 0x6000000) == 0) {
        level_flags_1 = level_flags_1 ^ 0x20;
      }
      else if ((level_flags_1 & 0x20) != 0) {
        FUN_0048b480();
        level_flags_1 = level_flags_1 ^ 0x20;
        FUN_0041b4f0();
      }
    }
    break;
  case 100:
    _render_state_flags = _render_state_flags | 8;
    break;
  case 0x65:
    _render_state_flags = _render_state_flags & 0xfffffff7;
    break;
  case 0x66:
    FUN_004af780(param_2,param_3);
    break;
  case 0x97:
    if ((game_state.tribes_array[iVar23].field_0x93d & 0x80) == 0) {
      set_tribe_command(CONCAT31(uVar18,player_tribe_num),0x5f,1,0);
    }
    else {
      set_tribe_command(CONCAT31(uVar18,player_tribe_num),0x5f,0,0);
    }
    break;
  case 0x99:
    DAT_0089ce6a = (undefined2)param_3;
    DAT_0089ce68 = (undefined2)param_2;
    if ((int)(screen_height * 0xd + (screen_height * 0xd >> 0x1f & 0xfU)) >> 4 < param_3) {
      DAT_0089ce6c = 2;
      if (DAT_0098e910 == '\0') {
        DAT_0098e910 = '\x02';
      }
      _DAT_0098e911 = param_2;
      _DAT_0098e915 = param_3;
      FUN_0049d010(param_2,param_3);
    }
    else {
      DAT_0089ce6c = 1;
      if (DAT_0098e910 == '\0') {
        DAT_0098e910 = '\x01';
      }
      _DAT_0098e911 = param_2;
      _DAT_0098e915 = param_3;
      FUN_0049d010(param_2,param_3);
    }
    break;
  case 0x9a:
    DAT_0098e910 = '\0';
    DAT_0089ce6c = 0;
    break;
  case 0x9b:
    if (DAT_0059ce08 == 0) {
      if ((land_flags_1 & 8) == 0) {
        FUN_00418810();
        if ((level_flags_1 & 0xc00000) != 0) {
          if (DAT_008956d3 != (FILE *)0x0) {
            _fclose(DAT_008956d3);
            DAT_008956d3 = (FILE *)0x0;
          }
          if (DAT_008956d7 != (FILE *)0x0) {
            _fclose(DAT_008956d7);
          }
          DAT_008956d7 = (FILE *)0x0;
          DAT_008956d3 = (FILE *)0x0;
          level_flags_1 = level_flags_1 & 0xff3fffff;
        }
        FUN_00499930();
        process_cmd(0x9a,0,0);
        iVar15 = FUN_00451370(2);
        if (iVar15 == 0) {
          FUN_00458060();
        }
        else {
          FUN_0045db60(0);
        }
      }
      else {
        FUN_00458060();
      }
    }
    else {
      DAT_0059ce08 = 0;
    }
    break;
  case 0x9c:
    switch(DAT_0089ce5a) {
    case 1:
      FUN_00418810();
      if (DAT_0089ce5b == '\0') {
        if ((DAT_0089569d == '\0') || ((byte)game_state._858439_1_ < 2)) {
          clear_tribe_session(1);
        }
        else {
          iVar15 = 0;
          psVar14 = struct_g2_ARRAY_00894cfe;
          land_flags_1 = land_flags_1 | 0x40;
          do {
            if (((*(byte *)psVar14 & 0xf) != 0) && ((*(uint *)&psVar14->field_0x1 & 4) == 0)) {
              (&DAT_008956a2)[iVar15] = 0;
              break;
            }
            psVar14 = psVar14 + 1;
            iVar15 = iVar15 + 1;
          } while (psVar14 < struct_g1_ARRAY_00894da6);
          DAT_008956a6 = 0;
        }
      }
      break;
    case 2:
      if (DAT_0089ce5b == '\0') {
        uVar16 = 9;
      }
      else if (DAT_0089ce5b == '\x01') {
        uVar16 = 10;
      }
      else {
        uVar16 = 9;
      }
      iVar15 = load_savegame(uVar16);
      if (iVar15 == 0) {
        pwVar25 = u__s___s_005cdbe8;
        uVar16 = DAT_00972f38;
      }
      else {
        load_level_flags = load_level_flags & 0xfbffffff;
        if (iVar15 == 2) {
          uVar16 = 10;
        }
        else {
          uVar16 = 2;
        }
        set_interface_state_2_3(uVar16);
        FUN_004194f0();
        pwVar25 = u__s___s_005cdbf8;
        uVar16 = DAT_00972f34;
      }
      _swprintf((wchar_t *)&local_320,pwVar25,DAT_00972f3c,uVar16);
      write_str_to_debug_buffer(&local_320,0x10,0xffffffff,0);
      break;
    case 3:
      if (DAT_0089ce5b == '\0') {
        uVar16 = 9;
      }
      else if (DAT_0089ce5b == '\x01') {
        uVar16 = 10;
      }
      else {
        uVar16 = 9;
      }
      iVar15 = write_savegame_2(uVar16);
      if (iVar15 == 0) {
        pwVar25 = u__s___s_005cdbc8;
        uVar16 = DAT_00972f38;
      }
      else {
        pwVar25 = u__s___s_005cdbd8;
        uVar16 = DAT_00972f34;
      }
      _swprintf((wchar_t *)&local_320,pwVar25,DAT_00972f40,uVar16);
      write_str_to_debug_buffer(&local_320,0x10,0xffffffff,0);
      break;
    case 4:
      DAT_005fcb14 = 1;
    }
    land_flags_1 = land_flags_1 & 0x7fffffff;
    break;
  case 0x9d:
    DAT_005fcb14 = 2;
    land_flags_1 = land_flags_1 & 0x7fffffff;
    break;
  case 0x9e:
    FUN_00479f00(0xb,0,0);
    break;
  case 0xa0:
    DAT_0098e908 = DAT_0098e908 | 8;
    break;
  case 0xa1:
  case 0xa3:
    DAT_0098e908 = DAT_0098e908 & 0xffd7;
    break;
  case 0xa2:
    DAT_0098e908 = DAT_0098e908 | 0x20;
    break;
  case 0xa4:
  case 0xa5:
  case 0xa6:
  case 0xa7:
  case 0xa8:
  case 0xa9:
  case 0xaa:
  case 0xab:
    uVar22 = CONCAT22(uVar19,DAT_0098e908) & 0xffff0020;
    FUN_00479ef0(param_1,CONCAT31((int3)(uVar22 >> 8),(short)uVar22 == 0));
    break;
  case 0xae:
    FUN_00417aa0(0);
    break;
  case 0xaf:
    iVar15 = FUN_00451370(2);
    if ((iVar15 == 0) && (DAT_0089bb89 != 0)) {
      FUN_004af440(DAT_0089bb82,(int)DAT_0089bb89);
    }
    break;
  case 0xb0:
    if ((DAT_0089bb81 == '\x02') || (DAT_0089bb81 == '\x03')) {
      DAT_0089bb81 = '\0';
      DAT_0089bb83 = '\x01';
      if (DAT_0089bb85._1_1_ != -1) {
        FUN_00431bb0(CONCAT31(uVar18,DAT_0089bb85._1_1_));
      }
      FUN_00479f00(10,(short)player_tribe_num,0);
      FUN_004af1c0(0x10);
      if (DAT_0089bb87 != '\0') {
        DAT_0089bb81 = '\x04';
      }
      if (DAT_0089bb83 == '\x02') {
        DAT_0089bb81 = '\0';
        process_cmd(0x9b,0,0);
      }
    }
    break;
  case 0xb1:
    set_interface_state_2_3(0xb);
    break;
  case 0xb4:
    iVar15 = FUN_004999d0();
    if (iVar15 == 0) {
      FUN_004999f0();
    }
    else {
      FUN_00499a00();
    }
    iVar15 = FUN_004999d0();
    _swprintf((wchar_t *)&local_320,u__s___s_005cdbb8,DAT_0097325c,
              (&DAT_00972ba8)[(iVar15 == 0) + 0xe9]);
    write_str_to_debug_buffer(&local_320,0x10,0xffffffff,0);
    break;
  case 0xb7:
    _DAT_0089d168 = 0xffffffff;
    DAT_0089d16c = 0xffff;
    break;
  case 0xb8:
    _DAT_0089d168 = 0;
    DAT_0089d16c = 0;
    break;
  case 0xb9:
    iVar15 = FUN_00451370(2);
    if (iVar15 == 0) {
      FUN_0047a550(CONCAT22(player_tribe_num >> 7,(short)DAT_0089c6ea),
                   player_tribe_num * 0xc65 + 0x89d1c8);
    }
    else {
      FUN_0045db60(0xffffffff);
    }
    break;
  case 0xba:
    iVar15 = FUN_00451370(2);
    if (iVar15 == 0) {
      FUN_0045db60(1);
    }
    else if ((((param_2 < DAT_005a21c6) || ((int)((uint)DAT_005a21ca + (int)DAT_005a21c6) < param_2)
              ) || (param_3 < DAT_005a21c8)) ||
            ((int)((uint)DAT_005a21cc + (int)DAT_005a21c8) < param_3)) {
      FUN_0045db60(1);
    }
    break;
  case 0xbb:
    DAT_0098e908 = DAT_0098e908 | 0x400;
    break;
  case 0xbc:
    DAT_0098e908 = DAT_0098e908 & 0xfbff;
    break;
  case 0xbd:
    DAT_0098e908 = DAT_0098e908 | 0x800;
    break;
  case 0xbe:
    DAT_0098e908 = DAT_0098e908 & 0xf7ff;
    break;
  case 0xc5:
    if (DAT_0059ce08 == 0) {
      if ((game_state._838239_1_ & 1) == 0) {
        FUN_0041fad0();
        FUN_0041d4b0(CONCAT31((int3)(CONCAT22(extraout_var,draw_mode + -2) >> 8),
                              '\x01' - ((short)(draw_mode + -2) == 0)));
      }
    }
    else {
      DAT_0059ce08 = 0;
    }
    break;
  case 0xcb:
    update_palettes_5(1);
    break;
  case 0xcc:
    FUN_0044bb30();
    break;
  case 0xcd:
    FUN_0044bb50();
    break;
  case 0xce:
    FUN_0044bb60();
  }
  if (bVar3) {
    return;
  }
  if ((land_flags_1 & 2) != 0) {
    return;
  }
  uVar18 = (undefined3)((uint)(param_1 + -0xf) >> 8);
  switch(param_1) {
  case 0xf:
    if ((DAT_0089c6e7 != '\x04') && (iVar17 = FUN_00451370(2), iVar17 == 0)) {
      if ((land_flags_1 & 8) == 0) {
        FUN_00479f00(5,iVar23,0);
        return;
      }
      set_tribe_command(player_tribe_num,0x1d,0);
      return;
    }
    break;
  case 0x10:
    if ((DAT_0089c6e7 != '\x04') && (iVar17 = FUN_00451370(2), iVar17 == 0)) {
      set_tribe_command(player_tribe_num,0x1f,0,0);
      return;
    }
    break;
  case 0x18:
    FUN_0047ac60();
    return;
  case 0x26:
  case 0x27:
  case 0x28:
  case 0x29:
    FUN_00479f00(0xc,(short)param_1 + -0x26,0);
    return;
  case 0x2a:
  case 0x2b:
    if ((game_state._838239_1_ & 1) == 0) {
      FUN_00479f00(0xf,0,(-(uint)(param_1 == 0x2a) & 2) - 1);
      return;
    }
    break;
  case 0x59:
    if (-1 < DAT_0089c6a1) {
      local_320 = CONCAT22(local_320._2_2_,(short)DAT_0089c6a1);
      iVar17 = local_320;
      local_320._0_1_ = (byte)DAT_0089c6a1;
      local_320._1_3_ = SUB43(iVar17,1);
      local_320 = CONCAT31(local_320._1_3_,(byte)local_320) & 0xfffffefe;
      local_32c = (ushort)(byte)local_320 << 8;
      local_32a = (ushort)local_320._1_1_ << 8;
      FUN_00417ca0(&local_32c,0xffffffff,0);
      DAT_0089c6a1 = -1;
    }
    FUN_00449080();
    return;
  case 0x5a:
    FUN_00483930();
    return;
  case 0x5b:
    if (10 < game_state.offset_counter_2) {
      if ((load_level_flags & 0x4000000) != 0) {
        FUN_0041b4f0();
        return;
      }
      level_flags_1 = level_flags_1 | 0x20;
      FUN_00479f00(8,0,1);
      if ((land_flags_1 & 8) == 0) {
        FUN_00479f00(10,(short)player_tribe_num,1);
      }
      FUN_0047aaa0();
      return;
    }
    break;
  case 0x5f:
    if ((land_flags_1 & 8) != 0) {
      FUN_004aee40(4,0);
      return;
    }
    break;
  case 0x60:
    FUN_00419a60(3,0,0);
    FUN_00419a20(0);
    return;
  case 0x61:
    if (*(short *)&game_state.tribes_array[player_tribe_num].field_0xa37 != 0) {
      puVar24 = (unit_struct *)0x0;
      iVar17 = 0xfffffff;
      local_320._0_2_ = game_state.tribes_array[player_tribe_num].x;
      local_320._2_2_ = game_state.tribes_array[player_tribe_num].y;
      for (puVar21 = allocated_units; puVar21 != (unit_struct *)0x0; puVar21 = puVar21->next_unit_1)
      {
        if (((puVar21->unit_class == '\x01') && (puVar21->unit_type == '\b')) &&
           ((puVar21->tribe_index == player_tribe_num &&
            (iVar23 = calc_distance_toroidal(&local_320,&puVar21->pos), iVar23 < iVar17)))) {
          iVar17 = iVar23;
          puVar24 = puVar21;
        }
      }
      if (puVar24 != (unit_struct *)0x0) {
        FUN_00419a60(0,0,0);
        if (game_state._838930_2_ != puVar24->unit_index) {
          game_state._838943_1_ = game_state._838943_1_ & 0xfd;
          game_state._838940_1_ = 0;
          game_state._838930_2_ = puVar24->unit_index;
        }
        FUN_00419a20(0);
        return;
      }
    }
    break;
  case 0x62:
    set_tribe_command(iVar23,0x68,0,0);
    return;
  case 0x67:
    if (DAT_0089ce43 != '\0') {
      bStack_338 = (byte)minimap_state_and_cache;
      bStack_337 = (byte)(minimap_state_and_cache >> 8);
      if (((bStack_338 & 0xfe) == 0xfe) || ((bStack_337 & 0xfe) == 0xfe)) {
        local_320 = (int)(short)(&game_state.level_data[0].height)
                                [((minimap_state_and_cache & 0xfe) * 2 |
                                 minimap_state_and_cache & 0xfe00) * 2];
        cVar12 = bStack_337 + 2;
        local_31c = (int)(short)(&game_state.level_data[0].height)
                                [((CONCAT11(cVar12,bStack_338) & 0xfe) * 2 |
                                 CONCAT11(cVar12,bStack_338) & 0xfe00) * 2];
        cVar11 = bStack_338 + 2;
        local_318 = (int)(short)(&game_state.level_data[0].height)
                                [((CONCAT11(cVar12,cVar11) & 0xfe) * 2 |
                                 CONCAT11(cVar12,cVar11) & 0xfe00) * 2];
        local_314 = (int)(short)(&game_state.level_data[0].height)
                                [((CONCAT11(bStack_337,cVar11) & 0xfe) * 2 |
                                 CONCAT11(bStack_337,cVar11) & 0xfe00) * 2];
      }
      else {
        uVar22 = (minimap_state_and_cache & 0xfe) * 2 | minimap_state_and_cache & 0xfe00;
        local_320 = (int)(short)(&game_state.level_data[0].height)[uVar22 * 2];
        local_31c = (int)(short)(&game_state.level_data[0x80].height)[uVar22 * 2];
        local_318 = (int)(short)(&game_state.level_data[0x81].height)[uVar22 * 2];
        local_314 = (int)(short)(&game_state.level_data[1].height)[uVar22 * 2];
      }
      iVar15 = 0x400;
      piVar20 = &local_320;
      do {
        if (*piVar20 < iVar15) {
          iVar15 = *piVar20;
        }
        piVar20 = piVar20 + 1;
      } while (piVar20 < local_310);
      DAT_0089d160 = 0;
      DAT_0089c6e1 = (undefined2)minimap_state_and_cache;
      uVar16 = FUN_004ba600(iVar15);
      game_state.tribes_array[iVar23].field1414_0x969[0x22] = uVar16;
      FUN_0047a550(0xe,iVar17);
      DAT_0098e908 = DAT_0098e908 | 0x10;
      return;
    }
    break;
  case 0x68:
    if (DAT_0089ce43 == '\0') {
      FUN_0048a050(0,0x25,1);
    }
    else {
      set_tribe_command(iVar23,99,1,minimap_state_and_cache);
    }
    DAT_0089c6e1 = 0xffff;
    FUN_0047a550(0,iVar17);
    DAT_0098e908 = DAT_0098e908 & 0xffef;
    return;
  case 0x69:
    if (DAT_0089d160 == '\0') {
      if (DAT_0089ce43 == '\0') {
        FUN_0048a050(0,0x25,1);
      }
      else {
        set_tribe_command(iVar23,100,0,minimap_state_and_cache);
      }
    }
    DAT_0089c6e1 = 0xffff;
    FUN_0047a550(0,iVar17);
    DAT_0098e908 = DAT_0098e908 & 0xffef;
    return;
  case 0x6a:
  case 0x6b:
    if (draw_mode != 2) {
      iVar17 = FUN_004c28a0(player_tribe_num * 0xc65 + 0x89d1c8,(int)DAT_0089ce81);
      uVar22 = (uint)(iVar17 == 3);
      if (uVar22 == 0) {
        FUN_00499d90(0x200,0x24b);
        return;
      }
      if ((((byte)opened_files_flags & 0x10) != 0) && ((land_flags_1 & 8) == 0)) {
        uVar22 = player_tribe_num * 99;
        game_state.tribes_array[player_tribe_num].field_0xc5e = 2;
      }
      uVar19 = (undefined2)(uVar22 >> 0x10);
      if (iVar17 == 2) {
        uVar16 = CONCAT22(uVar19,0x50);
      }
      else if (iVar17 == 3) {
        uVar16 = CONCAT22(uVar19,0x51);
      }
      else {
        uVar16 = CONCAT22(uVar19,0x4f);
      }
      FUN_004bb160(player_tribe_num * 0xc65 + 0x89d1c8,&local_328);
      local_320 = CONCAT31(local_320._1_3_,uStack_327) & 0xfffffffe;
      local_320 = CONCAT22(local_320._2_2_,CONCAT11(uStack_325,(byte)local_320)) & 0xfffffeff;
      if (unit_index_1 == 0) {
        uVar22 = (uint)unit_index_2;
        if (((uVar22 != 0) && (unit_land_array[uVar22]->unit_class == '\n')) &&
           (unit_land_array[uVar22]->unit_type == '\x10')) {
          uVar22 = 0;
        }
      }
      else {
        uVar22 = (uint)unit_index_1;
      }
      uVar13 = (ushort)uVar22;
      local_334 = CONCAT22((local_334._2_2_ ^ (local_334._2_2_ ^ uVar13) & 0x7ff) & 0x7ff ^
                           (short)DAT_0089ce81 << 0xb,(wchar_t)local_320);
      if (uVar22 == 0) {
        local_330 = _minimap_related_pos;
      }
      else {
        local_330._0_2_ = (unit_land_array[uVar22]->pos).x;
        local_330._2_2_ = (unit_land_array[uVar22]->pos).y;
      }
      uVar22 = local_330;
      cVar12 = FUN_00499ac0(DAT_0089ce81,&local_330);
      if (cVar12 != '\0') {
        set_tribe_command(player_tribe_num,uVar16,local_334,uVar22);
        DAT_0089bc20 = uVar13;
        if (uVar13 == 0) {
          DAT_0089bc20 = 0;
          local_320 = _minimap_related_pos;
          local_31c = local_31c & 0xffff0000;
          iVar17 = alloc_unit_2(7,0x3d,player_tribe_num,&local_320);
          if (iVar17 != 0) {
            *(short *)(iVar17 + 0x41) = *(short *)(iVar17 + 0x41) + -0xa0;
            *(undefined2 *)(iVar17 + 0x6c) = 4;
          }
        }
        DAT_0089bc1e = 5;
        FUN_0048a050(0,0x6a,1);
        if (param_1 != 0x6b) {
          FUN_0047a550(0,player_tribe_num * 0xc65 + 0x89d1c8);
          return;
        }
      }
    }
    break;
  case 0x6c:
    if (draw_mode != 2) {
      set_tribe_command(player_tribe_num,0x6f,0,0);
      FUN_0047a550(0,player_tribe_num * 0xc65 + 0x89d1c8);
      return;
    }
    break;
  case 0x6d:
    if ((draw_mode != 2) && (game_state.tribes_array[player_tribe_num].shaman != (unit_struct *)0x0)
       ) {
      local_320 = _minimap_related_pos;
      uVar22 = FUN_00499a70();
      if ((DAT_0098e908 & 0x800) != 0) {
        uVar22 = (uint)(uVar22 == 0);
      }
      iVar17 = (int)DAT_0089ce81;
      if (uVar22 != 0) {
        iVar17 = iVar17 + 0x80;
      }
      set_tribe_command(CONCAT31((int3)((uint)iVar17 >> 8),player_tribe_num),0x6e,iVar17,local_320);
      DAT_0089bc20 = 0;
      local_320 = _minimap_related_pos;
      local_31c = (uint)local_31c._2_2_ << 0x10;
      iVar17 = alloc_unit_2(7,0x3d,player_tribe_num,&local_320);
      if (iVar17 != 0) {
        *(short *)(iVar17 + 0x41) = *(short *)(iVar17 + 0x41) + -0xa0;
        *(undefined2 *)(iVar17 + 0x6c) = 4;
      }
      DAT_0089bc1e = 5;
      FUN_0048a050(0,0x6a,1);
      if (((DAT_009845ae == '\0') || (DAT_009846ae != '\0')) &&
         ((DAT_0098462e == '\0' || (DAT_0098472e != '\0')))) {
        FUN_0047a550(0,player_tribe_num * 0xc65 + 0x89d1c8);
        return;
      }
    }
    break;
  case 0x6e:
  case 0x6f:
    if (draw_mode == 2) {
      return;
    }
    bVar3 = true;
    local_320 = minimap_state_and_cache;
    if (param_1 == 0x6f) {
      DAT_0098e908 = DAT_0098e908 | 0x100;
    }
    else {
      DAT_0098e908 = DAT_0098e908 & 0xfeff;
    }
    uVar2 = (undefined1)((uint)_minimap_related_1 >> 8);
    uVar10 = (undefined1)((uint)_minimap_related_1 >> 0x18);
    if ((((level_flags._2_1_ & 1) == 0) || ((DAT_0098e908 & 0x400) != 0)) ||
       (((DAT_0098e908 & 0x800) != 0 &&
        (((DAT_009845ae != '\0' && (DAT_009846ae == '\0')) ||
         ((DAT_0098462e != '\0' && (DAT_0098472e == '\0')))))))) {
      if (DAT_0089c6e7 == '\f') {
        if ((minimap_state_and_cache & 0x10000) != 0) {
          DAT_0089c6cb = 0;
          DAT_0089bb5d = _minimap_related_1;
          uVar16 = 0x10;
          _DAT_0089bb59 = CONCAT11(uVar10,uVar2) & 0xfefe;
          DAT_0089bb5b = DAT_0089bb5b | 1;
          goto LAB_004ac840;
        }
      }
      else {
        puVar21 = (unit_struct *)0x0;
        if (((unit_index_1 != 0) &&
            (puVar24 = unit_land_array[unit_index_1], (*(byte *)&puVar24->flags_2 & 1) == 0)) &&
           (puVar24->unit_class != '\0')) {
          puVar21 = puVar24;
        }
        if (((puVar21 != (unit_struct *)0x0) && (puVar21->unit_class == '\x01')) &&
           (puVar21->tribe_index == player_tribe_num)) {
          DAT_0089bb5d._0_2_ = (puVar21->pos).x;
          DAT_0089bb5d._2_2_ = (puVar21->pos).y;
          _DAT_0089bb59 =
               CONCAT11((char)((ushort)(puVar21->pos).y >> 8),(char)((ushort)(puVar21->pos).x >> 8))
          ;
          goto joined_r0x004ac817;
        }
      }
    }
    else {
      puVar21 = (unit_struct *)0x0;
      if (((unit_index_1 != 0) &&
          (puVar24 = unit_land_array[unit_index_1], (*(byte *)&puVar24->flags_2 & 1) == 0)) &&
         (puVar24->unit_class != '\0')) {
        puVar21 = puVar24;
      }
      if (((puVar21 == (unit_struct *)0x0) || (puVar21->unit_class != '\x01')) ||
         (puVar21->tribe_index != player_tribe_num)) {
        if ((DAT_0089c6e7 != '\f') || ((minimap_state_and_cache & 0x10000) == 0)) goto LAB_004ac848;
        DAT_0089c6cb = 0;
        DAT_0089bb5d = _minimap_related_1;
        uVar16 = 0x10;
        _DAT_0089bb59 = CONCAT11(uVar10,uVar2) & 0xfefe;
        DAT_0089bb5b = DAT_0089bb5b | 1;
      }
      else {
        DAT_0089bb5d._0_2_ = (puVar21->pos).x;
        DAT_0089bb5d._2_2_ = (puVar21->pos).y;
        _DAT_0089bb59 =
             CONCAT11((char)((ushort)(puVar21->pos).y >> 8),(char)((ushort)(puVar21->pos).x >> 8));
joined_r0x004ac817:
        _DAT_0089bb59 = _DAT_0089bb59 & 0xfefe;
        DAT_0089c6cb = unit_index_1;
        bVar9 = DAT_0089bb5b | 1;
        if (unit_index_1 != 0) {
          DAT_0089bc20 = unit_index_1;
          DAT_0089bb5b = DAT_0089bb5b | 1;
          DAT_0089bc1e = 5;
          DAT_0089c6cb = DAT_0089bc20;
          FUN_0048a050(0,0x6a,1);
          bVar9 = DAT_0089bb5b;
        }
        DAT_0089bb5b = bVar9;
        uVar16 = 0xf;
      }
LAB_004ac840:
      bVar3 = false;
      FUN_0047a550(uVar16,iVar17);
    }
LAB_004ac848:
    if ((bVar3) && ((local_320 & 0x10000) != 0)) {
      set_data_to_rddata_chunk(0x6a,(DAT_0098e908 & 0x100) != 0,_minimap_related_1);
      DAT_0089bc20 = 0;
      local_320 = _minimap_related_1;
      local_31c = (uint)local_31c._2_2_ << 0x10;
      iVar23 = alloc_unit_2(7,0x3d,player_tribe_num,&local_320);
      if (iVar23 != 0) {
        *(short *)(iVar23 + 0x41) = *(short *)(iVar23 + 0x41) + -0xa0;
        *(undefined2 *)(iVar23 + 0x6c) = 4;
      }
      DAT_0089bc1e = 5;
      FUN_0048a050(0,0x6a,1);
      FUN_0047a550(9,iVar17);
      return;
    }
    break;
  case 0x71:
    if (DAT_0089c6e7 == '\t') {
      set_data_to_rddata_chunk(0x6c,(DAT_0098e908 & 0x100) != 0,_minimap_related_1);
    }
    else {
      puVar21 = local_220;
      if (DAT_0089c6cb != 0) {
        puVar21 = unit_land_array[(short)DAT_0089c6cb];
      }
      if ((level_flags._2_1_ & 1) == 0) {
        if (((DAT_0089c6cb != 0) && (cVar12 = FUN_004de610(puVar21), cVar12 == '\0')) &&
           (puVar21->unit_land_array_index == 0)) {
          set_tribe_command(player_tribe_num,0x2a,1,(int)(short)DAT_0089c6cb);
        }
      }
      else if (((DAT_0089c6cb != 0) && (cVar12 = FUN_004de610(puVar21), cVar12 == '\0')) &&
              (puVar21->unit_land_array_index == 0)) {
        set_tribe_command(player_tribe_num,0x7b,(DAT_0098e908 & 0x100) != 0,(int)(short)DAT_0089c6cb
                         );
      }
    }
    DAT_0089c6cb = 0;
    DAT_0089c6e7 = 0;
    return;
  case 0x72:
    iVar17 = FUN_00451370(2);
    if (((iVar17 == 0) && ((level_flags_1 & 0x20) == 0)) &&
       (cVar12 = FUN_0047ae00(1,1), cVar12 != '\0')) {
      DAT_0098e908 = DAT_0098e908 | 0xc0;
      return;
    }
    break;
  case 0x73:
    DAT_0098e908 = DAT_0098e908 & 0xff7f;
    return;
  case 0x74:
    uVar22 = (_minimap_centre_x & 0xfe) * 2 | _minimap_centre_x & 0xfe00;
    set_tribe_command(CONCAT31((int3)((_minimap_centre_x & 0xfe00) >> 8),player_tribe_num),0x2b,
                      (&game_state.level_data[0].unit_index_2)[uVar22 * 2] & 0x3ff,0);
    uVar13 = (&game_state.level_data[0].unit_index_2)[uVar22 * 2] & 0x3ff;
    if (uVar13 != 0) {
      DAT_0089bc1e = 5;
      DAT_0089bc20 = uVar13;
      FUN_0048a050(0,0x6a,1);
      return;
    }
    break;
  case 0x75:
    set_tribe_command(CONCAT31(uVar18,player_tribe_num),0x60,unit_index_2,0);
    if (unit_index_2 != 0) {
      DAT_0089bc20 = unit_index_2;
      DAT_0089bc1e = 5;
      FUN_0048a050(0,0x6a,1);
      return;
    }
    break;
  case 0x76:
    set_tribe_command(CONCAT31(uVar18,player_tribe_num),0x67,1,unit_index_2);
    if (unit_index_2 != 0) {
      DAT_0089bc20 = unit_index_2;
      DAT_0089bc1e = 5;
      FUN_0048a050(0,0x6a,1);
      return;
    }
    break;
  case 0x77:
  case 0x78:
    bVar3 = false;
    bVar4 = false;
    bVar6 = true;
    bVar5 = false;
    local_320 = 0;
    if ((_minimap_centre_x & 0x10000) != 0) {
      iVar17 = (int)DAT_00895de0;
      cVar12 = (&DAT_005a8858)[iVar17 * 0x12];
      uVar2 = (&DAT_005a885a)[iVar17 * 0x12];
      if (cVar12 == '\x11') {
        cVar11 = FUN_004b98f0(minimap_state_and_cache,iVar23,0);
        if (cVar11 == '\0') {
          cVar11 = FUN_004ba640(minimap_state_and_cache & 0xffff);
          if (cVar11 == '\0') {
LAB_004acc59:
            bVar4 = true;
          }
          else {
            bVar3 = true;
          }
        }
      }
      else if ((land_flags_1 & 0x200000) != 0) {
        cVar11 = FUN_004ba6b0(CONCAT22((short)((uint)(iVar17 * 2) >> 0x10),
                                       (undefined2)minimap_state_and_cache),CONCAT11(uVar2,cVar12),
                              uVar2,CONCAT31((int3)((uint)(iVar17 * 2) >> 8),player_tribe_num));
        if (cVar11 == '\0') goto LAB_004acc59;
        local_320 = 1;
      }
      if (bVar4) {
        FUN_0049a060();
        FUN_0048a050(0,0x25,1);
      }
      else if (bVar3) {
        for (puVar21 = unit_land_array
                       [(short)(&game_state.level_data[0].unit_index)
                               [((_minimap_centre_x & 0xfe) * 2 | _minimap_centre_x & 0xfe00) * 2]];
            puVar21 != (unit_struct *)0x0; puVar21 = unit_land_array[puVar21->next_unit_index]) {
          if (((PTR_008922d8 != puVar21) && (puVar21->unit_class == '\n')) &&
             (puVar21->unit_type == '\x10')) {
            FUN_004ef180(puVar21);
          }
        }
      }
      else if (local_320 == 0) {
        bVar5 = true;
        if ((param_1 != 0x78) && (cVar12 != '\n')) {
          bVar6 = false;
        }
        FUN_0048a050(0,0x24,1);
        set_tribe_command(iVar23,(-(cVar12 == '\x11') & 0x54U) + 0xe,CONCAT11(uVar2,cVar12),
                          minimap_state_and_cache);
      }
      else {
        set_tribe_command(player_tribe_num,0x69,CONCAT11(uVar2,cVar12),_minimap_centre_x);
      }
    }
    if (bVar5) {
      FUN_004b9150();
      FUN_004ba5d0();
    }
    if (!bVar6) {
      FUN_0047a550(0,player_tribe_num * 0xc65 + 0x89d1c8);
      return;
    }
    break;
  case 0x79:
    set_tribe_command(CONCAT31(uVar18,player_tribe_num),0x11,0,_minimap_centre_x);
    FUN_0044b100();
    return;
  case 0x7a:
    puVar21 = (unit_struct *)0x0;
    if (((unit_index_2 != 0) &&
        (puVar24 = unit_land_array[unit_index_2], (*(byte *)&puVar24->flags_2 & 1) == 0)) &&
       (puVar24->unit_class != '\0')) {
      puVar21 = puVar24;
    }
    if (((puVar21 != (unit_struct *)0x0) && (puVar21->unit_class == '\n')) &&
       (puVar21->unit_type == '\x10')) {
      FUN_004ef180(puVar21);
    }
    FUN_0044b100();
    return;
  case 0x7b:
    pcVar1 = &DAT_005a885a + DAT_00895de0 * 0x12;
    cVar12 = *pcVar1;
    *pcVar1 = cVar12 + '\x01';
    if ('\x03' < (char)(cVar12 + '\x01')) {
      *pcVar1 = '\0';
    }
    FUN_0048a050(0,0x26,1);
    return;
  case 0x7c:
    FUN_004b9150();
    FUN_004ba5d0();
    FUN_0047a550(0,player_tribe_num * 0xc65 + 0x89d1c8);
    FUN_0044b100();
    return;
  case 0x7d:
    cVar12 = FUN_004de610(unit_land_array[unit_index_1]);
    if ((cVar12 == '\0') &&
       (set_tribe_command(player_tribe_num,0x2a,0,unit_index_1), unit_index_1 != 0)) {
      DAT_0089bc20 = unit_index_1;
      DAT_0089bc1e = 5;
      FUN_0048a050(0,0x6a,1);
      return;
    }
    break;
  case 0x7e:
    if (draw_mode != 2) {
      uVar22 = FUN_004999d0();
      if ((DAT_0098e908 & 0x800) != 0) {
        uVar22 = (uint)(uVar22 == 0);
      }
      FUN_004aa8b0(0,'\x01' - (uVar22 == 0),
                   CONCAT11((char)(DAT_0098e908 >> 8),'\x01' - ((DAT_0098e908 & 0x400) == 0)) &
                   0x4ff);
      return;
    }
    break;
  case 0x7f:
    if (draw_mode != 2) {
      uVar22 = FUN_004999d0();
      if ((DAT_0098e908 & 0x800) != 0) {
        uVar22 = (uint)(uVar22 == 0);
      }
      FUN_004aa8b0(1,'\x01' - (uVar22 == 0),
                   CONCAT11((char)(DAT_0098e908 >> 8),'\x01' - ((DAT_0098e908 & 0x400) == 0)) &
                   0x4ff);
      return;
    }
    break;
  case 0x80:
    set_tribe_command(player_tribe_num,0x27,0,0);
    return;
  case 0x83:
    if (draw_mode != 2) {
      set_tribe_command(player_tribe_num,0x1e,0,0);
      FUN_004199b0(&DAT_00895de6);
      return;
    }
    break;
  case 0x84:
  case 0x85:
  case 0x86:
  case 0x87:
  case 0x88:
  case 0x89:
    FUN_0047c350(cVar12 + '}',0,0,0);
    return;
  case 0x8a:
  case 0x8b:
  case 0x8c:
  case 0x8d:
  case 0x8e:
  case 0x8f:
    uVar16 = 1;
    if (((DAT_009845ae != '\0') && (DAT_009846ae == '\0')) ||
       ((DAT_0098462e != '\0' && (DAT_0098472e == '\0')))) {
      uVar16 = 0;
    }
    FUN_0047c350(cVar12 + 'w',1,0,uVar16);
    return;
  case 0x90:
  case 0x91:
  case 0x92:
  case 0x93:
  case 0x94:
  case 0x95:
    uVar16 = 1;
    if (((DAT_009845ae != '\0') && (DAT_009846ae == '\0')) ||
       ((DAT_0098462e != '\0' && (DAT_0098472e == '\0')))) {
      uVar16 = 0;
    }
    FUN_0047c350(cVar12 + 'q',1,1,uVar16);
    return;
  case 0x96:
    iVar17 = (int)player_tribe_num;
    local_320 = CONCAT31(local_320._1_3_,
                         (char)((ushort)*(undefined2 *)&game_state.tribes_array[iVar17].field_0x911
                               >> 8)) & 0xfffffffe;
    uVar13 = CONCAT11((char)((ushort)*(undefined2 *)&game_state.tribes_array[iVar17].field_0x913 >>
                            8),(byte)local_320);
    local_320 = CONCAT22(local_320._2_2_,uVar13) & 0xfffffeff;
    set_data_to_rddata_chunk
              (0x16,uVar13 & 0xfeff,(int)(short)game_state.tribes_array[iVar17].angle_1);
    return;
  case 0x98:
    FUN_0047c350(0,1,0,0);
    return;
  case 0xb2:
    puVar21 = unit_land_array[unit_index_2];
    if ((puVar21 != (unit_struct *)0x0) && (puVar21->unit_class == '\x02')) {
      set_tribe_command(CONCAT31(uVar18,player_tribe_num),0x40,
                        (*(ushort *)&puVar21->field_0x9c & 0x8000) == 0,(uint)unit_index_2);
      FUN_00504060(puVar21,0);
      if (unit_index_2 != 0) {
        DAT_0089bc20 = unit_index_2;
        DAT_0089bc1e = 5;
        FUN_0048a050(0,0x6a,1);
        return;
      }
    }
    break;
  case 0xb3:
    iVar17 = FUN_0049a220(_minimap_centre_x & 0xffff,iVar23);
    if (iVar17 != 0) {
      set_tribe_command(iVar23,0x78,0,minimap_state_and_cache);
      local_320 = _minimap_centre_x & 0xfffe;
      uVar13 = (ushort)local_320;
      local_320._1_1_ = (byte)(local_320 >> 8) & 0xfe;
      local_32c = ((uVar13 & 0xff) + 1) * 0x100;
      local_32a = (local_320._1_1_ + 1) * 0x100;
      DAT_0089bc20 = 0;
      local_320 = CONCAT22(local_32a,local_32c);
      local_31c = (uint)local_31c._2_2_ << 0x10;
      iVar17 = alloc_unit_2(7,0x3d,player_tribe_num,&local_320);
      if (iVar17 != 0) {
        *(short *)(iVar17 + 0x41) = *(short *)(iVar17 + 0x41) + -0xa0;
        *(undefined2 *)(iVar17 + 0x6c) = 4;
      }
      DAT_0089bc1e = 5;
      FUN_0048a050(0,0x6a,1);
      return;
    }
    break;
  case 0xbf:
    set_tribe_command(player_tribe_num,0x7c,0,0);
    write_str_to_debug_buffer(DAT_00973020,0x10,player_tribe_num,0);
    DAT_0089c6a1 = 0xffffffff;
    return;
  case 0xc0:
    set_tribe_command(iVar23,0x7e,0,0);
    return;
  case 0xc1:
    uVar16 = FUN_004999d0(0);
    set_tribe_command(iVar23,0x82,uVar16);
    return;
  case 0xc2:
  case 0xc3:
    cVar12 = FUN_004c2830();
    if (cVar12 != '\0') {
      local_320._1_3_ = (undefined3)(minimap_state_and_cache >> 8);
      local_320 = CONCAT31(local_320._1_3_,(char)((ushort)minimap_related_2.x >> 8) + '\x01') &
                  0xfffffffe;
      local_320 = CONCAT22(local_320._2_2_,
                           CONCAT11((char)((ushort)minimap_related_2.y >> 8) + '\x01',
                                    (byte)local_320)) & 0xfffffeff;
      set_tribe_command(iVar23,0x85,param_1 == 0xc3,local_320);
      DAT_0089bc20 = 0;
      local_320 = CONCAT22(minimap_related_2.y,minimap_related_2.x);
      local_31c = (uint)local_31c._2_2_ << 0x10;
      iVar17 = alloc_unit_2(7,0x3d,player_tribe_num,&local_320);
      if (iVar17 != 0) {
        *(short *)(iVar17 + 0x41) = *(short *)(iVar17 + 0x41) + -0xa0;
        *(undefined2 *)(iVar17 + 0x6c) = 4;
      }
      DAT_0089bc1e = 5;
      FUN_0048a050(0,0x6a,1);
      return;
    }
    break;
  case 0xc4:
    iVar17 = FUN_004c28a0(player_tribe_num * 0xc65 + 0x89d1c8,(int)DAT_0089ce81);
    if (iVar17 != 3) {
      return;
    }
    FUN_004bb160(player_tribe_num * 0xc65 + 0x89d1c8,&local_328);
    local_320 = CONCAT31(local_320._1_3_,uStack_327) & 0xfffffffe;
    local_320 = CONCAT22(local_320._2_2_,CONCAT11(uStack_325,(byte)local_320)) & 0xfffffeff;
    local_334 = CONCAT22(local_334._2_2_ & 0x7ff ^ (short)DAT_0089ce81 << 0xb,(wchar_t)local_320);
    uVar22 = (uint)unit_index_1;
    if (uVar22 == 0) {
      uVar22 = (uint)unit_index_2;
      if ((uVar22 == 0) ||
         ((unit_land_array[uVar22]->unit_class == '\n' &&
          (unit_land_array[uVar22]->unit_type == '\x10')))) {
        uVar22 = 0;
      }
      if (uVar22 == 0) {
        local_330 = _minimap_related_pos;
        goto LAB_004ad512;
      }
    }
    local_330._0_2_ = (unit_land_array[uVar22]->pos).x;
    local_330._2_2_ = (unit_land_array[uVar22]->pos).y;
LAB_004ad512:
    uVar8 = local_330;
    DAT_0089bc20 = (ushort)uVar22;
    if (DAT_0089bc20 == 0) {
      DAT_0089bc20 = 0;
      local_320 = local_330;
      local_31c = local_31c & 0xffff0000;
      iVar17 = alloc_unit_2(7,0x3d,player_tribe_num,&local_320);
      if (iVar17 != 0) {
        *(short *)(iVar17 + 0x41) = *(short *)(iVar17 + 0x41) + -0xa0;
        *(undefined2 *)(iVar17 + 0x6c) = 4;
      }
    }
    DAT_0089bc1e = 5;
    FUN_0048a050(0,0x6a,1);
    set_tribe_command(iVar23,0x84,local_334,uVar8);
    return;
  case 0xc6:
    level_flags_2 = level_flags_2 ^ 2;
  }
  return;
}
