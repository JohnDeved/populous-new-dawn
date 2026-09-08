/* Ghidra 12.1.3 pseudocode; entry 0050c690; FUN_0050c690.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_0050c690(int param_1)

{
  ushort *puVar1;
  unit_struct *puVar2;
  int iVar3;
  unit_related_struct_20B *puVar4;
  int iVar5;
  unit_struct *puVar6;
  undefined2 local_8;
  undefined2 local_6;

  iVar3 = *(char *)(param_1 + 0x2f) * 0xc65;
  iVar5 = 0;
  if ((*(uint *)(param_1 + 0xc) & 0x400) == 0) {
    puVar4 = (unit_related_struct_20B *)0x0;
  }
  else {
    *(uint *)(param_1 + 0xc) = *(uint *)(param_1 + 0xc) & 0xfffffbff;
    ptr_unit_related_20B = ptr_unit_related_20B + -1;
    puVar4 = ptr_unit_related_20B;
  }
  if (puVar4 != (unit_related_struct_20B *)0x0) {
    iVar5 = puVar4->field0_0x0;
    local_8 = (undefined2)puVar4->field1_0x4;
    local_6 = SUB42(puVar4->unit_ptr,0);
  }
  puVar6 = (unit_struct *)0x0;
  puVar1 = (ushort *)(iVar3 + 0x89dbd5 + iVar5 * 2);
  if (((*puVar1 != 0) && (puVar2 = unit_land_array[*puVar1], (*(byte *)&puVar2->flags_2 & 1) == 0))
     && (puVar2->unit_class != '\0')) {
    puVar6 = puVar2;
  }
  if (puVar6 != (unit_struct *)0x0) {
    *puVar1 = 0;
    alloc_unit(7,9,CONCAT31((int3)((uint)(iVar3 + 0x89d1c8) >> 8),puVar6->tribe_index),&puVar6->pos)
    ;
    FUN_004ef180(puVar6);
  }
  iVar5 = alloc_unit(5,0xc,*(undefined1 *)(param_1 + 0x2f),&local_8);
  if (iVar5 != 0) {
    *puVar1 = *(ushort *)(iVar5 + 0x24);
    alloc_unit(7,9,*(undefined1 *)(iVar5 + 0x2f),iVar5 + 0x3d);
  }
  update_after_unit_alloc(param_1);
  return;
}
