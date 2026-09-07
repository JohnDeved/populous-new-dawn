/* Ghidra 12.1.3 pseudocode; entry 004f61f0; FUN_004f61f0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


undefined4 FUN_004f61f0(int param_1)

{
  unit_struct *puVar1;
  uint uVar2;
  undefined4 uVar3;
  unit_struct *puVar4;
  undefined2 local_2;

  if ((*(byte *)(param_1 + 0xe) & 0x80) == 0) {
    return 0;
  }
  local_2 = CONCAT11((char)((ushort)*(undefined2 *)(param_1 + 0x3f) >> 8),
                     (char)((ushort)*(undefined2 *)(param_1 + 0x3d) >> 8));
  puVar4 = (unit_struct *)0x0;
  uVar2 = (ushort)(&game_state.level_data[0].unit_index_2)
                  [((local_2 & 0xfe) * 2 | local_2 & 0xfe00) * 2] & 0x3ff;
  if ((((short)uVar2 != 0) &&
      (puVar1 = unit_land_array[uVar2], (*(byte *)&puVar1->flags_2 & 1) == 0)) &&
     (puVar1->unit_class != '\0')) {
    puVar4 = puVar1;
  }
  if ((puVar4 == (unit_struct *)0x0) || (puVar4->unit_class != '\x02')) {
    uVar3 = 0;
  }
  else {
    if ((unit_type_array_building[(byte)puVar4->unit_type].field_0x48 & 0x40) == 0) {
      return 0;
    }
    uVar3 = 1;
    if ((int)(char)puVar4->hut_people_inside <
        (int)(uint)(byte)unit_type_array_building[(byte)puVar4->unit_type].field31_0x20) {
      return 0;
    }
  }
  return uVar3;
}
