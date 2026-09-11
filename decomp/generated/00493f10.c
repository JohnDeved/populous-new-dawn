/* Ghidra 12.1.3 pseudocode; entry 00493f10; FUN_00493f10.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


unit_struct * FUN_00493f10(byte *param_1,char param_2)

{
  uint uVar1;
  bool bVar2;
  unit_type_scenery *puVar3;
  unit_struct *puVar4;
  unit_struct *puVar5;
  unit_struct *puVar6;

  puVar5 = (unit_struct *)0x0;
  bVar2 = true;
  if ((((((byte)land_flags_1 & 8) == 0) && (player_tribe_num == param_2)) &&
      (((byte)level_flags & 4) != 0)) && ((*param_1 & 8) == 0)) {
    bVar2 = false;
  }
  puVar6 = puVar5;
  if ((bVar2) &&
     (puVar4 = unit_land_array[*(short *)(param_1 + 6)],
     unit_land_array[*(short *)(param_1 + 6)] != (unit_struct *)0x0)) {
    while ((puVar6 = puVar4, puVar6->unit_class != '\x05' ||
           (puVar3 = unit_type_array_scenery + (byte)puVar6->unit_type,
           uVar1._0_1_ = puVar3->flags_1, uVar1._1_1_ = puVar3->flags,
           uVar1._2_1_ = puVar3->field14_0x16, uVar1._3_1_ = puVar3->field15_0x17, (uVar1 & 4) == 0)
           )) {
      puVar4 = unit_land_array[puVar6->next_unit_index];
      if (unit_land_array[puVar6->next_unit_index] == (unit_struct *)0x0) {
        return puVar5;
      }
    }
  }
  return puVar6;
}
