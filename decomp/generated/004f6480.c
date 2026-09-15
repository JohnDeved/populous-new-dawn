/* Ghidra 12.1.3 pseudocode; entry 004f6480; FUN_004f6480.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


int FUN_004f6480(int param_1,uint param_2)

{
  short sVar1;
  unit_struct *puVar2;
  int iVar3;
  byte *pbVar4;
  int iVar5;

  iVar3 = 0;
  for (iVar5 = *(int *)(param_1 + 0x885); puVar2 = allocated_units, iVar5 != 0;
      iVar5 = *(int *)(iVar5 + 8)) {
    if (*(byte *)(iVar5 + 0x2b) == param_2) {
      iVar3 = iVar3 + 1;
    }
  }
  for (; puVar2 != (unit_struct *)0x0; puVar2 = puVar2->next_unit_1) {
    if ((((puVar2->unit_class == '\t') && (*(char *)(param_1 + 0xc22) == puVar2->tribe_index)) &&
        ((byte)puVar2->field_0x9e == param_2)) &&
       (sVar1._0_1_ = puVar2->num_points, sVar1._1_1_ = puVar2->tex_size_type, sVar1 == 0)) {
      iVar3 = iVar3 + 1;
    }
  }
  pbVar4 = (byte *)(param_1 + 0x74);
  iVar5 = 10;
  do {
    if ((((*pbVar4 & 1) != 0) && (pbVar4[0x11] == 0)) &&
       ((*(uint *)(pbVar4 + -0xc) == param_2 && (*(ushort *)(pbVar4 + 4) < 3)))) {
      iVar3 = iVar3 + 1;
    }
    pbVar4 = pbVar4 + 0x52;
    iVar5 = iVar5 + -1;
  } while (iVar5 != 0);
  return iVar3;
}
