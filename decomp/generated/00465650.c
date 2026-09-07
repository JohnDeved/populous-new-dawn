/* Ghidra 12.1.3 pseudocode; entry 00465650; FUN_00465650.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


undefined1 FUN_00465650(int param_1)

{
  uint *puVar1;
  byte bVar2;
  undefined1 uVar3;
  uint uVar4;
  undefined2 local_2;

  uVar3 = 0;
  if ((*(byte *)(param_1 + 0x94) & 1) == 0) {
    local_2 = CONCAT11((char)((ushort)*(undefined2 *)(param_1 + 0x3f) >> 8),
                       (char)((ushort)*(undefined2 *)(param_1 + 0x3d) >> 8));
    uVar4 = (local_2 & 0xfe) * 2 | local_2 & 0xfe00;
    puVar1 = &game_state.level_data[0].flags + uVar4;
    bVar2 = (&game_state.level_data[0].c_3)[uVar4 * 4];
    if ((unit_type_array_vehicle[*(byte *)(param_1 + 0x2b)].field_0x15 & 1) == 0) {
      if ((((*(byte *)(landscape_height_array + (bVar2 & 0xf)) & 0x3c) != 0) &&
          ((*puVar1 & 0x100004) == 0)) &&
         (uVar3 = 1,
         *(short *)&unit_related_struct_26B_ARRAY_005a7b90[*(byte *)(param_1 + 0x30)].field_0x4 <=
         *(short *)(param_1 + 0x5f))) {
        return 0;
      }
    }
    else if ((((*(byte *)(landscape_height_array + (bVar2 & 0xf)) & 0x3d) != 0) &&
             ((*puVar1 & 0x100204) == 0)) &&
            (uVar3 = 1,
            *(short *)&unit_related_struct_26B_ARRAY_005a7b90[*(byte *)(param_1 + 0x30)].field_0x4
            <= *(short *)(param_1 + 0x5f))) {
      uVar3 = 0;
    }
  }
  return uVar3;
}
