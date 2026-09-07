/* Ghidra 12.1.3 pseudocode; entry 004fa530; init_unit_type_6.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void init_unit_type_6(int param_1)

{
  undefined2 uVar1;
  short sVar2;
  unit_related_struct_20B *puVar3;
  undefined2 extraout_var;
  undefined2 extraout_var_00;
  int iVar4;
  undefined1 local_4 [4];

  switch(*(undefined1 *)(param_1 + 0x2b)) {
  case 1:
    *(undefined1 *)(param_1 + 0x2f) = 0xff;
    if ((*(byte *)(param_1 + 0xe) & 0x10) == 0) {
      empty_unit_function(param_1);
      *(undefined1 *)(param_1 + 0x2c) = 1;
      init_unit_class(param_1);
    }
    insert_unit_into_land_tile(param_1,param_1 + 0x3d);
    unit_set_object(param_1 + 0x33,0,0xe);
    *(byte *)(param_1 + 0x35) = *(byte *)(param_1 + 0x35) | 0x10;
    *(uint *)(param_1 + 0xc) = *(uint *)(param_1 + 0xc) | 0x10000000;
    sunlight_update_unit_landscape(param_1,10,5,0);
    return;
  case 2:
    FUN_004faaf0(param_1);
    return;
  case 3:
    *(undefined1 *)(param_1 + 0x2f) = 0xff;
    if ((*(byte *)(param_1 + 0xe) & 0x10) == 0) {
      empty_unit_function(param_1);
      *(undefined1 *)(param_1 + 0x2c) = 2;
      init_unit_class(param_1);
    }
    insert_unit_into_land_tile(param_1,param_1 + 0x3d);
    unit_set_object(param_1 + 0x33,2,0xd);
    return;
  case 4:
    *(undefined1 *)(param_1 + 0x2f) = 0xff;
    if ((*(byte *)(param_1 + 0xe) & 0x10) == 0) {
      empty_unit_function(param_1);
      *(undefined1 *)(param_1 + 0x2c) = 2;
      init_unit_class(param_1);
    }
    insert_unit_into_land_tile(param_1,param_1 + 0x3d);
    unit_set_object(param_1 + 0x33,2,0xd);
    return;
  case 5:
    if ((*(byte *)(param_1 + 0xe) & 0x10) == 0) {
      empty_unit_function(param_1);
      *(undefined1 *)(param_1 + 0x2c) = 3;
      init_unit_class(param_1);
    }
    insert_unit_into_land_tile(param_1,param_1 + 0x3d);
    unit_set_object(param_1 + 0x33,0,0);
    return;
  case 6:
    FUN_004fb1d0(param_1);
    return;
  case 7:
    iVar4 = 1;
    *(undefined1 *)(param_1 + 0x2f) = 0xff;
    if ((*(uint *)(param_1 + 0xc) & 0x400) == 0) {
      puVar3 = (unit_related_struct_20B *)0x0;
    }
    else {
      *(uint *)(param_1 + 0xc) = *(uint *)(param_1 + 0xc) & 0xfffffbff;
      ptr_unit_related_20B = ptr_unit_related_20B + -1;
      puVar3 = ptr_unit_related_20B;
    }
    if (puVar3 != (unit_related_struct_20B *)0x0) {
      iVar4 = puVar3->field0_0x0;
    }
    if ((*(byte *)(param_1 + 0xe) & 0x10) == 0) {
      empty_unit_function(param_1);
      *(undefined1 *)(param_1 + 0x2c) = 6;
      init_unit_class(param_1);
    }
    insert_unit_into_land_tile(param_1,param_1 + 0x3d);
    unit_set_object(param_1 + 0x33,10,
                    CONCAT22((short)((uint)(iVar4 * 0x17) >> 0x10),
                             *(undefined2 *)&unit_type_array_vehicle[iVar4].field_0x4));
    *(ushort *)(param_1 + 0x35) = *(ushort *)(param_1 + 0x35) & 0xff7f;
    FUN_004fc200(param_1);
    return;
  case 8:
    insert_unit_into_land_tile(param_1,param_1 + 0x3d);
    if ((*(byte *)(param_1 + 0xe) & 0x10) == 0) {
      empty_unit_function(param_1);
      *(undefined1 *)(param_1 + 0x2c) = 9;
      init_unit_class(param_1);
      return;
    }
    break;
  case 9:
    FUN_004fc330(param_1);
    return;
  case 10:
    *(undefined1 *)(param_1 + 0x2f) = 0xff;
    *(undefined1 *)(param_1 + 0x2d) = 0;
    if ((*(byte *)(param_1 + 0xe) & 0x10) == 0) {
      empty_unit_function(param_1);
      *(undefined1 *)(param_1 + 0x2c) = 8;
      init_unit_class(param_1);
    }
    insert_unit_into_land_tile(param_1,(undefined2 *)(param_1 + 0x3d));
    uVar1 = calc_point_height(CONCAT22(extraout_var_00,*(undefined2 *)(param_1 + 0x3d)),
                              CONCAT22(extraout_var,*(undefined2 *)(param_1 + 0x3f)));
    *(undefined2 *)(param_1 + 0x41) = uVar1;
    *(uint *)(param_1 + 0x10) = *(uint *)(param_1 + 0x10) & 0xfffffbff;
    sVar2 = FUN_004fc790(param_1,local_4);
    *(short *)(param_1 + 0x41) = *(short *)(param_1 + 0x41) + sVar2;
  }
  return;
}
