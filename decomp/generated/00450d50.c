/* Ghidra 12.1.3 pseudocode; entry 00450d50; calc_unit_shade_value.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


int calc_unit_shade_value(int param_1)

{
  unit_struct *puVar1;
  int iVar2;
  ushort uVar3;
  unit_struct *puVar4;

  iVar2 = 0;
  uVar3 = *(ushort *)(param_1 + 8) & 0x3ff;
  if ((uVar3 != 0) && ((*(byte *)(param_1 + 1) & 2) != 0)) {
    puVar4 = (unit_struct *)0x0;
    if ((uVar3 != 0) &&
       ((puVar1 = unit_land_array[*(ushort *)(param_1 + 8) & 0x3ff],
        (*(byte *)&puVar1->flags_2 & 1) == 0 && (puVar1->unit_class != '\0')))) {
      puVar4 = puVar1;
    }
    if (puVar4 != (unit_struct *)0x0) {
      if ((puVar4->state == '\x01') &&
         ((unit_type_array_building[(byte)puVar4->unit_type].field_0x49 & 1) == 0)) {
        iVar2 = ((int)(char)unit_type_array_building[(byte)puVar4->unit_type].field_0x35 *
                (int)(char)puVar4->field_0x78) / 3;
      }
      else {
        iVar2 = (int)(char)unit_type_array_building[(byte)puVar4->unit_type].field_0x35;
      }
    }
  }
  for (puVar4 = unit_land_array[*(short *)(param_1 + 6)]; puVar4 != (unit_struct *)0x0;
      puVar4 = unit_land_array[puVar4->next_unit_index]) {
    if (0xf < iVar2) goto LAB_00450e1e;
    if (puVar4->unit_class == '\x05') {
      iVar2 = iVar2 + (char)unit_type_array_scenery[(byte)puVar4->unit_type].field11_0x13;
    }
  }
  if (0xf < iVar2) {
LAB_00450e1e:
    iVar2 = 0xf;
  }
  return iVar2;
}
