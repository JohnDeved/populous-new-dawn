/* Ghidra 12.1.3 pseudocode; entry 00497690; FUN_00497690.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


/* WARNING: Removing unreachable block (ram,0x0049796f) */
/* WARNING: Removing unreachable block (ram,0x00497979) */

uint FUN_00497690(int param_1)

{
  short sVar1;
  ulonglong uVar2;
  ushort uVar3;
  uint uVar4;
  uint uVar5;
  undefined2 local_10;
  undefined2 local_e;
  short local_4;
  short local_2;

  if ((*(uint *)(param_1 + 0xc) & 0x40000000) != 0) {
    *(uint *)(param_1 + 0xc) = *(uint *)(param_1 + 0xc) & 0xbfffffff;
    local_e = CONCAT11((char)((ushort)*(undefined2 *)(param_1 + 0x3f) >> 8),
                       (char)((ushort)*(undefined2 *)(param_1 + 0x3d) >> 8));
    if ((*(byte *)((int)&game_state.level_data[0].flags +
                  ((local_e & 0xfe) * 2 | local_e & 0xfe00) * 4 + 1) & 2) == 0) {
      *(undefined1 *)(param_1 + 0xa8) = 0x13;
    }
    else {
      *(undefined1 *)(param_1 + 0xa8) = 3;
    }
    *(byte *)(param_1 + 0x76) = *(byte *)(param_1 + 0x76) | 0x10;
  }
  uVar4 = *(byte *)(param_1 + 0xa8) - 2;
  switch(*(byte *)(param_1 + 0xa8)) {
  case 2:
    uVar4 = FUN_00438ca0(param_1,0x38);
    if ((char)uVar4 != '\0') {
      *(undefined1 *)(param_1 + 0xa8) = 0x12;
      *(byte *)(param_1 + 0x76) = *(byte *)(param_1 + 0x76) | 0x10;
      return uVar4 & 0xffffff00;
    }
    break;
  case 3:
    uVar4 = FUN_00438db0(param_1);
    if ((char)uVar4 != '\0') {
      *(undefined1 *)(param_1 + 0xa8) = 4;
      *(byte *)(param_1 + 0x76) = *(byte *)(param_1 + 0x76) | 0x10;
      return uVar4 & 0xffffff00;
    }
    break;
  case 4:
    if ((*(byte *)(param_1 + 0x76) & 0x10) != 0) {
      uVar5 = game_state.pseudo_random_val * 0x24a1 + 0x24df;
      uVar4 = uVar5 >> 0xd;
      game_state.pseudo_random_val = uVar4 | uVar5 * 0x80000;
      *(ushort *)(param_1 + 0x70) = ((ushort)uVar4 & 7) + 1;
    }
    uVar4 = FUN_004391a0(param_1);
    if ((char)uVar4 != '\0') {
      *(undefined1 *)(param_1 + 0xa8) = 2;
      *(byte *)(param_1 + 0x76) = *(byte *)(param_1 + 0x76) | 0x10;
      return uVar4 & 0xffffff00;
    }
    break;
  case 5:
    if ((*(byte *)(param_1 + 0x76) & 0x10) != 0) {
      *(undefined2 *)(param_1 + 0x70) = 6;
    }
    uVar4 = FUN_00439240(param_1);
    if ((char)uVar4 != '\0') {
      *(undefined1 *)(param_1 + 0xa8) = 6;
      *(byte *)(param_1 + 0x76) = *(byte *)(param_1 + 0x76) | 0x10;
      return uVar4 & 0xffffff00;
    }
    break;
  case 6:
    uVar4 = FUN_00439550(param_1);
    if ((*(byte *)(param_1 + 0x2e) & 0x1f) == 0) {
      local_10 = CONCAT11((char)((ushort)*(undefined2 *)(param_1 + 0x3f) >> 8),
                          (char)((ushort)*(undefined2 *)(param_1 + 0x3d) >> 8));
      uVar5 = (local_10 & 0xfe) * 2;
      uVar4 = uVar5 | local_10 & 0xfe00;
      if (((&game_state.level_data[0].unit_index_2)[uVar4 * 2] & 0x3ff) != 0) {
        *(undefined1 *)(param_1 + 0xa8) = 2;
        *(byte *)(param_1 + 0x76) = *(byte *)(param_1 + 0x76) | 0x10;
        return uVar5 & 0xffffff00 | local_10 & 0xfe00;
      }
    }
    break;
  case 0x12:
    if ((*(byte *)(param_1 + 0x76) & 0x10) != 0) {
      *(undefined2 *)(param_1 + 0x70) = 5;
      uVar4 = game_state.pseudo_random_val * 0x24a1 + 0x24df;
      game_state.pseudo_random_val = uVar4 >> 0xd | uVar4 * 0x80000;
      uVar2 = (ulonglong)game_state.pseudo_random_val;
      sVar1 = *(short *)(param_1 + 0x5d);
      update_gs_unit_related_array_item(param_1);
      *(ushort *)(param_1 + 0x57) = (sVar1 + (short)(uVar2 % 0x31c)) - 0x18eU & 0x7ff;
      uVar4 = *(uint *)(param_1 + 0xc);
      *(uint *)(param_1 + 0xc) = uVar4 | 0x80;
      *(uint *)(param_1 + 0xc) = uVar4 | 0x1080;
    }
    uVar4 = FUN_00439270(param_1);
    if ((char)uVar4 != '\0') {
      *(undefined1 *)(param_1 + 0xa8) = 0x15;
      *(byte *)(param_1 + 0x76) = *(byte *)(param_1 + 0x76) | 0x10;
      return uVar4 & 0xffffff00;
    }
    break;
  case 0x13:
    uVar4 = FUN_00439580(param_1);
    if ((char)uVar4 != '\0') {
      *(undefined1 *)(param_1 + 0xa8) = 0x15;
      *(byte *)(param_1 + 0x76) = *(byte *)(param_1 + 0x76) | 0x10;
      return uVar4 & 0xffffff00;
    }
    break;
  case 0x15:
    if ((*(byte *)(param_1 + 0x76) & 0x10) != 0) {
      *(undefined2 *)(param_1 + 0x70) = 1;
      FUN_004ba130(unit_land_array[*(ushort *)(param_1 + 0x89)],&local_4);
      uVar4 = (uint)(ushort)(local_4 - *(short *)(param_1 + 0x3d));
      uVar5 = (uint)(ushort)(local_2 - *(short *)(param_1 + 0x3f));
      if (0x7fff < uVar4) {
        uVar4 = uVar4 - 0x10000;
      }
      if (0x7fff < uVar5) {
        uVar5 = uVar5 - 0x10000;
      }
      uVar3 = calc_angle_quadrant(uVar4,-uVar5);
      uVar3 = uVar3 & 0x7ff;
      if ((*(uint *)(param_1 + 0xc) & 0x80) != 0) {
        *(ushort *)(param_1 + 0x57) = uVar3;
      }
      *(ushort *)(param_1 + 0x5d) = uVar3;
      if ((*(uint *)(param_1 + 0xc) & 0x8000) != 0) {
        uVar3 = uVar3 + 0x400 & 0x7ff;
      }
      *(ushort *)(param_1 + 0x26) = uVar3;
    }
    uVar4 = FUN_00439240(param_1);
    if ((char)uVar4 != '\0') {
      *(undefined1 *)(param_1 + 0xa8) = 5;
      *(byte *)(param_1 + 0x76) = *(byte *)(param_1 + 0x76) | 0x10;
    }
  }
  return uVar4 & 0xffffff00;
}
