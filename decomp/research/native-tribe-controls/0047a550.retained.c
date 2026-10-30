/* Ghidra 12.1.3 pseudocode; entry 0047a550; FUN_0047a550.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */

void FUN_0047a550(short param_1,int param_2)

{
  char cVar1;
  short sVar2;
  int iVar3;
  int iVar4;
  undefined4 *puVar5;

  sVar2 = (short)DAT_0089c6e7;
  if (*(char *)(param_2 + 0xc22) != player_tribe_num) {
    return;
  }
  if ((param_1 == 0) && (iVar3 = FUN_00418d70(param_2), 0 < iVar3)) {
    param_1 = 0xc;
  }
  if (sVar2 == param_1) {
    return;
  }
  DAT_0089c6e7 = (char)param_1;
  _DAT_0089c6b9 = 0;
  DAT_0089c6e8 = 0;
  switch(param_1) {
  case 0:
  case 7:
    DAT_00895dd4 = 0;
    if (sVar2 == 8) {
      FUN_0049d010((int)DAT_00895ddc,(int)DAT_00895dde);
      DAT_00895dd4 = 0;
      _minimap_centre_x = DAT_00895dd8;
    }
    break;
  case 6:
  case 8:
    DAT_00895de2 = 5;
    break;
  case 10:
    if (sVar2 != 0xb) {
      load_level_flags = load_level_flags | 0x20000;
      DAT_00895e9c = 1;
    }
    break;
  case 0xb:
    DAT_00895e76 = (short)screen_coord_3_x;
    load_level_flags = load_level_flags & 0xfffdffff;
    DAT_00895e78 = (short)screen_coord_3_y;
    FUN_0049d010((int)(screen_width / 2),(int)(screen_height / 2));
    break;
  case 0xc:
    iVar3 = FUN_00418d70(param_2);
    if (iVar3 == 0) {
      DAT_0089c6e7 = 0;
    }
    else {
      FUN_0048a050(0,0x62,1);
      puVar5 = &DAT_00895df6;
      for (iVar4 = 0x20; iVar4 != 0; iVar4 = iVar4 + -1) {
        *puVar5 = 0;
        puVar5 = puVar5 + 1;
      }
      FUN_00438720();
      FUN_004199c0(&DAT_00895de6);
      load_level_flags = load_level_flags | 0x20000;
      DAT_00895e9c = 1;
      FUN_00437010(1);
      if (((iVar3 == 1) && (*(int *)(param_2 + 0x89d) != 0)) &&
         ((*(byte *)(*(int *)(param_2 + 0x89d) + 0x7a) & 0x80) != 0)) {
        FUN_0044bb30();
      }
    }
  }
  if ((param_1 != 0) && (param_1 != 0xc)) {
    game_state._838940_1_ = 0;
    game_state._838943_1_ = game_state._838943_1_ & 0xfd;
  }
  if (DAT_0089ce6c == '\0') {
    if (((game_state.level_flags & 0x20) == 0) || ((DAT_0098e908._1_1_ & 8) == 0)) {
      switch(DAT_0089c6e7) {
      case '\n':
      case '\f':
        cVar1 = DAT_00895e98;
        break;
      default:
        cVar1 = '\x0e';
        break;
      case '\r':
        cVar1 = ((byte)sprite_animation_counter & 3) + 0x1e;
        break;
      case '\x11':
        cVar1 = '\r';
      }
    }
    else {
      cVar1 = '\x1b';
    }
  }
  else {
    cVar1 = '\x01';
  }
  if (cVar1 == '\0') {
    if (current_frame_buffer == '\0') goto LAB_0047a7c0;
    current_frame_buffer = '\0';
    iVar3 = 0;
  }
  else {
    if (current_frame_buffer == cVar1) goto LAB_0047a7c0;
    iVar3 = cVar1 * 8 + point_0_end;
    current_frame_buffer = cVar1;
  }
  update_screen_2(iVar3,0,0);
LAB_0047a7c0:
  switch(sVar2) {
  case 7:
    FUN_004b9150();
    FUN_004ba5d0();
    DAT_00895dd4 = 0;
    return;
  case 10:
  case 0xc:
    load_level_flags = load_level_flags & 0xfffbffef;
    return;
  case 0xb:
    FUN_0049d010((int)DAT_00895e76,(int)DAT_00895e78);
    return;
  case 0xd:
    DAT_0089ce81 = 0xff;
    FUN_0044b890();
  }
  return;
}
