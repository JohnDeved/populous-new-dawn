/* Ghidra 12.1.3 pseudocode; entry 004df450; FUN_004df450.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


uint FUN_004df450(int param_1)

{
  char cVar1;
  byte bVar2;
  uint uVar3;
  undefined2 uVar4;
  short sVar5;
  undefined2 extraout_var;
  uint uVar6;
  ushort uVar7;
  undefined2 extraout_var_00;
  undefined1 uVar8;

  cVar1 = *(char *)(param_1 + 0x2d);
  if (cVar1 == '\0') {
    uVar6 = *(uint *)(param_1 + 0xc);
    if ((uVar6 & 0x40000000) != 0) {
      *(undefined2 *)(param_1 + 0x70) = 0x14;
      uVar6 = uVar6 & 0xbfffffff;
      *(uint *)(param_1 + 0xc) = uVar6;
    }
    sVar5 = *(short *)(param_1 + 0x70) + -1;
    uVar6 = CONCAT22((short)(uVar6 >> 0x10),sVar5);
    *(short *)(param_1 + 0x70) = sVar5;
    if (sVar5 < 1) {
      *(undefined1 *)(param_1 + 0x2d) = 1;
      *(uint *)(param_1 + 0xc) = *(uint *)(param_1 + 0xc) | 0x40000000;
      return uVar6 & 0xffffff00;
    }
    goto LAB_004df660;
  }
  if (cVar1 == '\x01') {
    uVar6 = *(uint *)(param_1 + 0xc);
    if ((uVar6 & 0x40000000) != 0) {
      *(uint *)(param_1 + 0xc) = uVar6 & 0xbfffffff;
      *(uint *)(param_1 + 0xc) = uVar6 & 0xbfffbfff;
      if (*(char *)(param_1 + 0x2b) != '\a') {
        *(uint *)(param_1 + 0x10) = *(uint *)(param_1 + 0x10) & 0xffffff7f;
      }
      insert_unit_into_land_tile(param_1,(undefined2 *)(param_1 + 0x3d));
      uVar4 = calc_point_height(CONCAT22(extraout_var_00,*(undefined2 *)(param_1 + 0x3d)),
                                CONCAT22(extraout_var,*(undefined2 *)(param_1 + 0x3f)));
      *(uint *)(param_1 + 0xc) = *(uint *)(param_1 + 0xc) | 0x80000;
      *(undefined2 *)(param_1 + 0x41) = uVar4;
      *(uint *)(param_1 + 0x10) = *(uint *)(param_1 + 0x10) | 0x400;
      *(short *)(param_1 + 0x41) = *(short *)(param_1 + 0x41) + 0x400;
      uVar6 = unit_set_object_upper
                        (param_1,unit_type_to_obj_indexes_map[*(byte *)(param_1 + 0x2b) + 0x12]);
    }
    if (((*(byte *)(param_1 + 0xe) & 8) == 0) && ((*(byte *)(param_1 + 0x11) & 4) == 0)) {
      *(undefined2 *)(param_1 + 0x6e) = *(undefined2 *)(param_1 + 0x6c);
      uVar6 = alloc_unit(7,8,*(undefined1 *)(param_1 + 0x2f),param_1 + 0x3d);
      *(undefined1 *)(param_1 + 0x2d) = 2;
      *(uint *)(param_1 + 0xc) = *(uint *)(param_1 + 0xc) | 0x40000000;
      return uVar6 & 0xffffff00;
    }
    goto LAB_004df660;
  }
  if (cVar1 != '\x02') {
    return 0;
  }
  uVar6 = *(uint *)(param_1 + 0xc);
  if ((uVar6 & 0x40000000) != 0) {
    uVar3 = *(uint *)(param_1 + 0x10);
    *(uint *)(param_1 + 0xc) = uVar6 & 0xbfffffff;
    *(uint *)(param_1 + 0x10) = uVar3 & 0xffffdfff;
    *(undefined2 *)(param_1 + 0x70) = 4;
    *(undefined2 *)(param_1 + 0x5f) = 0;
    uVar7 = (*(short *)(param_1 + 0x78) == 0) - 1 & 4;
    if (((uVar6 & 0x80000) != 0) && (uVar7 = 0xc, (uVar3 & 0x400) == 0)) {
      uVar7 = 2;
      *(uint *)(param_1 + 0xc) = uVar6 & 0xbfff7fff;
    }
    uVar6 = unit_set_object_upper
                      (param_1,unit_type_to_obj_indexes_map
                               [(uint)*(byte *)(param_1 + 0x2b) + (short)uVar7 * 9]);
  }
  sVar5 = *(short *)(param_1 + 0x70) + -1;
  uVar6 = CONCAT22((short)(uVar6 >> 0x10),sVar5);
  *(short *)(param_1 + 0x70) = sVar5;
  if (0 < sVar5) goto LAB_004df660;
  uVar6 = FUN_004e9b40(param_1);
  if ((*(byte *)(param_1 + 0xe) & 0x10) == 0) {
    *(undefined1 *)(param_1 + 0x7d) = *(undefined1 *)(param_1 + 0x2c);
    if ((game_state.level_flags & 2) == 0) {
      bVar2 = *(byte *)(param_1 + 0x2b);
LAB_004df62a:
      uVar8 = unit_type_array_person[bVar2].next_state;
    }
    else {
      bVar2 = *(byte *)(param_1 + 0x2b);
      if (bVar2 != 7) goto LAB_004df62a;
      uVar8 = 0x27;
    }
    empty_unit_function(param_1);
    *(undefined1 *)(param_1 + 0x2c) = uVar8;
    uVar6 = init_unit_class(param_1);
  }
  if (*(char *)(param_1 + 0x2b) == '\a') {
    *(uint *)(param_1 + 0x10) = *(uint *)(param_1 + 0x10) | 0x80;
    uVar6 = FUN_00445750(param_1,0,0);
  }
LAB_004df660:
  return uVar6 & 0xffffff00;
}
