/* Ghidra 12.1.3 pseudocode; entry 00408d20; FUN_00408d20.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


int FUN_00408d20(int param_1)

{
  byte bVar1;
  unit_struct *puVar2;
  int iVar3;
  uint uVar4;
  unit_struct *puVar5;
  int iVar6;
  ushort *puVar7;

  iVar6 = 0;
  iVar3 = 0;
  if (*(char *)(param_1 + 0xa6) != '\0') {
    bVar1 = *(byte *)(param_1 + 0x2b);
    if (unit_type_array_building[bVar1].field31_0x20 != 0) {
      puVar7 = (ushort *)(param_1 + 0x86);
      uVar4 = (uint)(byte)unit_type_array_building[bVar1].field31_0x20;
      do {
        puVar5 = (unit_struct *)0x0;
        if (((*puVar7 != 0) &&
            (puVar2 = unit_land_array[*puVar7], (*(byte *)&puVar2->flags_2 & 1) == 0)) &&
           (puVar2->unit_class != '\0')) {
          puVar5 = puVar2;
        }
        if (puVar5 != (unit_struct *)0x0) {
          if (unit_type_array_building[bVar1].unit_type1 != puVar5->unit_type) {
            iVar6 = iVar6 + (short)unit_type_array_person[(byte)puVar5->unit_type].conv;
          }
        }
        puVar7 = puVar7 + 1;
        uVar4 = uVar4 - 1;
      } while (uVar4 != 0);
    }
    if ((short)unit_type_array_person[(byte)unit_type_array_building[bVar1].unit_type1].conv <=
        iVar6) {
      iVar3 = iVar6;
    }
  }
  return iVar3;
}
