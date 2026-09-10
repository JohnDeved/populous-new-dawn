/* Ghidra 12.1.3 pseudocode; entry 004a8e70; FUN_004a8e70.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_004a8e70(int param_1,short *param_2)

{
  undefined4 uVar1;

  uVar1 = *(undefined4 *)(param_1 + 0x3d);
  *(undefined4 *)param_2 = uVar1;
  *param_2 = ((ushort)uVar1 & 0xfe00) + 0x100;
  param_2[1] = (param_2[1] & 0xfe00U) + 0x100;
  move_pos_angle_length
            (param_2,((int)(short)((int)((int)*(short *)(param_1 + 0x26) +
                                        ((int)*(short *)(param_1 + 0x26) >> 0x1f & 0x1ffU)) >> 9) +
                      2U & 3) << 9,0x200);
  return;
}
