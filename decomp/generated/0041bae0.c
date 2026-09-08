/* Ghidra 12.1.3 pseudocode; entry 0041bae0; FUN_0041bae0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */

void FUN_0041bae0(void)

{
  short *psVar1;
  bool bVar2;
  ushort uVar3;
  int iVar4;
  undefined2 extraout_var;
  undefined1 unaff_retaddr;
  undefined4 local_4;

  if (DAT_0089bbf7 == '\0') {
    return;
  }
  if (DAT_0089bbf7 != '\x01') {
    if (DAT_0089bbf7 != '\x02') {
      return;
    }
    switch(DAT_0089bbf8) {
    case '\0':
      DAT_0089bbf8 = DAT_0089bbf8 + '\x01';
      DAT_0089bbfb = 0x40;
      return;
    case '\x01':
      goto switchD_0041be0d_caseD_1;
    case '\x02':
      DAT_0089bbf8 = DAT_0089bbf8 + '\x01';
      FUN_004af440(0,0x3c4);
      return;
    case '\x03':
      if (DAT_0089bb83 != '\x01') {
        return;
      }
      DAT_0089bbf8 = DAT_0089bbf8 + '\x01';
      FUN_004af0a0(0);
      bVar2 = true;
      local_4 = 0xed001b00;
      if (((DAT_0089bc17 != '\0') && (DAT_0089bbff == 0x1b00)) &&
         ((DAT_0089bc01 == -0x1300 && (cam_1_angle_related == 0x211)))) {
        bVar2 = false;
      }
      if (bVar2) {
        DAT_0089bc17 = '\0';
        FUN_00417d80(&local_4,0x211);
      }
      FUN_00448fa0();
      DAT_0089bbfb = 0x40;
      game_state._838943_1_ = game_state._838943_1_ & 0xfd;
      DAT_0089c6e3 = 0;
      game_state._838940_1_ = 0;
      return;
    case '\x04':
      DAT_0089bbfb = DAT_0089bbfb + -1;
      if (0 < DAT_0089bbfb) {
        return;
      }
      DAT_0089bbf8 = DAT_0089bbf8 + '\x01';
      FUN_004af440(0,0x3c3);
      return;
    case '\x05':
      if (DAT_0089bb83 != '\x01') {
        return;
      }
      DAT_0089bbf8 = DAT_0089bbf8 + '\x01';
      FUN_004af0a0(0);
      bVar2 = true;
      if ((((DAT_0089bc17 != '\0') && (DAT_0089bbf3 == DAT_0089bbff)) &&
          (DAT_0089bbf5 == DAT_0089bc01)) && (cam_1_angle_related == DAT_0089bbf9)) {
        bVar2 = false;
      }
      if (bVar2) {
        DAT_0089bc17 = '\0';
        FUN_00417d80(&DAT_0089bbf3,CONCAT22(extraout_var,DAT_0089bbf9));
      }
      FUN_00448fa0();
      DAT_0089bbfb = 0x10;
      game_state._838943_1_ = game_state._838943_1_ & 0xfd;
      DAT_0089c6e3 = 0;
      game_state._838940_1_ = 0;
      return;
    case '\x06':
      DAT_0089bbfb = DAT_0089bbfb + -1;
      if (0 < DAT_0089bbfb) {
        return;
      }
      FUN_004af1c0(1);
      DAT_0089bbf7 = 0;
      return;
    default:
      return;
    }
  }
  if (DAT_0089bbf8 != '\0') {
    if (DAT_0089bbf8 == '\x01') {
      if ((DAT_0089bbfb != 0) && (DAT_0089bbfb = DAT_0089bbfb + -1, DAT_0089bbfb != 0)) {
        return;
      }
      DAT_0089bbf8 = 2;
      DAT_0089bbfb = 0x10;
      FUN_004af0a0(8);
      FUN_00479f00(10,(short)player_tribe_num,0);
      local_4 = CONCAT31(local_4._1_3_,(char)((ushort)DAT_0089bbf3 >> 8)) & 0xfffffffe;
      local_4 = CONCAT22(local_4._2_2_,
                         CONCAT11((char)((ushort)DAT_0089bbf5 >> 8),(undefined1)local_4)) &
                0xfffffeff;
      set_globe_coord_centre(local_4,CONCAT13(unaff_retaddr,local_4._1_3_));
      return;
    }
    if (DAT_0089bbf8 != '\x02') {
      return;
    }
    DAT_0089bbfb = DAT_0089bbfb + -1;
    if (0 < DAT_0089bbfb) {
      return;
    }
    FUN_004af1c0(8);
    DAT_0089bbf7 = 0;
    return;
  }
  DAT_0089bbf8 = 1;
  DAT_0089bbfb = 4;
  set_draw_mode(0,player_tribe_num * 0xc65 + 0x89d1c8);
  iVar4 = (int)player_tribe_num;
  DAT_0089ce36 = '\0';
  psVar1 = &game_state.tribes_array[iVar4].x;
  *psVar1 = *psVar1 + 0x2000;
  if (level_hdr_mem.angle != 0) {
    game_state.tribes_array[iVar4].angle_1 = level_hdr_mem.angle;
  }
  if (((byte)level_flags & 8) != 0) goto LAB_0041bc61;
  if (draw_mode == 2) {
    FUN_0041fb10();
    FUN_0041d450(100000,0xe);
    goto LAB_0041bc61;
  }
  if (DAT_0089c6e7 == '\t') {
    set_data_to_rddata_chunk(0x6c,(DAT_0098e908 & 0x100) != 0,minimap_state_and_cache);
    FUN_00443d30(player_tribe_num * 0xc65 + 0x89d1c8,&rddata_chunk_data_0089798d);
LAB_0041bc2f:
    FUN_004b00c0();
  }
  else if (DAT_0089c6e7 == '\a') {
    FUN_004b9150();
    FUN_004ba5d0();
    goto LAB_0041bc2f;
  }
  if (DAT_0089ce36 == '\0') {
    DAT_0089ce36 = '\v';
  }
LAB_0041bc61:
  while ((((DAT_0089ce36 != '\0' || (DAT_0089ce34 != '\0')) || (DAT_0089ce35 != '\0')) ||
         (DAT_0089bc17 != '\0'))) {
    FUN_00418950();
    FUN_00417510();
    if (DAT_0089ce35 != '\0') {
      iVar4 = (int)player_tribe_num;
      DAT_0089ce35 = DAT_0089ce35 + -1;
      if (DAT_0089c6c9 == 0) {
        DAT_0089ce35 = '\0';
      }
      else if (DAT_0089ce35 == '\0') {
        game_state.tribes_array[iVar4].angle_1 = DAT_0089c6c7;
      }
      else {
        uVar3 = game_state.tribes_array[iVar4].angle_1 + DAT_0089c6c9;
        game_state.tribes_array[iVar4].angle_1 = uVar3;
        game_state.tribes_array[iVar4].angle_1 = uVar3 & 0x7ff;
      }
      _render_state_flags = _render_state_flags | 0x80;
    }
    FUN_00418270();
  }
  DAT_0089ce36 = 0;
  DAT_0089ce34 = 0;
  DAT_0089ce35 = 0;
  DAT_0089bc17 = 0;
  while (DAT_005fe420 != 0) {
    FUN_0041d680();
  }
  FUN_004af0a0(8);
  FUN_00479f00(10,(short)player_tribe_num,0);
  return;
switchD_0041be0d_caseD_1:
  DAT_0089bbfb = DAT_0089bbfb + -1;
  if (0 < DAT_0089bbfb) {
    return;
  }
  DAT_0089bbf8 = DAT_0089bbf8 + '\x01';
  return;
}
