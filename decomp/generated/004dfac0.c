/* Ghidra 12.1.3 pseudocode; entry 004dfac0; FUN_004dfac0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


/* WARNING: Removing unreachable block (ram,0x004dfbfe) */
/* WARNING: Removing unreachable block (ram,0x004dfc08) */

void FUN_004dfac0(int param_1)

{
  undefined2 uVar1;
  ushort uVar2;
  undefined2 extraout_var;
  int iVar3;
  uint uVar4;
  undefined2 extraout_var_00;
  uint uVar5;
  uint *puVar6;
  undefined2 local_c;
  undefined2 local_a;
  undefined2 local_8;
  undefined2 local_6;
  undefined2 local_4;

  FUN_00466c80(param_1,1);
  if (*(char *)(param_1 + 0x2b) == '\a') {
    *(undefined1 *)(param_1 + 0x2d) = 3;
    *(uint *)(param_1 + 0xc) = *(uint *)(param_1 + 0xc) | 0x40000000;
  }
  else {
    FUN_004783a0(game_state.some_unit,(int)*(short *)(param_1 + 0x74),(int)*(char *)(param_1 + 0x2f)
                 ,&local_c);
    local_8 = local_c;
    local_6 = local_a;
    local_4 = 0;
    add_unit_to_cell(param_1,&local_8);
    uVar1 = calc_point_height(CONCAT22(extraout_var_00,*(undefined2 *)(param_1 + 0x3d)),
                              CONCAT22(extraout_var,*(undefined2 *)(param_1 + 0x3f)));
    *(undefined2 *)(param_1 + 0x41) = uVar1;
    *(uint *)(param_1 + 0x10) = *(uint *)(param_1 + 0x10) & 0xfffffbff;
    *(undefined2 *)(param_1 + 0x43) = 0;
    *(undefined2 *)(param_1 + 0x47) = 0;
    *(undefined2 *)(param_1 + 0x45) = 0;
    iVar3 = alloc_unit(7,0x20,*(undefined1 *)(param_1 + 0x2f),(undefined2 *)(param_1 + 0x3d));
    if (iVar3 != 0) {
      if ((*(byte *)(iVar3 + 0xe) & 0x10) == 0) {
        empty_unit_function(iVar3);
        *(undefined1 *)(iVar3 + 0x2c) = 0x24;
        init_unit_class(iVar3);
      }
      *(undefined2 *)(iVar3 + 0x6c) = 0xf;
      unit_set_object(iVar3 + 0x33,0x2c,0x579);
      if (*(char *)(param_1 + 0x2f) == -1) {
        *(undefined1 *)(iVar3 + 0x3c) = 0;
      }
      else {
        *(char *)(iVar3 + 0x3c) = global_palette_indexes_2[*(char *)(param_1 + 0x2f) * 5 + 3] + -2;
      }
    }
    *(undefined1 *)(param_1 + 0x2d) = 1;
    *(ushort *)(param_1 + 0x35) = *(ushort *)(param_1 + 0x35) & 0xffef;
    *(uint *)(param_1 + 0xc) = *(uint *)(param_1 + 0xc) | 0x40000000;
  }
  puVar6 = (uint *)(param_1 + 0xc);
  uVar5 = (uint)(ushort)(((game_state.some_unit)->pos).x - *(short *)(param_1 + 0x3d));
  uVar4 = (uint)(ushort)(((game_state.some_unit)->pos).y - *(short *)(param_1 + 0x3f));
  if (0x7fff < uVar5) {
    uVar5 = uVar5 - 0x10000;
  }
  if (0x7fff < uVar4) {
    uVar4 = uVar4 - 0x10000;
  }
  uVar2 = calc_angle_quadrant(uVar5,-uVar4);
  *puVar6 = *puVar6 & 0xffffbfff;
  update_gs_unit_related_array_item(param_1);
  *(ushort *)(param_1 + 0x57) = uVar2 & 0x7ff;
  *(undefined2 *)(param_1 + 0x5f) = 0;
  uVar5 = *puVar6;
  *puVar6 = uVar5 | 0x80;
  *puVar6 = uVar5 | 0x1080;
  uVar2 = (*(short *)(param_1 + 0x78) == 0) - 1 & 4;
  if (((uVar5 & 0x80000) != 0) && (uVar2 = 0xc, (*(byte *)(param_1 + 0x11) & 4) == 0)) {
    uVar2 = 2;
    *puVar6 = uVar5 & 0xffff7fff | 0x1080;
  }
  unit_set_object_upper
            (param_1,unit_type_to_obj_indexes_map
                     [(uint)*(byte *)(param_1 + 0x2b) + (short)uVar2 * 9]);
  return;
}
