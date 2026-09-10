/* Ghidra 12.1.3 pseudocode; entry 00438950; FUN_00438950.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


unit_struct * FUN_00438950(byte *param_1)

{
  unit_struct *puVar1;
  unit_struct *puVar2;

  puVar2 = (unit_struct *)0x0;
  if ((*(uint *)(&DAT_005a7dca + (uint)*param_1 * 0x16) & 4) == 0) {
    if ((*(uint *)(&DAT_005a7dca + (uint)*param_1 * 0x16) & 0x242) != 0) {
      puVar2 = (unit_struct *)0x0;
      if (((*(ushort *)(param_1 + 6) != 0) &&
          (puVar1 = unit_land_array[*(ushort *)(param_1 + 6)], (*(byte *)&puVar1->flags_2 & 1) == 0)
          ) && (puVar1->unit_class != '\0')) {
        puVar2 = puVar1;
      }
    }
  }
  else if (((*(ushort *)(param_1 + 6) != 0) &&
           (puVar1 = unit_land_array[*(ushort *)(param_1 + 6)], (*(byte *)&puVar1->flags_2 & 1) == 0
           )) && (puVar1->unit_class != '\0')) {
    return puVar1;
  }
  return puVar2;
}
