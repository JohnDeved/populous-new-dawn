/* Ghidra 12.1.3 pseudocode; entry 004bb290; FUN_004bb290.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


int FUN_004bb290(int param_1)

{
  unit_related_struct_20B *puVar1;
  uint uVar2;
  int iVar3;
  char cVar4;
  undefined1 uVar5;

  iVar3 = 0;
  cVar4 = *(char *)(param_1 + 0x7c);
  if (cVar4 != '\0') {
    if (*(char *)(param_1 + 0x7e) == '\0') {
      uVar5 = *(undefined1 *)(param_1 + 0x2f);
      uVar2 = (uint)*(byte *)(param_1 + 0x7d);
    }
    else {
      ptr_unit_related_20B->field0_0x0 = (int)*(short *)(param_1 + 0x80);
      ptr_unit_related_20B->field1_0x4 = (int)*(short *)(param_1 + 0x82);
      ptr_unit_related_20B->unit_ptr = (unit_struct *)(int)*(short *)(param_1 + 0x84);
      ptr_unit_related_20B->field3_0xc = (int)*(short *)(param_1 + 0x86);
      puVar1 = ptr_unit_related_20B;
      ptr_unit_related_20B->field4_0x10 = 0;
      ptr_unit_related_20B = ptr_unit_related_20B + 1;
      unit_allocation_flag = 1;
      uVar5 = *(undefined1 *)(param_1 + 0x2f);
      uVar2 = CONCAT31((int3)((uint)puVar1 >> 8),*(undefined1 *)(param_1 + 0x7d));
      cVar4 = *(char *)(param_1 + 0x7c);
    }
    iVar3 = alloc_unit(cVar4,uVar2,uVar5,param_1 + 0x76);
    if (iVar3 != 0) {
      *(undefined4 *)(iVar3 + 0x57) = *(undefined4 *)(param_1 + 0x57);
      *(undefined2 *)(iVar3 + 0x5b) = *(undefined2 *)(param_1 + 0x5b);
      unit_processing_class_7_effect(iVar3);
    }
  }
  return iVar3;
}
