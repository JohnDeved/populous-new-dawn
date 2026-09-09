/* Ghidra 12.1.3 pseudocode; entry 004d92b0; FUN_004d92b0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_004d92b0(int param_1)

{
  short sVar1;
  char cVar2;
  int iVar3;
  ushort local_6;
  short local_4;
  ushort local_2;

  if ((*(uint *)(param_1 + 0x10) & 0x4000) != 0) {
    if (game_state.tribes_array[*(char *)(param_1 + 0xad)].f_949 != 0) {
      *(undefined1 *)(param_1 + 0xac) = 0;
      *(uint *)(param_1 + 0x10) = *(uint *)(param_1 + 0x10) & 0xffffbfff;
      return;
    }
    if (((*(byte *)(param_1 + 0x2e) & 7) == 0) &&
       (cVar2 = *(char *)(param_1 + 0xac) + -1, *(char *)(param_1 + 0xac) = cVar2, cVar2 == '\0')) {
      ptr_unit_related_20B->field0_0x0 = (int)*(short *)(param_1 + 0x3d);
      ptr_unit_related_20B->field1_0x4 = (int)*(short *)(param_1 + 0x3f);
      sVar1 = *(short *)(param_1 + 0x5d);
      ptr_unit_related_20B->unit_ptr = (unit_struct *)(int)sVar1;
      ptr_unit_related_20B->field3_0xc = 0;
      ptr_unit_related_20B->field4_0x10 = 0;
      ptr_unit_related_20B = ptr_unit_related_20B + 1;
      unit_allocation_flag = 1;
      iVar3 = alloc_unit(1,*(undefined1 *)(param_1 + 0x2b),
                         CONCAT31((int3)(char)((ushort)sVar1 >> 8),*(undefined1 *)(param_1 + 0xad)),
                         (short *)(param_1 + 0x3d));
      if (game_state.tribes_array[*(char *)(iVar3 + 0x2f)].field_0xc1f == '\x01') {
        local_2 = FUN_004f6020(*(char *)(iVar3 + 0x2f) * 0xc65 + 0x89d1c8);
        local_6 = local_2 & 0xfffe;
        local_4 = local_6 << 8;
        local_2 = local_2 & 0xfe00;
        FUN_0043b2a0(iVar3,&local_4);
      }
      if (iVar3 != 0) {
        *(undefined2 *)(iVar3 + 0x6e) = *(undefined2 *)(param_1 + 0x6e);
        *(undefined2 *)(iVar3 + 0x6c) = *(undefined2 *)(param_1 + 0x6c);
        *(undefined2 *)(iVar3 + 0x78) = *(undefined2 *)(param_1 + 0x78);
        FUN_004ef180(param_1);
        return;
      }
      *(undefined1 *)(param_1 + 0xac) = 1;
    }
  }
  return;
}
