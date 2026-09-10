/* Ghidra 12.1.3 pseudocode; entry 00501c00; FUN_00501c00.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


/* WARNING: Removing unreachable block (ram,0x00501c57) */
/* WARNING: Removing unreachable block (ram,0x00501c4d) */
/* WARNING: Removing unreachable block (ram,0x00501db9) */
/* WARNING: Removing unreachable block (ram,0x00501dc3) */

unit_struct * FUN_00501c00(int param_1)

{
  char cVar1;
  unit_struct *puVar2;
  char cVar3;
  char cVar4;
  ushort uVar5;
  ushort uVar6;
  short sVar7;
  int iVar8;
  uint uVar9;
  uint uVar10;
  int iVar11;
  undefined2 local_1c;
  undefined2 local_1a;
  undefined4 local_14;
  undefined4 local_10;
  int local_c;
  unit_struct *local_8;
  uint local_4;

  iVar11 = 0;
  local_8 = (unit_struct *)0x0;
  local_10 = 0;
  local_14 = 0;
  local_4 = (uint)*(byte *)(param_1 + 0x2b);
  cVar1 = *(char *)(param_1 + 0x2f);
  local_c = 0xfffffff;
  uVar10 = (uint)(ushort)(*(short *)(param_1 + 0x53) - *(short *)(param_1 + 0x3d));
  uVar9 = (uint)(ushort)(*(short *)(param_1 + 0x55) - *(short *)(param_1 + 0x3f));
  if (0x7fff < uVar10) {
    uVar10 = uVar10 - 0x10000;
  }
  if (0x7fff < uVar9) {
    uVar9 = uVar9 - 0x10000;
  }
  uVar5 = calc_angle_quadrant(uVar10,-uVar9);
  cVar3 = get_empty_indexed_xy(2,0,0,3);
  if (cVar3 != '\0') {
    local_1c = CONCAT11((char)((ushort)*(undefined2 *)(param_1 + 0x3f) >> 8),
                        (char)((ushort)*(undefined2 *)(param_1 + 0x3d) >> 8)) & 0xfefe;
    cVar4 = get_indexed_xy(cVar3,&local_10,&local_14);
    while (cVar4 != '\0') {
      local_1a = CONCAT11((char)local_14 * '\x02' + local_1c._1_1_,
                          (char)local_10 * '\x02' + (char)local_1c);
      for (puVar2 = unit_land_array
                    [(short)(&game_state.level_data[0].unit_index)
                            [((local_1a & 0xfe) * 2 | local_1a & 0xfe00) * 2]];
          puVar2 != (unit_struct *)0x0; puVar2 = unit_land_array[puVar2->next_unit_index]) {
        if ((((puVar2->unit_class == '\x01') && (puVar2->tribe_index == cVar1)) &&
            ((byte)puVar2->unit_type == local_4)) &&
           (((puVar2->state == '\n' &&
             (*(short *)((int)&puVar2->loc_3_z + (uint)(byte)puVar2->hut_people_inside * 2 + 1) != 0
             )) && (((puVar2->obj_index_anim_prev_2 & 0x20U) == 0 &&
                    ((puVar2->obj_index_anim_prev_2 & 8U) != 0)))))) {
          uVar10 = (uint)(ushort)((puVar2->vec3).z - (puVar2->pos).x);
          uVar9 = (uint)(ushort)(*(short *)&puVar2->field_0x55 - (puVar2->pos).y);
          if (0x7fff < uVar10) {
            uVar10 = uVar10 - 0x10000;
          }
          if (0x7fff < uVar9) {
            uVar9 = uVar9 - 0x10000;
          }
          uVar6 = calc_angle_quadrant(uVar10,-uVar9);
          sVar7 = calc_angular_diff_shortest(uVar6 & 0x7ff,uVar5 & 0x7ff);
          if (sVar7 < 0x71) {
            iVar11 = iVar11 + 1;
            puVar2->flags_3 = puVar2->flags_3 | 0x10;
            iVar8 = calc_distance_toroidal(&puVar2->pos,&(puVar2->vec3).z);
            if (iVar8 < local_c) {
              local_c = iVar8;
              local_8 = puVar2;
            }
          }
        }
      }
      cVar4 = get_indexed_xy(cVar3,&local_10,&local_14);
    }
    clear_indexed_xy(cVar3);
  }
  if (iVar11 < 2) {
    local_8 = (unit_struct *)0x0;
  }
  return local_8;
}
