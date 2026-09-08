/* Ghidra 12.1.3 pseudocode; entry 00497a30; FUN_00497a30.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


/* WARNING: Removing unreachable block (ram,0x00497eb8) */
/* WARNING: Removing unreachable block (ram,0x00497ec2) */
/* WARNING: Type propagation algorithm not settling */

undefined1 FUN_00497a30(int param_1,undefined1 *param_2)

{
  unit_struct *puVar1;
  char cVar2;
  bool bVar3;
  short sVar4;
  uint uVar5;
  uint uVar6;
  undefined1 uVar7;
  unit_struct *puVar8;
  ushort uVar9;
  int iVar10;
  unit_struct *puVar11;
  undefined2 local_e;
  undefined4 local_c;
  uint local_8;
  uint local_4;

  bVar3 = false;
  *(uint *)(param_1 + 0x10) = *(uint *)(param_1 + 0x10) & 0xfffefff8;
  if (*(char *)(param_1 + 0x2d) == '\0') {
    *(undefined2 *)(param_1 + 0x89) = 0;
    puVar11 = unit_land_array[*(ushort *)(param_2 + 6)];
    cVar2 = FUN_00436b90(param_1,*param_2);
    if (((cVar2 == '\0') || (puVar11->unit_class != '\x02')) ||
       (*(char *)(param_1 + 0x2f) != puVar11->tribe_index)) {
      bVar3 = true;
    }
    else {
      *(undefined2 *)(param_1 + 0x89) = *(undefined2 *)(param_2 + 6);
      FUN_004044b0(puVar11,&local_c);
      *(undefined4 *)(param_1 + 0x68) = local_c;
      *(ushort *)(param_1 + 0x68) = ((ushort)local_c & 0xfe00) + 0x100;
      uVar7 = 1;
      *(ushort *)(param_1 + 0x6a) = (*(ushort *)(param_1 + 0x6a) & 0xfe00) + 0x100;
      *(byte *)(param_1 + 0x82) = *(byte *)(param_1 + 0x82) & 0xf0;
      *(undefined1 *)(param_1 + 0x82) = 0;
      local_e = CONCAT11((char)((ushort)*(undefined2 *)(param_1 + 0x3f) >> 8),
                         (char)((ushort)*(undefined2 *)(param_1 + 0x3d) >> 8));
      uVar5 = (local_e & 0xfe) * 2 | local_e & 0xfe00;
      if ((((*(byte *)((int)&game_state.level_data[0].flags + uVar5 * 4 + 1) & 2) != 0) &&
          (((&game_state.level_data[0].unit_index_2)[uVar5 * 2] & 0x3ff) == *(ushort *)(param_2 + 6)
          )) && (*(short *)(param_1 + 0x78) == 0)) {
        uVar7 = 2;
      }
      *(uint *)(param_1 + 0xc) = *(uint *)(param_1 + 0xc) | 0x40000000;
      *(undefined1 *)(param_1 + 0x2d) = uVar7;
    }
  }
  if (!bVar3) {
    puVar11 = (unit_struct *)0x0;
    if (((*(ushort *)(param_1 + 0x89) != 0) &&
        (puVar8 = unit_land_array[*(ushort *)(param_1 + 0x89)], (*(byte *)&puVar8->flags_2 & 1) == 0
        )) && (puVar8->unit_class != '\0')) {
      puVar11 = puVar8;
    }
    if (puVar11 != (unit_struct *)0x0) {
      switch(*(byte *)(param_1 + 0x2d) - 1) {
      case 0:
        uVar5 = *(uint *)(param_1 + 0x10) & 0xfffefff8;
        *(uint *)(param_1 + 0x10) = uVar5;
        *(uint *)(param_1 + 0x10) = uVar5 | 4;
        if ((*(uint *)(param_1 + 0xc) & 0x40000000) != 0) {
          *(uint *)(param_1 + 0xc) = *(uint *)(param_1 + 0xc) & 0xbfffffff;
          FUN_004d4f40(param_1);
          FUN_004044b0(puVar11,&local_c);
          FUN_004e9d80(param_1,&local_c);
        }
        if ((*(byte *)(param_1 + 0x2e) & 1) != 0) {
          return 0;
        }
        uVar5 = (int)*(short *)(param_1 + 0x4f) - (int)*(short *)(param_1 + 0x3d);
        uVar6 = (int)uVar5 >> 0x1f;
        if ((0x6f < (int)((uVar5 ^ uVar6) - uVar6)) ||
           (uVar5 = (int)*(short *)(param_1 + 0x51) - (int)*(short *)(param_1 + 0x3f),
           uVar6 = (int)uVar5 >> 0x1f, bVar3 = true, 0x6f < (int)((uVar5 ^ uVar6) - uVar6))) {
          bVar3 = false;
        }
        if (!bVar3) {
          return 0;
        }
        FUN_004d58c0(param_1,0);
        *(undefined1 *)(param_1 + 0x2d) = 2;
        *(uint *)(param_1 + 0xc) = *(uint *)(param_1 + 0xc) | 0x40000000;
        return 0;
      case 1:
        goto switchD_00497b9e_caseD_1;
      case 2:
        if ((*(uint *)(param_1 + 0xc) & 0x40000000) != 0) {
          *(uint *)(param_1 + 0xc) = *(uint *)(param_1 + 0xc) & 0xbfffffff;
          FUN_004d50d0(param_1);
          uVar6 = game_state.pseudo_random_val * 0x24a1 + 0x24df;
          uVar5 = uVar6 >> 0xd;
          local_4 = uVar5 | uVar6 * 0x80000;
          game_state.pseudo_random_val = local_4;
          *(ushort *)(param_1 + 0x70) = ((ushort)uVar5 & 0x1f) + 0x20;
        }
        sVar4 = *(short *)(param_1 + 0x70) + -1;
        *(short *)(param_1 + 0x70) = sVar4;
        if (0 < sVar4) {
          return 0;
        }
        bVar3 = true;
        puVar8 = (unit_struct *)0x0;
        if (((puVar11->loc_2_y != 0) &&
            (puVar1 = unit_land_array[(ushort)puVar11->loc_2_y],
            (*(byte *)&puVar1->flags_2 & 1) == 0)) && (puVar1->unit_class != '\0')) {
          puVar8 = puVar1;
        }
        if ((puVar8 != (unit_struct *)0x0) && (1 < (ushort)puVar8->facs0_index)) {
          bVar3 = false;
        }
        puVar8 = (unit_struct *)0x0;
        if (bVar3) {
          bVar3 = false;
          if (*(short *)(param_1 + 0x78) <
              (short)unit_type_array_person[*(byte *)(param_1 + 0x2b)].wood) {
            FUN_00498140(puVar11);
            if (((puVar11->loc_2_y != 0) &&
                (puVar1 = unit_land_array[(ushort)puVar11->loc_2_y],
                (*(byte *)&puVar1->flags_2 & 1) == 0)) && (puVar1->unit_class != '\0')) {
              puVar8 = puVar1;
            }
            if ((puVar8 != (unit_struct *)0x0) &&
               (FUN_004a7860(puVar8,param_1,
                             (int)(short)unit_type_array_person[*(byte *)(param_1 + 0x2b)].wood),
               *(short *)&puVar8->field_0x96 < 1)) {
              bVar3 = true;
              FUN_004ef180(puVar8);
              FUN_004ef180(puVar11);
            }
          }
          cVar2 = (-!bVar3 & 0xfdU) + 4;
        }
        else {
          cVar2 = '\x02';
        }
        *(uint *)(param_1 + 0xc) = *(uint *)(param_1 + 0xc) | 0x40000000;
        *(char *)(param_1 + 0x2d) = cVar2;
        return 0;
      case 3:
        uVar5 = *(uint *)(param_1 + 0x10) & 0xfffefff8;
        *(uint *)(param_1 + 0x10) = uVar5;
        *(uint *)(param_1 + 0x10) = uVar5 | 4;
        if ((*(uint *)(param_1 + 0xc) & 0x40000000) != 0) {
          *(uint *)(param_1 + 0xc) = *(uint *)(param_1 + 0xc) & 0xbfffffff;
          FUN_004d4f40(param_1);
          FUN_004044b0(puVar11,&local_c);
          FUN_004e9dd0(param_1,&local_c);
          uVar5 = (uint)(ushort)((short)local_c - *(short *)(param_1 + 0x3d));
          uVar6 = (uint)(ushort)(local_c._2_2_ - *(short *)(param_1 + 0x3f));
          if (0x7fff < uVar5) {
            uVar5 = uVar5 - 0x10000;
          }
          if (0x7fff < uVar6) {
            uVar6 = uVar6 - 0x10000;
          }
          uVar9 = calc_angle_quadrant(uVar5,-uVar6);
          uVar9 = uVar9 & 0x7ff;
          if ((*(uint *)(param_1 + 0xc) & 0x80) != 0) {
            *(ushort *)(param_1 + 0x57) = uVar9;
          }
          *(ushort *)(param_1 + 0x5d) = uVar9;
          if ((*(uint *)(param_1 + 0xc) & 0x8000) != 0) {
            uVar9 = uVar9 + 0x400 & 0x7ff;
          }
          *(ushort *)(param_1 + 0x26) = uVar9;
        }
        if ((*(byte *)(param_1 + 0x2e) & 1) != 0) {
          return 0;
        }
        cVar2 = FUN_00432da0(param_1 + 0x3d,0x38,param_1 + 0x4f,0x38);
        if (cVar2 == '\0') {
          return 0;
        }
        return 1;
      case 4:
        uVar5 = *(uint *)(param_1 + 0x10) & 0xfffefff8;
        *(uint *)(param_1 + 0x10) = uVar5;
        *(uint *)(param_1 + 0x10) = uVar5 | 4;
        if ((*(uint *)(param_1 + 0xc) & 0x40000000) != 0) {
          *(uint *)(param_1 + 0xc) = *(uint *)(param_1 + 0xc) & 0xbfffffff;
          iVar10 = (int)(char)puVar11->hut_people_inside;
          if (0 < iVar10) {
            do {
              remove_person_from_hut(puVar11,0);
              iVar10 = iVar10 + -1;
            } while (iVar10 != 0);
          }
          get_building_coords(puVar11,&local_c);
          uVar6 = game_state.pseudo_random_val * 0x24a1 + 0x24df;
          uVar5 = uVar6 >> 0xd;
          game_state.pseudo_random_val = uVar5 | uVar6 * 0x80000;
          uVar5 = uVar5 & 0x7ff;
          local_8 = game_state.pseudo_random_val;
          move_pos_angle_length
                    (&local_c,uVar5,
                     *(undefined2 *)&unit_type_array_building[(byte)puVar11->unit_type].pos_related)
          ;
          FUN_004e9dd0(param_1,&local_c);
          FUN_004d4f40(param_1);
          uVar9 = (ushort)uVar5;
          if ((*(uint *)(param_1 + 0xc) & 0x80) != 0) {
            *(ushort *)(param_1 + 0x57) = uVar9;
          }
          *(ushort *)(param_1 + 0x5d) = uVar9;
          if ((*(uint *)(param_1 + 0xc) & 0x8000) != 0) {
            uVar9 = uVar9 + 0x400 & 0x7ff;
          }
          *(ushort *)(param_1 + 0x26) = uVar9;
        }
        if ((*(byte *)(param_1 + 0x2e) & 1) != 0) {
          return 0;
        }
        uVar5 = (int)*(short *)(param_1 + 0x4f) - (int)*(short *)(param_1 + 0x3d);
        uVar6 = (int)uVar5 >> 0x1f;
        if ((0x6f < (int)((uVar5 ^ uVar6) - uVar6)) ||
           (uVar5 = (int)*(short *)(param_1 + 0x51) - (int)*(short *)(param_1 + 0x3f),
           uVar6 = (int)uVar5 >> 0x1f, bVar3 = true, 0x6f < (int)((uVar5 ^ uVar6) - uVar6))) {
          bVar3 = false;
        }
        if (!bVar3) {
          return 0;
        }
        *(undefined1 *)(param_1 + 0x2d) = 3;
        *(uint *)(param_1 + 0xc) = *(uint *)(param_1 + 0xc) | 0x40000000;
        return 0;
      default:
        return 0;
      }
    }
  }
  return 1;
switchD_00497b9e_caseD_1:
  uVar5 = *(uint *)(param_1 + 0x10) & 0xfffefff8;
  *(uint *)(param_1 + 0x10) = uVar5;
  *(uint *)(param_1 + 0x10) = uVar5 | 4;
  if ((*(uint *)(param_1 + 0xc) & 0x40000000) != 0) {
    *(uint *)(param_1 + 0xc) = *(uint *)(param_1 + 0xc) & 0xbfffffff;
    FUN_004d4f40(param_1);
    get_building_coords(puVar11,&local_c);
    FUN_004e9dd0(param_1,&local_c);
  }
  if ((*(byte *)(param_1 + 0x2e) & 1) != 0) {
    return 0;
  }
  uVar5 = (int)*(short *)(param_1 + 0x4f) - (int)*(short *)(param_1 + 0x3d);
  uVar6 = (int)uVar5 >> 0x1f;
  if ((0x237 < (int)((uVar5 ^ uVar6) - uVar6)) ||
     (uVar5 = (int)*(short *)(param_1 + 0x51) - (int)*(short *)(param_1 + 0x3f),
     uVar6 = (int)uVar5 >> 0x1f, bVar3 = true, 0x237 < (int)((uVar5 ^ uVar6) - uVar6))) {
    bVar3 = false;
  }
  if (!bVar3) {
    return 0;
  }
  *(undefined1 *)(param_1 + 0x2d) = 5;
  *(uint *)(param_1 + 0xc) = *(uint *)(param_1 + 0xc) | 0x40000000;
  return 0;
}
