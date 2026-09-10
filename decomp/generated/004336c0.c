/* Ghidra 12.1.3 pseudocode; entry 004336c0; FUN_004336c0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


uint FUN_004336c0(int param_1,undefined4 param_2)

{
  undefined2 uVar1;
  undefined2 uVar2;
  uint in_EAX;
  ushort uVar3;
  uint uVar4;
  uint uVar5;
  undefined2 local_8;
  ushort uStack_6;
  short local_4;
  short sStack_2;

  uVar4 = in_EAX & 0xffffff00;
  if ((*(byte *)(param_1 + 0x2e) & 3) == 0) {
    if (*(ushort *)(param_1 + 0x9f) != 0) {
      uVar1 = (unit_land_array[*(ushort *)(param_1 + 0x9f)]->pos).x;
      uVar2 = (unit_land_array[*(ushort *)(param_1 + 0x9f)]->pos).y;
      uVar3 = (ushort)*(undefined4 *)(param_1 + 0x4f);
      uStack_6 = (ushort)((uint)*(undefined4 *)(param_1 + 0x4f) >> 0x10);
      if (((*(byte *)(param_1 + 0x13) & 2) != 0) ||
         (local_8 = CONCAT11((char)((ushort)*(undefined2 *)(param_1 + 0x51) >> 8),
                             (char)((ushort)*(undefined2 *)(param_1 + 0x4f) >> 8)),
         (*(byte *)(landscape_height_array +
                   ((&game_state.level_data[0].c_3)[((local_8 & 0xfe) * 2 | local_8 & 0xfe00) * 4] &
                   0xf)) & 2) != 0)) {
        uVar3 = (uVar3 & 0xfe00) + 0x100;
        uStack_6 = (uStack_6 & 0xfe00) + 0x100;
      }
      uVar4 = (int)(short)uVar3 - (int)(short)uVar1 >> 0x1f;
      uVar4 = ((int)(short)uVar3 - (int)(short)uVar1 ^ uVar4) - uVar4;
      if ((int)uVar4 < 0x161) {
        uVar4 = (int)(short)uStack_6 - (int)(short)uVar2 >> 0x1f;
        uVar4 = ((int)(short)uStack_6 - (int)(short)uVar2 ^ uVar4) - uVar4;
        if ((int)uVar4 < 0x161) {
          return CONCAT31((int3)(uVar4 >> 8),1);
        }
      }
      return uVar4 & 0xffffff00;
    }
    if ((*(byte *)(param_1 + 0x13) & 4) != 0) {
      uVar4 = (int)*(short *)(param_1 + 0x4f) - (int)*(short *)(param_1 + 0x3d);
      uVar5 = (int)uVar4 >> 0x1f;
      uVar5 = (uVar4 ^ uVar5) - uVar5;
      if (((int)uVar5 < 0x238) &&
         (uVar4 = (int)*(short *)(param_1 + 0x51) - (int)*(short *)(param_1 + 0x3f),
         uVar5 = (int)uVar4 >> 0x1f, uVar5 = (uVar4 ^ uVar5) - uVar5, (int)uVar5 < 0x238)) {
        return CONCAT31((int3)(uVar5 >> 8),1);
      }
      return uVar5 & 0xffffff00;
    }
    uVar4 = FUN_0043bb60(param_1,param_2);
  }
  return uVar4;
}
