/* Ghidra 12.1.3 pseudocode; entry 004958f0; FUN_004958f0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


/* WARNING: Removing unreachable block (ram,0x00495c73) */
/* WARNING: Removing unreachable block (ram,0x00495a64) */
/* WARNING: Removing unreachable block (ram,0x00495a6e) */
/* WARNING: Removing unreachable block (ram,0x00495c7d) */

uint FUN_004958f0(int param_1)

{
  char cVar1;
  short sVar2;
  short sVar3;
  unit_struct *puVar4;
  undefined1 uVar5;
  ushort uVar6;
  uint uVar7;
  uint uVar8;
  undefined2 local_12;
  short local_10;
  short local_e;
  uint local_c;
  uint local_8;
  uint local_4;

  if ((*(uint *)(param_1 + 0xc) & 0x40000000) != 0) {
    *(uint *)(param_1 + 0xc) = *(uint *)(param_1 + 0xc) & 0xbfffffff;
    local_12 = CONCAT11((char)((ushort)*(undefined2 *)(param_1 + 0x3f) >> 8),
                        (char)((ushort)*(undefined2 *)(param_1 + 0x3d) >> 8));
    *(undefined1 *)(param_1 + 0xaa) = 1;
    cVar1 = *(char *)(&game_state.level_data[0].unit_index_2 +
                     ((local_12 & 0xfe) * 2 | local_12 & 0xfe00) * 2);
    if ((unit_land_array[*(ushort *)(param_1 + 0x89)]->num_points == '\0') ||
       (uVar5 = 0x36, cVar1 != '\0')) {
      uVar5 = 0x17;
    }
    *(byte *)(param_1 + 0x76) = *(byte *)(param_1 + 0x76) | 0x10;
    *(undefined1 *)(param_1 + 0xa8) = uVar5;
    if (cVar1 != '\0') {
      uVar7 = *(uint *)(param_1 + 0x10) & 0xfffefff8;
      *(uint *)(param_1 + 0x10) = uVar7;
      *(uint *)(param_1 + 0x10) = uVar7 | 1;
    }
  }
  uVar7 = *(byte *)(param_1 + 0xa8) - 1;
  switch(*(byte *)(param_1 + 0xa8)) {
  case 1:
    *(undefined1 *)(param_1 + 0xaa) = 0;
    uVar7 = FUN_00438ca0(param_1,0x38);
    if ((char)uVar7 != '\0') {
      *(undefined1 *)(param_1 + 0xa8) = 3;
      *(byte *)(param_1 + 0x76) = *(byte *)(param_1 + 0x76) | 0x10;
      return uVar7 & 0xffffff00;
    }
    break;
  case 3:
    *(undefined1 *)(param_1 + 0xaa) = 0;
    uVar7 = FUN_00438db0(param_1);
    if ((char)uVar7 != '\0') {
      *(undefined1 *)(param_1 + 0xa8) = 0x17;
      *(byte *)(param_1 + 0x76) = *(byte *)(param_1 + 0x76) | 0x10;
      return uVar7 & 0xffffff00;
    }
    break;
  case 4:
    if ((*(ushort *)(param_1 + 0x76) & 0x10) != 0) {
      *(ushort *)(param_1 + 0x76) = *(ushort *)(param_1 + 0x76) & 0xffef;
      puVar4 = unit_land_array[*(ushort *)(param_1 + 0x89)];
      sVar2._0_1_ = puVar4->num_points;
      sVar2._1_1_ = puVar4->tex_size_type;
      if (sVar2 == 0) {
        FUN_004d4ee0(param_1);
        uVar8 = game_state.pseudo_random_val * 0x24a1 + 0x24df;
        uVar7 = uVar8 >> 0xd;
        local_8 = uVar7 | uVar8 * 0x80000;
        game_state.pseudo_random_val = local_8;
        *(ushort *)(param_1 + 0x70) = ((ushort)uVar7 & 7) + 8;
        FUN_004eec80(param_1);
      }
      else {
        FUN_004ba130(puVar4,&local_10);
        uVar7 = (uint)(ushort)(local_10 - *(short *)(param_1 + 0x3d));
        uVar8 = (uint)(ushort)(local_e - *(short *)(param_1 + 0x3f));
        if (0x7fff < uVar7) {
          uVar7 = uVar7 - 0x10000;
        }
        if (0x7fff < uVar8) {
          uVar8 = uVar8 - 0x10000;
        }
        uVar6 = calc_angle_quadrant(uVar7,-uVar8);
        if ((*(uint *)(param_1 + 0xc) & 0x80) != 0) {
          *(ushort *)(param_1 + 0x57) = uVar6 & 0xff;
        }
        uVar6 = uVar6 & 0xff;
        *(ushort *)(param_1 + 0x5d) = uVar6;
        if ((*(uint *)(param_1 + 0xc) & 0x8000) != 0) {
          uVar6 = uVar6 + 0x400;
        }
        *(ushort *)(param_1 + 0x26) = uVar6;
        FUN_004d50d0(param_1);
        FUN_0048a050(param_1,0x14,0x10);
        uVar8 = game_state.pseudo_random_val * 0x24a1 + 0x24df;
        uVar7 = uVar8 >> 0xd;
        local_4 = uVar7 | uVar8 * 0x80000;
        game_state.pseudo_random_val = local_4;
        *(ushort *)(param_1 + 0x70) = ((ushort)uVar7 & 0xf) + 0x10;
      }
    }
    if (*(char *)(param_1 + 0xaa) != '\0') {
      *(char *)(param_1 + 0xaa) = *(char *)(param_1 + 0xaa) + -1;
    }
    uVar7 = FUN_00439240(param_1);
    if ((char)uVar7 != '\0') {
      *(undefined1 *)(param_1 + 0xaa) = 0;
      *(undefined1 *)(param_1 + 0xa8) = 0x17;
      *(byte *)(param_1 + 0x76) = *(byte *)(param_1 + 0x76) | 0x10;
      return uVar7 & 0xffffff00;
    }
    break;
  case 0x17:
    *(undefined1 *)(param_1 + 0xaa) = 0;
    if ((*(byte *)(param_1 + 0x76) & 0x10) != 0) {
      puVar4 = unit_land_array[*(ushort *)(param_1 + 0x89)];
      FUN_004ba130(puVar4,&local_10);
      uVar8 = game_state.pseudo_random_val * 0x24a1 + 0x24df;
      uVar7 = uVar8 >> 0xd;
      game_state.pseudo_random_val = uVar7 | uVar8 * 0x80000;
      sVar3._0_1_ = puVar4->num_points;
      sVar3._1_1_ = puVar4->tex_size_type;
      uVar8 = (uint)*(ushort *)&unit_type_array_building[(byte)puVar4->field_0x9e].pos_related;
      if (sVar3 == 0) {
        uVar8 = (int)uVar8 >> 1;
      }
      local_c = game_state.pseudo_random_val;
      move_pos_angle_length(&local_10,uVar7 & 0x7ff,uVar8);
      FUN_004e9dd0(param_1,&local_10);
      uVar7 = (uint)(ushort)(local_10 - *(short *)(param_1 + 0x3d));
      uVar8 = (uint)(ushort)(local_e - *(short *)(param_1 + 0x3f));
      if (0x7fff < uVar7) {
        uVar7 = uVar7 - 0x10000;
      }
      if (0x7fff < uVar8) {
        uVar8 = uVar8 - 0x10000;
      }
      uVar6 = calc_angle_quadrant(uVar7,-uVar8);
      uVar6 = uVar6 & 0x7ff;
      if ((*(uint *)(param_1 + 0xc) & 0x80) != 0) {
        *(ushort *)(param_1 + 0x57) = uVar6;
      }
      *(ushort *)(param_1 + 0x5d) = uVar6;
      if ((*(uint *)(param_1 + 0xc) & 0x8000) != 0) {
        uVar6 = uVar6 + 0x400 & 0x7ff;
      }
      *(ushort *)(param_1 + 0x26) = uVar6;
    }
    uVar7 = FUN_00439480(param_1);
    if ((char)uVar7 != '\0') {
      *(undefined1 *)(param_1 + 0xa8) = 4;
      *(byte *)(param_1 + 0x76) = *(byte *)(param_1 + 0x76) | 0x10;
      return uVar7 & 0xffffff00;
    }
    break;
  case 0x36:
    uVar7 = FUN_00438ca0(param_1,0x400);
    if ((char)uVar7 != '\0') {
      *(undefined1 *)(param_1 + 0xa8) = 1;
      *(byte *)(param_1 + 0x76) = *(byte *)(param_1 + 0x76) | 0x10;
    }
  }
  return uVar7 & 0xffffff00;
}
