/* Ghidra 12.1.3 pseudocode; entry 00418950; FUN_00418950.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */

void FUN_00418950(void)

{
  short sVar1;
  short sVar2;
  int iVar3;
  int iVar4;
  undefined4 uVar5;
  vconfig_struct *pvVar6;
  int *piVar7;
  undefined4 uVar8;

  switch(DAT_0089ce36) {
  case 0xb:
    FUN_0041fac0();
    FUN_0048b850();
    maybe_sound_1(1);
    DAT_0089c6eb = vconfig_index_start;
    land_flags_1 = land_flags_1 | 0x100000;
    vconfig_index_start = 4;
    DAT_0089d172 = (byte)((int)(maybe_framerate * 3 + (maybe_framerate * 3 >> 0x1f & 3U)) >> 2) &
                   0xfe;
    if ((char)DAT_0089d172 < '\b') {
      DAT_0089d172 = 8;
    }
    if (' ' < (char)DAT_0089d172) {
      DAT_0089d172 = 0x20;
    }
    if ((level_flags_1._2_1_ & 0x10) != 0) {
      DAT_0089d172 = (byte)(((int)(char)DAT_0089d172 << 8) / DAT_0089c6a9);
    }
    DAT_0089ce34 = DAT_0089d172;
    pvVar6 = &vconfig_struct_0088f004;
    piVar7 = &DAT_0088f062;
    for (iVar3 = 0x17; iVar3 != 0; iVar3 = iVar3 + -1) {
      *piVar7 = pvVar6->field0_0x0;
      pvVar6 = (vconfig_struct *)&pvVar6->field1_0x4;
      piVar7 = piVar7 + 1;
    }
    *(short *)piVar7 = (short)pvVar6->field0_0x0;
    DAT_0089ce36 = 0xc;
    FUN_0041cdc0((int)(short)game_state.tribes_array[player_tribe_num].angle_1);
    iVar3 = (int)player_tribe_num;
    DAT_0089d172 = (byte)((int)(maybe_framerate * 3 + (maybe_framerate * 3 >> 0x1f & 3U)) >> 2) &
                   0xfe;
    if ((char)DAT_0089d172 < '\b') {
      DAT_0089d172 = 8;
    }
    if (' ' < (char)DAT_0089d172) {
      DAT_0089d172 = 0x20;
    }
    iVar4 = (int)(char)DAT_0089d172;
    if ((level_flags_1._2_1_ & 0x10) != 0) {
      iVar4 = (iVar4 << 8) / DAT_0089c6a9;
    }
    _DAT_0089c6c5 = game_state.tribes_array[iVar3].angle_1;
    DAT_0089ce35 = (undefined1)iVar4;
    DAT_0089c6c7 = 0;
    uVar5 = CONCAT22((short)((uint)(iVar3 * 0xc65 + 0x89d1c8) >> 0x10),
                     game_state.tribes_array[iVar3].angle_1);
    sVar1 = calc_abs_angular_diff(0,uVar5);
    sVar2 = calc_angular_diff_shortest(0,uVar5);
    DAT_0089c6c9 = (short)((int)(short)(sVar1 * sVar2) / iVar4);
    return;
  case 0xc:
    if (DAT_0089ce34 == '\x01') {
      set_draw_mode(2,player_tribe_num * 0xc65 + 0x89d1c8);
      FUN_0041d410(0x224f8);
      DAT_0089ce36 = 0;
      return;
    }
    break;
  case 0xe:
    land_flags_1 = land_flags_1 | 0x100000;
    vconfig_index_start = DAT_0089c6eb;
    DAT_0089d172 = (byte)((int)(maybe_framerate * 3 + (maybe_framerate * 3 >> 0x1f & 3U)) >> 2) &
                   0xfe;
    if ((char)DAT_0089d172 < '\b') {
      DAT_0089d172 = 8;
    }
    if (' ' < (char)DAT_0089d172) {
      DAT_0089d172 = 0x20;
    }
    if ((level_flags_1._2_1_ & 0x10) != 0) {
      DAT_0089d172 = (byte)(((int)(char)DAT_0089d172 << 8) / DAT_0089c6a9);
    }
    DAT_0089ce34 = DAT_0089d172;
    pvVar6 = &vconfig_struct_0088f004;
    piVar7 = &DAT_0088f062;
    for (iVar3 = 0x17; iVar3 != 0; iVar3 = iVar3 + -1) {
      *piVar7 = pvVar6->field0_0x0;
      pvVar6 = (vconfig_struct *)&pvVar6->field1_0x4;
      piVar7 = piVar7 + 1;
    }
    *(short *)piVar7 = (short)pvVar6->field0_0x0;
    DAT_0089ce36 = 0xf;
    DAT_0089c6c7 = FUN_0041cdf0();
    uVar5 = CONCAT22((short)((uint)((int)&pvVar6->field0_0x0 + 2) >> 0x10),DAT_0089c6c7);
    iVar3 = (int)player_tribe_num;
    DAT_0089d172 = (byte)((int)(maybe_framerate * 3 + (maybe_framerate * 3 >> 0x1f & 3U)) >> 2) &
                   0xfe;
    if ((char)DAT_0089d172 < '\b') {
      DAT_0089d172 = 8;
    }
    if (' ' < (char)DAT_0089d172) {
      DAT_0089d172 = 0x20;
    }
    iVar4 = (int)(char)DAT_0089d172;
    if ((level_flags_1._2_1_ & 0x10) != 0) {
      iVar4 = (iVar4 << 8) / DAT_0089c6a9;
    }
    _DAT_0089c6c5 = game_state.tribes_array[iVar3].angle_1;
    DAT_0089ce35 = (undefined1)iVar4;
    uVar8 = CONCAT22((short)((uint)(iVar3 * 0xc65) >> 0x10),game_state.tribes_array[iVar3].angle_1);
    sVar1 = calc_abs_angular_diff(uVar5,uVar8);
    sVar2 = calc_angular_diff_shortest(uVar5,uVar8);
    DAT_0089c6c9 = (short)((int)(short)(sVar1 * sVar2) / iVar4);
    return;
  case 0xf:
    if (DAT_0089ce34 == '\0') {
      DAT_0089ce36 = 0x10;
      return;
    }
    break;
  case 0x10:
    FUN_0048b890();
    DAT_0089ce36 = 0;
  }
  return;
}
