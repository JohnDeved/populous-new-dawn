/* Ghidra 12.1.3 pseudocode; entry 00409bd0; FUN_00409bd0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


unit_struct * FUN_00409bd0(unit_struct *param_1,int param_2)

{
  ushort uVar1;
  unit_struct *puVar2;
  unit_struct *puVar3;
  unit_struct *puVar4;

  puVar3 = (unit_struct *)0x0;
  puVar4 = (unit_struct *)0x0;
  if (((*(ushort *)(param_2 + 0xa2) != 0) &&
      (puVar2 = unit_land_array[*(ushort *)(param_2 + 0xa2)], (*(byte *)&puVar2->flags_2 & 1) == 0))
     && (puVar2->unit_class != '\0')) {
    puVar4 = puVar2;
  }
  while ((puVar2 = puVar4, puVar2 != (unit_struct *)0x0 && (puVar2 != param_1))) {
    uVar1 = *(ushort *)((int)&puVar2->loc_2_z + 1);
    puVar4 = (unit_struct *)0x0;
    puVar3 = puVar2;
    if ((uVar1 != 0) &&
       ((puVar2 = unit_land_array[uVar1], (puVar2->flags_2 & 1) == 0 && (puVar2->unit_class != '\0')
        ))) {
      puVar4 = puVar2;
    }
  }
  return puVar3;
}
