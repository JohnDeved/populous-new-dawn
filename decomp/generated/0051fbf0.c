/* Ghidra 12.1.3 pseudocode; entry 0051fbf0; FUN_0051fbf0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


short FUN_0051fbf0(int param_1,unit_struct *param_2,undefined4 param_3)

{
  int iVar1;
  int iVar2;
  int iVar3;
  short sVar4;

  sVar4 = 0;
  iVar3 = 0;
  FUN_004da170(param_1);
  do {
    ptr_unit_related_20B->field0_0x0 = iVar3;
    ptr_unit_related_20B->field1_0x4 = param_1;
    ptr_unit_related_20B->unit_ptr = param_2;
    ptr_unit_related_20B->field3_0xc = param_3;
    ptr_unit_related_20B->field4_0x10 = 0;
    ptr_unit_related_20B = ptr_unit_related_20B + 1;
    unit_allocation_flag = 1;
    iVar1 = alloc_unit(8,6,*(undefined1 *)(param_1 + 0x2f),param_1 + 0x3d);
    if (iVar1 != 0) {
      sVar4 = *(short *)(iVar1 + 0x24);
      iVar2 = get_adjacent_unit(param_1,4);
      iVar1 = DAT_005aa46c;
      if (iVar2 != 0) {
        iVar1 = DAT_005aa474;
      }
      if ((*(byte *)(param_1 + 0x16) & 8) != 0) {
        iVar1 = iVar1 >> (DAT_005aa5b4 & 0x1f);
      }
      *(char *)(param_1 + 0xb2) = (char)iVar1;
    }
    iVar3 = iVar3 + 1;
  } while (iVar3 < 2);
  if (sVar4 != 0) {
    if (*(ushort *)(param_1 + 0x9f) != 0) {
      *(undefined1 *)((int)&unit_land_array[*(ushort *)(param_1 + 0x9f)]->unit_land_array_index + 1)
           = 1;
    }
  }
  return sVar4;
}
