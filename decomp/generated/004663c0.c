/* Ghidra 12.1.3 pseudocode; entry 004663c0; FUN_004663c0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


unit_struct * FUN_004663c0(int param_1,int param_2)

{
  unit_struct *puVar1;
  bool bVar2;
  char cVar3;
  int iVar4;
  unit_struct *puVar5;
  unit_struct *puVar6;

  puVar6 = (unit_struct *)0x0;
  puVar5 = (unit_struct *)0x0;
  if (DAT_0089bc7e != 0) {
    puVar1 = unit_land_array[*(short *)(param_2 + 6)];
    while ((puVar5 = (unit_struct *)0x0, puVar1 != (unit_struct *)0x0 &&
           ((puVar1->unit_class != '\x04' ||
            (puVar5 = puVar1,
            (*(ushort *)&unit_type_array_vehicle[(byte)puVar1->unit_type].field_0x15 & 1) != 0)))))
    {
      puVar1 = unit_land_array[puVar1->next_unit_index];
    }
  }
  if (puVar5 != (unit_struct *)0x0) {
    bVar2 = false;
    if (((((puVar5->facs0_index & 1) == 0) &&
         ((char)puVar5->field_0x9e <
          (char)unit_type_array_vehicle[(byte)puVar5->unit_type].field_0x8)) &&
        (cVar3 = FUN_00465650(puVar5), cVar3 != '\0')) &&
       ((puVar5->field_0x9e == '\0' ||
        (unit_land_array[(ushort)puVar5->loc_1_x]->tribe_index == *(char *)(param_1 + 0x2f))))) {
      bVar2 = true;
    }
    if ((bVar2) &&
       ((game_state.tribes_array[*(char *)(param_1 + 0x2f)].field_0xc1f != '\x01' ||
        (iVar4 = FUN_004f2490(puVar5), iVar4 == 0)))) {
      puVar6 = puVar5;
    }
  }
  return puVar6;
}
