/* Ghidra 12.1.3 pseudocode; entry 00511800; FUN_00511800.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_00511800(int param_1)

{
  undefined2 uVar1;
  unit_struct *puVar2;
  unit_related_struct_20B *puVar3;
  int iVar4;
  uint uVar5;
  undefined2 local_8;
  undefined2 local_6;
  undefined2 local_4;

  uVar1 = *(undefined2 *)(param_1 + 0x3d);
  local_6 = *(undefined2 *)(param_1 + 0x3f);
  local_8 = CONCAT11((char)((ushort)local_6 >> 8),(char)((ushort)uVar1 >> 8));
  *(uint *)(param_1 + 0x10) = *(uint *)(param_1 + 0x10) & 0xfffffeff;
  uVar5 = (local_8 & 0xfe) * 2 | local_8 & 0xfe00;
  local_8 = uVar1;
  local_4 = calc_point_height(uVar1,local_6);
  FUN_0050ccd0(param_1);
  if ((*(byte *)(landscape_height_array + ((&game_state.level_data[0].c_3)[uVar5 * 4] & 0xf)) & 2)
      == 0) {
    ptr_unit_related_20B->field0_0x0 = 1;
    ptr_unit_related_20B->field1_0x4 = 0;
    ptr_unit_related_20B->unit_ptr = (unit_struct *)0x20;
    ptr_unit_related_20B->field3_0xc = 0;
    puVar3 = ptr_unit_related_20B;
    ptr_unit_related_20B->field4_0x10 = 0;
    ptr_unit_related_20B = ptr_unit_related_20B + 1;
    unit_allocation_flag = 1;
    iVar4 = alloc_unit(5,10,CONCAT31((int3)((uint)puVar3 >> 8),*(undefined1 *)(param_1 + 0x2f)),
                       &local_8);
    if (iVar4 != 0) {
      FUN_004a8c60(iVar4,0x16);
      *(byte *)(iVar4 + 0x90) = *(byte *)(iVar4 + 0x90) | 1;
      add_unit_to_cell(iVar4,&local_8);
      FUN_0048a050(iVar4,0xb6,0);
    }
  }
  else {
    iVar4 = alloc_unit(7,0x2b,*(undefined1 *)(param_1 + 0x2f),&local_8);
    if (iVar4 != 0) {
      FUN_0048a050(iVar4,0x55,0);
      *(uint *)(iVar4 + 0x10) = *(uint *)(iVar4 + 0x10) | 0x400000;
    }
  }
  iVar4 = alloc_unit(7,1,*(undefined1 *)(param_1 + 0x2f),&local_8);
  if (iVar4 != 0) {
    *(byte *)(iVar4 + 0x7a) = *(byte *)(iVar4 + 0x7a) | 1;
    *(undefined4 *)(iVar4 + 0x68) = 3;
    *(undefined2 *)(iVar4 + 0x70) = 2;
    *(undefined2 *)(iVar4 + 0x72) = 5;
    *(undefined2 *)(iVar4 + 0x78) = 0x62;
    *(undefined2 *)(iVar4 + 0x74) = 0x8c;
    *(undefined1 *)(iVar4 + 0x7b) = 1;
    *(undefined1 *)(iVar4 + 0x7d) = 1;
    *(undefined2 *)(iVar4 + 0x76) = 2;
    *(int *)(iVar4 + 0x6c) = (int)*(short *)(iVar4 + 0x72) << 8;
  }
  puVar2 = unit_land_array[(ushort)(&game_state.level_data[0].unit_index_2)[uVar5 * 2] & 0x3ff];
  if ((puVar2 != (unit_struct *)0x0) && (puVar2->unit_class == '\x02')) {
    FUN_00408cb0(puVar2,*(undefined1 *)(param_1 + 0x2f));
  }
  return;
}
