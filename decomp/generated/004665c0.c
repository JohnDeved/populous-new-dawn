/* Ghidra 12.1.3 pseudocode; entry 004665c0; FUN_004665c0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


unit_struct * FUN_004665c0(int param_1)

{
  unit_struct *puVar1;
  unit_struct *puVar2;
  unit_struct *puVar3;

  puVar2 = (unit_struct *)0x0;
  puVar3 = puVar2;
  if ((DAT_0089bc7e != 0) &&
     (puVar1 = unit_land_array[*(short *)(param_1 + 6)],
     unit_land_array[*(short *)(param_1 + 6)] != (unit_struct *)0x0)) {
    while ((puVar3 = puVar1, puVar3->unit_class != '\x04' ||
           ((*(ushort *)&unit_type_array_vehicle[(byte)puVar3->unit_type].field_0x15 & 1) != 0))) {
      puVar1 = unit_land_array[puVar3->next_unit_index];
      if (unit_land_array[puVar3->next_unit_index] == (unit_struct *)0x0) {
        return puVar2;
      }
    }
  }
  return puVar3;
}
