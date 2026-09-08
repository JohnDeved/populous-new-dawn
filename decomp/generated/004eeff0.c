/* Ghidra 12.1.3 pseudocode; entry 004eeff0; FUN_004eeff0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


undefined4 FUN_004eeff0(int param_1)

{
  undefined2 *puVar1;
  uint uVar2;
  char cVar3;
  short sVar4;
  undefined2 local_2;

  uVar2 = *(uint *)(param_1 + 0xc);
  if ((((uVar2 & 2) == 0) &&
      ((unit_related_struct_26B_ARRAY_005a7b90[*(byte *)(param_1 + 0x30)].field_0x18 & 2) == 0)) &&
     ((uVar2 & 0x80000) == 0)) {
    puVar1 = (undefined2 *)(param_1 + 0x3d);
    sVar4 = calc_point_height(*puVar1,CONCAT22((short)(uVar2 >> 0x10),
                                               *(undefined2 *)(param_1 + 0x3f)));
    if (*(short *)(param_1 + 0x41) <= sVar4) {
      cVar3 = FUN_0044f980(puVar1);
      if (cVar3 == '\0') {
        if ((*(uint *)(param_1 + 0x10) & 0x800000) == 0) {
          return 1;
        }
        if (*(short *)(param_1 + 0x9f) == 0) {
          local_2 = CONCAT11((char)((ushort)*(undefined2 *)(param_1 + 0x3f) >> 8),
                             (char)((ushort)*puVar1 >> 8));
          if ((*(byte *)(landscape_height_array +
                        ((&game_state.level_data[0].c_3)
                         [((local_2 & 0xfe) * 2 | local_2 & 0xfe00) * 4] & 0xf)) & 0x3c) == 0) {
            return 1;
          }
          if ((*(uint *)(param_1 + 0x10) & 0x1000000) == 0) {
            return 1;
          }
        }
      }
      else {
        *(uint *)(param_1 + 0x10) = *(uint *)(param_1 + 0x10) & 0xfeffffff;
      }
    }
  }
  return 0;
}
