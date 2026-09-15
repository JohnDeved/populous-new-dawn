/* Ghidra 12.1.3 pseudocode; entry 004f6520; FUN_004f6520.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


int FUN_004f6520(int param_1)

{
  int iVar1;
  unit_struct *puVar2;
  int iVar3;

  iVar3 = 0;
  for (iVar1 = *(int *)(param_1 + 0x885); puVar2 = allocated_units, iVar1 != 0;
      iVar1 = *(int *)(iVar1 + 8)) {
    if ((*(char *)(iVar1 + 0x2c) != '\x01') &&
       ((*(uint *)&unit_type_array_building[*(byte *)(iVar1 + 0x2b)].field_0x48 & 0x20) != 0)) {
      iVar3 = iVar3 + (uint)(byte)unit_type_array_building[*(byte *)(iVar1 + 0x2b)].field31_0x20;
    }
  }
  for (; puVar2 != (unit_struct *)0x0; puVar2 = puVar2->next_unit_1) {
    if (((puVar2->unit_class == '\t') && (*(char *)(param_1 + 0xc22) == puVar2->tribe_index)) &&
       ((*(uint *)&unit_type_array_building[(byte)puVar2->field_0x9e].field_0x48 & 0x20) != 0)) {
      iVar3 = iVar3 + (uint)(byte)unit_type_array_building[(byte)puVar2->field_0x9e].field31_0x20;
    }
  }
  return iVar3;
}
