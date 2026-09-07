/* Ghidra 12.1.3 pseudocode; entry 004f7720; FUN_004f7720.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


undefined4 FUN_004f7720(int param_1)

{
  ushort uVar1;
  unit_struct *puVar2;
  char cVar3;
  unit_struct *puVar4;
  undefined4 uVar5;
  unit_struct *puVar6;

  uVar5 = 0;
  if (*(ushort *)(param_1 + 0x9f) != 0) {
    puVar6 = unit_land_array[*(ushort *)(param_1 + 0x9f)];
    puVar4 = (unit_struct *)0x0;
    if (((*(byte *)&puVar6->flags_2 & 1) == 0) && (puVar6->unit_class != '\0')) {
      puVar4 = puVar6;
    }
    if (puVar4 != (unit_struct *)0x0) {
      uVar1 = puVar4->loc_1_x;
      if ((*(ushort *)(param_1 + 0x24) == uVar1) && (*(char *)(param_1 + 0x2b) == '\x02')) {
        return 1;
      }
      puVar6 = (unit_struct *)0x0;
      if ((uVar1 != 0) &&
         ((puVar2 = unit_land_array[uVar1], (*(byte *)&puVar2->flags_2 & 1) == 0 &&
          (puVar2->unit_class != '\0')))) {
        puVar6 = puVar2;
      }
      if (puVar6 != (unit_struct *)0x0) {
        cVar3 = FUN_00465650(puVar4);
        if (cVar3 == '\0') {
          if ((unit_type_related_1_ARRAY_005a6f78[(byte)puVar6->state].field_0x1 & 8) == 0) {
            uVar5 = 1;
          }
        }
        else if ((unit_type_related_1_ARRAY_005a6f78[(byte)puVar6->state].field_0x1 & 8) == 0) {
          return 1;
        }
      }
    }
  }
  return uVar5;
}
