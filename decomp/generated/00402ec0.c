/* Ghidra 12.1.3 pseudocode; entry 00402ec0; init_unit_type_2.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void __thiscall init_unit_type_2(undefined4 param_1,int param_2)

{
  undefined2 uVar1;
  undefined2 extraout_var;
  undefined2 extraout_var_00;
  undefined2 extraout_var_01;
  undefined2 extraout_var_02;
  undefined2 extraout_var_03;
  undefined2 extraout_var_04;
  undefined2 extraout_var_05;
  undefined2 extraout_var_06;
  undefined2 extraout_var_07;
  undefined2 extraout_var_08;
  undefined2 extraout_var_09;
  undefined2 extraout_var_10;
  undefined2 extraout_var_11;
  undefined2 extraout_var_12;
  undefined2 extraout_var_13;
  undefined2 extraout_var_14;
  undefined2 extraout_var_15;
  undefined2 extraout_var_16;

  uVar1 = (undefined2)((uint)param_1 >> 0x10);
  switch(*(byte *)(param_2 + 0x2b) - 1) {
  case 0:
    init_unit_building(param_2);
    uVar1 = extraout_var_00;
    break;
  case 1:
    init_unit_building(param_2);
    uVar1 = extraout_var_01;
    break;
  case 2:
    init_unit_building(param_2);
    uVar1 = extraout_var_02;
    break;
  case 3:
    init_unit_building(param_2);
    uVar1 = extraout_var_03;
    break;
  case 4:
    init_unit_building(param_2);
    uVar1 = extraout_var_04;
    break;
  case 5:
    init_unit_building(param_2);
    uVar1 = extraout_var_05;
    break;
  case 6:
    init_unit_building(param_2);
    uVar1 = extraout_var_06;
    break;
  case 7:
    init_unit_building(param_2);
    uVar1 = extraout_var_07;
    break;
  case 8:
    init_unit_building(param_2);
    uVar1 = extraout_var_08;
    break;
  case 9:
  case 0xb:
    break;
  case 10:
    init_unit_building(param_2);
    uVar1 = extraout_var_09;
    break;
  case 0xc:
    init_unit_building(param_2);
    init_boat_hut(param_2,0);
    uVar1 = extraout_var_10;
    break;
  case 0xd:
    init_unit_building(param_2);
    init_boat_hut(param_2,0);
    uVar1 = extraout_var_11;
    break;
  case 0xe:
    init_unit_building(param_2);
    uVar1 = extraout_var_12;
    break;
  case 0xf:
    init_unit_building(param_2);
    uVar1 = extraout_var_13;
    break;
  default:
    init_unit_building(param_2);
    uVar1 = extraout_var;
    break;
  case 0x11:
    init_unit_building(param_2);
    *(undefined1 *)(param_2 + 0x2f) = 0xff;
    if ((*(byte *)(param_2 + 0xe) & 0x10) == 0) {
      empty_unit_function(param_2);
      *(undefined1 *)(param_2 + 0x2c) = 2;
      init_unit_class(param_2);
    }
    *(uint *)(param_2 + 0xc) = *(uint *)(param_2 + 0xc) | 0x100000;
    unit_set_object(param_2 + 0x33,unit_type_array_building[*(byte *)(param_2 + 0x2b)].some_index,
                    0x9a);
    uVar1 = extraout_var_14;
    break;
  case 0x12:
    init_unit_building(param_2);
    uVar1 = extraout_var_15;
    if ((*(byte *)(param_2 + 0xe) & 0x10) == 0) {
      empty_unit_function(param_2);
      *(undefined1 *)(param_2 + 0x2c) = 2;
      init_unit_class(param_2);
      uVar1 = extraout_var_16;
    }
    *(uint *)(param_2 + 0x14) = *(uint *)(param_2 + 0x14) & 0xffffff7f;
    *(uint *)(param_2 + 0xc) = *(uint *)(param_2 + 0xc) | 0x100000;
  }
  *(undefined1 *)(param_2 + 0xaf) = 0xff;
  uVar1 = calc_point_height(CONCAT22(uVar1,*(undefined2 *)(param_2 + 0x3d)),
                            *(undefined2 *)(param_2 + 0x3f));
  *(undefined2 *)(param_2 + 0x41) = uVar1;
  *(uint *)(param_2 + 0x10) = *(uint *)(param_2 + 0x10) & 0xfffffbff;
  return;
}
