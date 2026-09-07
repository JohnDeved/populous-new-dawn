/* Ghidra 12.1.3 pseudocode; entry 004faaf0; FUN_004faaf0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_004faaf0(int param_1)

{
  undefined4 *puVar1;
  char cVar2;
  unit_struct *puVar3;
  undefined1 uVar4;
  ushort uVar5;
  short sVar6;
  undefined2 uVar7;
  uint uVar8;
  undefined1 uVar9;
  undefined2 extraout_var;
  undefined1 uVar10;
  undefined2 extraout_var_00;
  undefined4 uVar11;
  unit_related_struct_20B *puVar12;
  undefined4 local_14;
  undefined2 local_10;
  undefined2 local_e;
  undefined2 local_8;
  undefined2 local_6;
  undefined2 local_4;

  uVar4 = 0xb;
  uVar10 = 0;
  uVar11 = 3;
  uVar9 = 3;
  if ((*(uint *)(param_1 + 0xc) & 0x400) == 0) {
    puVar12 = (unit_related_struct_20B *)0x0;
  }
  else {
    *(uint *)(param_1 + 0xc) = *(uint *)(param_1 + 0xc) & 0xfffffbff;
    ptr_unit_related_20B = ptr_unit_related_20B + -1;
    puVar12 = ptr_unit_related_20B;
  }
  if (puVar12 != (unit_related_struct_20B *)0x0) {
    uVar4 = (undefined1)puVar12->field0_0x0;
    uVar11 = puVar12->field1_0x4;
    uVar9 = SUB41(puVar12->unit_ptr,0);
    uVar10 = (undefined1)puVar12->field3_0xc;
  }
  if (puVar12 != (unit_related_struct_20B *)0x0 || (*(byte *)(param_1 + 0x14) & 4) == 0) {
    *(undefined1 *)(param_1 + 0x7c) = uVar4;
    *(undefined4 *)(param_1 + 0x74) = uVar11;
    *(undefined1 *)(param_1 + 0x80) = uVar9;
    *(undefined1 *)(param_1 + 0x7d) = uVar10;
  }
  *(undefined1 *)(param_1 + 0x2f) = 0xff;
  *(undefined1 *)(param_1 + 0x2d) = 0;
  if ((*(byte *)(param_1 + 0xe) & 0x10) == 0) {
    empty_unit_function(param_1);
    *(undefined1 *)(param_1 + 0x2c) = 4;
    init_unit_class(param_1);
  }
  puVar1 = (undefined4 *)(param_1 + 0x3d);
  sVar6 = 800;
  insert_unit_into_land_tile(param_1,puVar1);
  local_14 = *puVar1;
  local_10 = CONCAT11((char)((uint)local_14 >> 0x18),(char)((uint)local_14 >> 8));
  uVar8 = (local_10 & 0xfe) * 2 | local_10 & 0xfe00;
  uVar5 = (&game_state.level_data[0].unit_index_2)[uVar8 * 2] & 0x3ff;
  if (uVar5 != 0) {
    puVar3 = unit_land_array[uVar5];
    if (((*(byte *)((int)&game_state.level_data[0].flags + uVar8 * 4 + 1) & 2) == 0) ||
       (puVar3->unit_type != '\x12')) {
      if (puVar3->unit_class == '\t') {
        FUN_004b9fc0();
      }
      else {
        FUN_004044b0(puVar3,&local_14);
      }
    }
    else {
      sVar6 = FUN_00404540(puVar3,1,&local_10);
      local_14 = CONCAT22(local_e,local_10);
    }
  }
  local_4 = 0;
  local_8 = (undefined2)local_14;
  local_6 = local_14._2_2_;
  add_unit_to_cell(param_1,&local_8);
  uVar7 = calc_point_height(CONCAT22(extraout_var_00,*(undefined2 *)puVar1),
                            CONCAT22(extraout_var,*(undefined2 *)(param_1 + 0x3f)));
  *(undefined2 *)(param_1 + 0x41) = uVar7;
  *(uint *)(param_1 + 0x10) = *(uint *)(param_1 + 0x10) & 0xfffffbff;
  *(short *)(param_1 + 0x41) = *(short *)(param_1 + 0x41) + sVar6;
  uVar8 = 0xffffffff;
  cVar2 = *(char *)(param_1 + 0x7c);
  if (cVar2 == '\x02') {
    uVar8 = (uint)*(ushort *)&unit_type_array_building[*(int *)(param_1 + 0x74)].field_0xa;
  }
  else if (cVar2 == '\x06') {
    uVar8 = 0x420;
  }
  else if (cVar2 == '\v') {
    uVar8 = (uint)(ushort)(&DAT_005a80de)[*(int *)(param_1 + 0x74) * 0x1f];
  }
  if (-1 < (int)uVar8) {
    unit_set_object(param_1 + 0x33,0,uVar8);
  }
  uVar5 = *(ushort *)(param_1 + 0x35);
  *(ushort *)(param_1 + 0x35) = uVar5 | 0x8000;
  *(ushort *)(param_1 + 0x35) = uVar5 | 0x8080;
  return;
}
