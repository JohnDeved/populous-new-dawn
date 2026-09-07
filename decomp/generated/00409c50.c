/* Ghidra 12.1.3 pseudocode; entry 00409c50; FUN_00409c50.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


unit_struct * FUN_00409c50(int param_1,int param_2)

{
  ushort uVar1;
  unit_struct *puVar2;
  unit_struct *puVar3;
  unit_struct *puVar4;
  unit_struct *puVar5;
  int iVar6;

  puVar3 = (unit_struct *)0x0;
  puVar4 = puVar3;
  if (param_2 < 0) {
    puVar5 = (unit_struct *)0x0;
    if (((*(ushort *)(param_1 + 0xa2) != 0) &&
        (puVar2 = unit_land_array[*(ushort *)(param_1 + 0xa2)], (*(byte *)&puVar2->flags_2 & 1) == 0
        )) && (puVar2->unit_class != '\0')) {
      puVar5 = puVar2;
    }
    if (puVar5 != (unit_struct *)0x0) {
      while (puVar4 = puVar5, uVar1 = *(ushort *)((int)&puVar4->loc_2_z + 1), uVar1 != 0) {
        puVar4 = unit_land_array[uVar1];
        puVar5 = (unit_struct *)0x0;
        if (((puVar4->flags_2 & 1) == 0) && (puVar4->unit_class != '\0')) {
          puVar5 = puVar4;
        }
        if (puVar5 == (unit_struct *)0x0) {
          return puVar3;
        }
      }
    }
  }
  else {
    puVar5 = (unit_struct *)0x0;
    if (((*(ushort *)(param_1 + 0xa2) != 0) &&
        (puVar2 = unit_land_array[*(ushort *)(param_1 + 0xa2)], (*(byte *)&puVar2->flags_2 & 1) == 0
        )) && (puVar2->unit_class != '\0')) {
      puVar5 = puVar2;
    }
    iVar6 = 0;
    if (puVar5 != (unit_struct *)0x0) {
      do {
        if (iVar6 == param_2) {
          return puVar5;
        }
        uVar1 = *(ushort *)((int)&puVar5->loc_2_z + 1);
        puVar5 = (unit_struct *)0x0;
        if (((uVar1 != 0) && (puVar4 = unit_land_array[uVar1], (puVar4->flags_2 & 1) == 0)) &&
           (puVar4->unit_class != '\0')) {
          puVar5 = puVar4;
        }
        iVar6 = iVar6 + 1;
      } while (puVar5 != (unit_struct *)0x0);
      return puVar3;
    }
  }
  return puVar4;
}
