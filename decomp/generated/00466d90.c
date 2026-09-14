/* Ghidra 12.1.3 pseudocode; entry 00466d90; FUN_00466d90.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_00466d90(int param_1)

{
  ushort uVar1;
  char cVar2;
  short sVar3;
  short sVar4;
  uint uVar5;

  if ((*(byte *)(param_1 + 0x2e) & 0x1f) == 0) {
    if (*(short *)(param_1 + 0x5f) == 0) {
      cVar2 = FUN_00466fc0(param_1,0xc);
      uVar1 = CONCAT11((char)((ushort)*(undefined2 *)(param_1 + 0x3f) >> 8),
                       (char)((ushort)*(undefined2 *)(param_1 + 0x3d) >> 8));
      if ((char)landscape_height_array
                [(&game_state.level_data[0].c_3)[((uVar1 & 0xfe) * 2 | uVar1 & 0xfe00) * 4] & 0xf].
                field_0x1 < 0) {
        uVar5 = *(ushort *)(param_1 + 0x26) & 0x7ff;
      }
      else {
        uVar5 = ((int)(char)landscape_height_array
                            [(&game_state.level_data[0].c_3)
                             [((uVar1 & 0xfe) * 2 | uVar1 & 0xfe00) * 4] & 0xf].field_0x1 + 4U & 7)
                << 8;
      }
      if ((int)*(short *)(param_1 + 0x26) != uVar5) {
        cVar2 = '\x01';
        sVar3 = calc_angular_diff_shortest(uVar5,*(short *)(param_1 + 0x26));
        sVar4 = calc_abs_angular_diff(uVar5,*(undefined2 *)(param_1 + 0x26));
        if (sVar3 < 0xc) {
          *(short *)(param_1 + 0x26) = (short)uVar5;
        }
        else {
          *(ushort *)(param_1 + 0x26) = sVar4 * 0xb + *(short *)(param_1 + 0x26) & 0x7ff;
        }
      }
      if (cVar2 != '\0') {
        FUN_00465ea0(param_1);
        return;
      }
    }
    else {
      *(undefined2 *)(param_1 + 0x5f) = 0;
    }
  }
  return;
}
