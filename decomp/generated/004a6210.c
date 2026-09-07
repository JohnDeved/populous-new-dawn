/* Ghidra 12.1.3 pseudocode; entry 004a6210; init_unit_class_5.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void init_unit_class_5(int param_1)

{
  byte bVar1;
  undefined2 uVar2;
  undefined4 in_EAX;
  uint uVar3;
  uint uVar4;
  int iVar5;
  undefined2 uVar6;
  undefined2 extraout_var;
  undefined2 extraout_var_00;
  undefined2 extraout_var_01;
  undefined2 extraout_var_02;

  uVar3 = CONCAT31((int3)((uint)in_EAX >> 8),*(undefined1 *)(param_1 + 0x90)) & 0xfffffff9;
  iVar5 = *(byte *)(param_1 + 0x2c) - 1;
  bVar1 = (byte)uVar3;
  *(byte *)(param_1 + 0x90) = bVar1;
  *(undefined1 *)(param_1 + 0x2d) = 0;
  uVar2 = (undefined2)(uVar3 >> 0x10);
  uVar6 = (undefined2)((uint)iVar5 >> 0x10);
  switch(iVar5) {
  case 0:
    FUN_004a66c0(param_1,CONCAT22((short)((uint)(unit_type_array_scenery + *(byte *)(param_1 + 0x2b)
                                                ) >> 0x10),
                                  unit_type_array_scenery[*(byte *)(param_1 + 0x2b)].
                                  obj_related_index),
                 unit_type_array_scenery[*(byte *)(param_1 + 0x2b)].obj_index);
    uVar2 = calc_point_height(CONCAT22(extraout_var_01,*(undefined2 *)(param_1 + 0x3d)),
                              CONCAT22(extraout_var,*(undefined2 *)(param_1 + 0x3f)));
    *(undefined2 *)(param_1 + 0x41) = uVar2;
    *(uint *)(param_1 + 0x10) = *(uint *)(param_1 + 0x10) & 0xfffffbff;
    return;
  case 1:
    uVar2 = calc_point_height(CONCAT22(uVar6,*(undefined2 *)(param_1 + 0x3d)),
                              CONCAT22(uVar2,*(undefined2 *)(param_1 + 0x3f)));
    *(uint *)(param_1 + 0x10) = *(uint *)(param_1 + 0x10) & 0xfffffbff;
    *(undefined2 *)(param_1 + 0x41) = uVar2;
    *(uint *)(param_1 + 0x14) = *(uint *)(param_1 + 0x14) | 0x200000;
    *(undefined2 *)(param_1 + 0x6c) = 0;
    *(ushort *)(param_1 + 0x35) = *(ushort *)(param_1 + 0x35) & 0xffdf;
    *(undefined2 *)(param_1 + 0x6e) = 0;
    return;
  case 2:
    uVar2 = calc_point_height(CONCAT22(uVar6,*(undefined2 *)(param_1 + 0x3d)),
                              CONCAT22(uVar2,*(undefined2 *)(param_1 + 0x3f)));
    *(undefined2 *)(param_1 + 0x41) = uVar2;
    *(uint *)(param_1 + 0x10) = *(uint *)(param_1 + 0x10) & 0xfffffbff;
    return;
  case 3:
    uVar2 = calc_point_height(CONCAT22(uVar6,*(undefined2 *)(param_1 + 0x3d)),
                              CONCAT22(uVar2,*(undefined2 *)(param_1 + 0x3f)));
    *(undefined2 *)(param_1 + 0x41) = uVar2;
    *(uint *)(param_1 + 0x10) = *(uint *)(param_1 + 0x10) & 0xfffffbff;
    return;
  case 4:
    *(byte *)(param_1 + 0x90) = bVar1 | 4;
    *(undefined2 *)(param_1 + 0x7c) = 0x4c;
    uVar2 = calc_point_height(*(undefined2 *)(param_1 + 0x3d),
                              CONCAT22(uVar6,*(undefined2 *)(param_1 + 0x3f)));
    *(undefined2 *)(param_1 + 0x41) = uVar2;
    *(uint *)(param_1 + 0x10) = *(uint *)(param_1 + 0x10) & 0xfffffbff;
    return;
  case 5:
    FUN_004a66c0(param_1,CONCAT22((short)((uint)(unit_type_array_scenery + *(byte *)(param_1 + 0x2b)
                                                ) >> 0x10),
                                  unit_type_array_scenery[*(byte *)(param_1 + 0x2b)].
                                  obj_related_index),
                 unit_type_array_scenery[*(byte *)(param_1 + 0x2b)].obj_index);
    uVar2 = calc_point_height(CONCAT22(extraout_var_02,*(undefined2 *)(param_1 + 0x3d)),
                              CONCAT22(extraout_var_00,*(undefined2 *)(param_1 + 0x3f)));
    *(undefined2 *)(param_1 + 0x41) = uVar2;
    *(uint *)(param_1 + 0x10) = *(uint *)(param_1 + 0x10) & 0xfffffbff;
    return;
  case 6:
    uVar4 = game_state.pseudo_random_val * 0x24a1 + 0x24df;
    uVar3 = uVar4 >> 0xd;
    game_state.pseudo_random_val = uVar3 | uVar4 * 0x80000;
    *(ushort *)(param_1 + 0x5f) = ((ushort)uVar3 & 0x7f) + 0x80;
    return;
  case 7:
    FUN_004a66c0(param_1,CONCAT22((short)((uint)(unit_type_array_scenery + *(byte *)(param_1 + 0x2b)
                                                ) >> 0x10),
                                  unit_type_array_scenery[*(byte *)(param_1 + 0x2b)].
                                  obj_related_index),
                 unit_type_array_scenery[*(byte *)(param_1 + 0x2b)].obj_index);
    *(undefined2 *)(param_1 + 0x41) = 0;
    return;
  case 9:
    uVar2 = calc_point_height(CONCAT22(uVar6,*(undefined2 *)(param_1 + 0x3d)),
                              CONCAT22(uVar2,*(undefined2 *)(param_1 + 0x3f)));
    *(undefined2 *)(param_1 + 0x41) = uVar2;
    *(uint *)(param_1 + 0x10) = *(uint *)(param_1 + 0x10) & 0xfffffbff;
    return;
  case 10:
    FUN_004a8860(param_1);
    return;
  case 0xb:
    FUN_004a8860(param_1);
    return;
  case 0xc:
    FUN_004f1500(param_1,param_1 + 0x95);
  }
  return;
}
