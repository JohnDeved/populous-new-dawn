/* Ghidra 12.1.3 pseudocode; entry 00466e90; FUN_00466e90.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_00466e90(int param_1)

{
  unit_struct *puVar1;
  unit_struct *puVar2;
  int iVar3;
  ushort *puVar4;

  iVar3 = (int)(char)unit_type_array_vehicle[*(byte *)(param_1 + 0x2b)].field_0x8;
  if ((*(char *)(param_1 + 0x9e) != '\0') && (0 < iVar3)) {
    puVar4 = (ushort *)(param_1 + 0x7a);
    do {
      puVar2 = (unit_struct *)0x0;
      if (((*puVar4 != 0) && (puVar1 = unit_land_array[*puVar4], (puVar1->flags_2 & 1) == 0)) &&
         (puVar1->unit_class != '\0')) {
        puVar2 = puVar1;
      }
      if (puVar2 != (unit_struct *)0x0) {
        FUN_004d3ea0(puVar2);
      }
      puVar4 = puVar4 + 1;
      iVar3 = iVar3 + -1;
    } while (iVar3 != 0);
  }
  return;
}
