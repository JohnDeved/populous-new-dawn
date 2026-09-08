/* Ghidra 12.1.3 pseudocode; entry 004a6b20; FUN_004a6b20.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_004a6b20(int param_1)

{
  uint uVar1;
  unit_related_struct_20B *puVar2;
  undefined2 extraout_var;
  uint uVar3;
  int iVar4;
  int iVar5;
  int iVar6;
  undefined2 uStack_8;
  unit_struct *local_4;

  local_4 = (unit_struct *)0x10;
  iVar4 = 1;
  iVar6 = 0;
  iVar5 = 1;
  puVar2 = (unit_related_struct_20B *)0x0;
  if ((*(uint *)(param_1 + 0xc) & 0x400) != 0) {
    *(uint *)(param_1 + 0xc) = *(uint *)(param_1 + 0xc) & 0xfffffbff;
    ptr_unit_related_20B = ptr_unit_related_20B + -1;
    puVar2 = ptr_unit_related_20B;
  }
  if (puVar2 != (unit_related_struct_20B *)0x0) {
    iVar4 = puVar2->field0_0x0;
    iVar5 = puVar2->field1_0x4;
    local_4 = puVar2->unit_ptr;
    iVar6 = puVar2->field3_0xc;
  }
  *(undefined1 *)(param_1 + 0x2f) = 0xff;
  if ((*(byte *)(param_1 + 0xe) & 0x10) == 0) {
    empty_unit_function(param_1);
    *(undefined1 *)(param_1 + 0x2c) = 3;
    init_unit_class(param_1);
  }
  if (iVar5 != 0) {
    *(ushort *)(param_1 + 0x3d) = (*(ushort *)(param_1 + 0x3d) & 0xfe00) + 0x100;
    *(ushort *)(param_1 + 0x3f) = (*(ushort *)(param_1 + 0x3f) & 0xfe00) + 0x100;
  }
  insert_unit_into_land_tile(param_1,(undefined2 *)(param_1 + 0x3d));
  FUN_0044fad0(CONCAT22(uStack_8,CONCAT11((char)((ushort)*(undefined2 *)(param_1 + 0x3f) >> 8),
                                          (char)((ushort)*(undefined2 *)(param_1 + 0x3d) >> 8))) &
               0xfffffefe);
  FUN_004a66c0(param_1,unit_type_array_scenery[*(byte *)(param_1 + 0x2b)].obj_related_index,
               CONCAT22(extraout_var,unit_type_array_scenery[*(byte *)(param_1 + 0x2b)].obj_index));
  if (iVar4 != 0) {
    sunlight_update_unit_landscape(param_1,3,4,0);
  }
  *(undefined4 *)(param_1 + 0x68) = 1;
  iVar4 = (int)local_4 * objs0_mem[*(short *)(param_1 + 0x33)].maybe_coord_scale;
  *(undefined4 *)(param_1 + 0x7e) = objs0_mem[*(short *)(param_1 + 0x33)].maybe_coord_scale;
  iVar4 = iVar4 + (iVar4 >> 0x1f & 0xfU);
  *(byte *)(param_1 + 0x36) = *(byte *)(param_1 + 0x36) | 2;
  iVar5 = iVar4 >> 4;
  *(int *)(param_1 + 0x7e) = iVar5;
  *(short *)(param_1 + 0x82) = (short)(CONCAT44(iVar4 >> 0x1f,iVar5) / 10);
  uVar3 = pseudo_random * 0x24a1 + 0x24df;
  uVar1 = uVar3 >> 0xd;
  pseudo_random = uVar1 | uVar3 * 0x80000;
  *(byte *)(param_1 + 0x39) = (byte)uVar1 & 7;
  if (iVar6 != 0) {
    *(byte *)(param_1 + 0x90) = *(byte *)(param_1 + 0x90) | 0x10;
  }
  return;
}
