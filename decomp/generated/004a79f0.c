/* Ghidra 12.1.3 pseudocode; entry 004a79f0; FUN_004a79f0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_004a79f0(int param_1,int param_2,int param_3)

{
  bool bVar1;
  bool bVar2;
  uint uVar3;
  int iVar4;
  unit_struct *puVar5;
  int iVar6;

  bVar1 = false;
  bVar2 = false;
  iVar6 = param_2 + *(short *)(param_1 + 0x84);
  if (iVar6 < 0) {
    iVar6 = 0;
  }
  uVar3 = (uint)*(byte *)(param_1 + 0x2b);
  if (unit_type_array_scenery[uVar3].field2_0x4 < iVar6) {
    iVar6 = (int)unit_type_array_scenery[uVar3].field2_0x4;
  }
  *(short *)(param_1 + 0x84) = (short)iVar6;
  if (param_2 < 0) {
    *(uint *)(param_1 + 0x10) = *(uint *)(param_1 + 0x10) & 0xffefffff;
    if (*(char *)(param_1 + 0x31) != '\0') {
      *(char *)(param_1 + 0x31) = *(char *)(param_1 + 0x31) + -1;
    }
  }
  if (iVar6 < 100) {
    if ((uVar3 != 0xb) && (unit_type_array_scenery[uVar3].field4_0x8 != 0)) {
      bVar1 = true;
    }
    bVar2 = true;
  }
  if (bVar1) {
    puVar5 = (unit_struct *)(int)unit_type_array_scenery[uVar3].field4_0x8;
    if ((param_3 != -1) && (game_state.tribes_array[param_3].field_0xc1f == '\x01')) {
      puVar5 = (unit_struct *)(((uint)puVar5 >> 1) + ((uint)puVar5 >> 3));
    }
    ptr_unit_related_20B->field0_0x0 = (uint)*(byte *)(param_1 + 0x2a);
    ptr_unit_related_20B->field1_0x4 = (uint)*(byte *)(param_1 + 0x2b);
    ptr_unit_related_20B->unit_ptr = puVar5;
    ptr_unit_related_20B->field3_0xc = 0;
    ptr_unit_related_20B->field4_0x10 = 0;
    ptr_unit_related_20B = ptr_unit_related_20B + 1;
    unit_allocation_flag = 1;
    alloc_unit(5,0x11,*(undefined1 *)(param_1 + 0x2f),param_1 + 0x3d);
  }
  if (!bVar2) {
    iVar4 = (int)objs0_mem[*(short *)(param_1 + 0x33)].maybe_coord_scale / 6;
    *(int *)(param_1 + 0x68) =
         ((objs0_mem[*(short *)(param_1 + 0x33)].maybe_coord_scale - iVar4) * iVar6) /
         (int)unit_type_array_scenery[*(byte *)(param_1 + 0x2b)].field2_0x4 + iVar4;
    return;
  }
  FUN_004ef180(param_1);
  return;
}
