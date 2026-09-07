/* Ghidra 12.1.3 pseudocode; entry 00434610; FUN_00434610.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


/* WARNING: Removing unreachable block (ram,0x00434c22) */
/* WARNING: Removing unreachable block (ram,0x00434f00) */
/* WARNING: Removing unreachable block (ram,0x00434f0a) */
/* WARNING: Removing unreachable block (ram,0x00434c2c) */

undefined1 FUN_00434610(unit_struct *param_1)

{
  byte *pbVar1;
  byte bVar2;
  undefined2 uVar3;
  bool bVar4;
  bool bVar5;
  bool bVar6;
  char cVar7;
  ushort uVar8;
  short sVar9;
  int iVar10;
  unit_struct *puVar11;
  unit_struct *puVar12;
  uint uVar13;
  uint uVar14;
  unit_struct *puVar15;
  bool bVar16;
  undefined1 local_5;
  short local_4;
  short local_2;

  puVar12 = (unit_struct *)0x0;
  local_5 = 0;
  bVar4 = false;
  bVar6 = false;
  param_1->obj_index_anim_prev_2 = param_1->obj_index_anim_prev_2 & 0xfff7;
  if (param_1->state_2 == '\0') {
    uVar8 = param_1->coord_scale_2;
    uVar14 = (uint)(short)uVar8;
    if ((*(byte *)((int)&param_1->flags_4 + 1) & 8) != 0) {
      if (((uVar8 != 0) && (puVar11 = unit_land_array[uVar8], (*(byte *)&puVar11->flags_2 & 1) == 0)
          ) && (puVar11->unit_class != '\0')) {
        puVar12 = puVar11;
      }
      if ((puVar12 != (unit_struct *)0x0) &&
         ((unit_type_array_building[(byte)puVar12->unit_type].field_0x48 & 1) == 0)) {
        uVar14 = 0;
      }
    }
    if ((((*(byte *)((int)&param_1->flags_2 + 2) & 0x80) != 0) &&
        (iVar10 = get_adjacent_unit(param_1,0), iVar10 != 0)) &&
       ((uint)*(ushort *)(iVar10 + 0x24) == (int)param_1->coord_scale_2)) {
      uVar14 = 0;
    }
    if (uVar14 != 0) {
      puVar12 = (unit_struct *)0x0;
      if ((((short)uVar14 != 0) &&
          (puVar11 = unit_land_array[uVar14 & 0xffff], (*(byte *)&puVar11->flags_2 & 1) == 0)) &&
         (puVar11->unit_class != '\0')) {
        puVar12 = puVar11;
      }
      if (((puVar12 != (unit_struct *)0x0) &&
          ((unit_type_array_building[(byte)puVar12->unit_type].field_0x48 & 0x40) != 0)) &&
         ((DAT_005a7e48 & 1 << (param_1->unit_type & 0x1f)) == 0)) {
        uVar14 = 0;
      }
    }
  }
  else {
    uVar14 = (uint)*(ushort *)((int)&param_1->loc_3_y + 1);
  }
  puVar12 = (unit_struct *)0x0;
  if ((((short)uVar14 != 0) &&
      (puVar11 = unit_land_array[uVar14 & 0xffff], (*(byte *)&puVar11->flags_2 & 1) == 0)) &&
     (puVar11->unit_class != '\0')) {
    puVar12 = puVar11;
  }
  if ((puVar12 == (unit_struct *)0x0) || (uVar8 = *(ushort *)&puVar12->field_0x9c, (uVar8 & 8) == 0)
     ) {
LAB_0043511f:
    local_5 = 1;
  }
  else {
    bVar2 = puVar12->unit_type;
    bVar16 = (*(uint *)&unit_type_array_building[bVar2].field_0x48 & 0x800) == 0;
    if ((uVar8 & 0x2000) != 0) {
      bVar4 = true;
      *(ushort *)&puVar12->field_0x9c = uVar8 & 0xdfff;
      iVar10 = FUN_00409c50(puVar12,puVar12->field_0xac);
      if (iVar10 != 0) {
        *(undefined1 *)(iVar10 + 0xa9) = 2;
      }
    }
    if (param_1->state_2 == '\0') {
      *(short *)((int)&param_1->loc_3_y + 1) = param_1->coord_scale_2;
      bVar5 = false;
      param_1->coord_scale_3 = 0;
      param_1->coord_scale_1 = 1;
      param_1->state_2 = 1;
      if ((unit_type_array_building[bVar2].field_0x48 & 1) != 0) {
        pbVar1 = (byte *)((int)&param_1->obj_index_anim_prev_2 + 1);
        *pbVar1 = *pbVar1 | 8;
      }
      if ((*(byte *)&param_1->flags_3 & 0x20) == 0) {
        if (!bVar16) {
          bVar4 = true;
        }
        puVar11 = (unit_struct *)get_adjacent_unit(param_1,0);
        if ((puVar11 == puVar12) &&
           ((bVar16 ||
            (((puVar12->field81_0xa2 == 0 &&
              ((int)(char)puVar12->hut_people_inside <
               (int)(uint)(byte)unit_type_array_building[(byte)puVar12->unit_type].field31_0x20)) &&
             ((int)(char)puVar12->field_0xad <
              (int)(uint)(byte)unit_type_array_building[(byte)puVar12->unit_type].field31_0x20))))))
        {
          bVar5 = true;
        }
        if (bVar5) {
          param_1->state_2 = 4;
        }
        else {
          FUN_004044b0(puVar12,&local_4);
          FUN_004e9d80(param_1,&local_4);
          FUN_004d4f40(param_1);
        }
      }
      else {
        cVar7 = '\0';
        bVar5 = false;
        puVar11 = (unit_struct *)0x0;
        param_1->field_0xaa = 0;
        param_1->state_2 = 3;
        if (((puVar12->field81_0xa2 != 0) &&
            (puVar15 = unit_land_array[(ushort)puVar12->field81_0xa2],
            (*(byte *)&puVar15->flags_2 & 1) == 0)) && (puVar15->unit_class != '\0')) {
          puVar11 = puVar15;
        }
        while (puVar11 != (unit_struct *)0x0) {
          if (puVar11 == param_1) {
            bVar5 = true;
            break;
          }
          uVar8 = *(ushort *)((int)&puVar11->loc_2_z + 1);
          cVar7 = cVar7 + '\x01';
          puVar11 = (unit_struct *)0x0;
          if (((uVar8 != 0) &&
              (puVar15 = unit_land_array[uVar8], (*(byte *)&puVar15->flags_2 & 1) == 0)) &&
             (puVar15->unit_class != '\0')) {
            puVar11 = puVar15;
          }
        }
        if (bVar5) {
          param_1->field_0xaa = cVar7;
          uVar14 = (int)(short)(param_1->vec3).x - (int)(short)(param_1->pos).x;
          uVar13 = (int)uVar14 >> 0x1f;
          if ((0xb < (int)((uVar14 ^ uVar13) - uVar13)) ||
             (uVar14 = (int)(short)(param_1->vec3).y - (int)(short)(param_1->pos).y,
             uVar13 = (int)uVar14 >> 0x1f, bVar5 = true, 0xb < (int)((uVar14 ^ uVar13) - uVar13))) {
            bVar5 = false;
          }
          if (bVar5) {
            FUN_004d4ee0(param_1);
          }
        }
        else {
          param_1->field_0xa9 = 1;
        }
        FUN_00409710(puVar12,(int)(char)param_1->field_0xaa,&local_4);
        FUN_004e9d80(param_1,&local_4);
      }
    }
    cVar7 = param_1->state_2;
    switch(cVar7) {
    case '\x01':
      *(byte *)&param_1->obj_index_anim_prev_2 = (byte)param_1->obj_index_anim_prev_2 | 8;
      if ((bVar4) && (iVar10 = FUN_00409c50(puVar12,0xffffffff), iVar10 != 0)) {
        FUN_00409710(puVar12,(int)*(char *)(iVar10 + 0xaa),&local_4);
        FUN_004e9d80(param_1,&local_4);
      }
      if ((param_1->class_counter & 1) == 0) {
        bVar4 = true;
        if ((((!bVar16) &&
             (uVar14 = (int)(short)(param_1->vec3).x - (int)(short)(param_1->pos).x,
             uVar13 = (int)uVar14 >> 0x1f, (int)((uVar14 ^ uVar13) - uVar13) < 0x538)) &&
            (uVar14 = (int)(short)(param_1->vec3).y - (int)(short)(param_1->pos).y,
            uVar13 = (int)uVar14 >> 0x1f, (int)((uVar14 ^ uVar13) - uVar13) < 0x538)) &&
           (((puVar12->field81_0xa2 != 0 ||
             ((int)(uint)(byte)unit_type_array_building[(byte)puVar12->unit_type].field31_0x20 <=
              (int)(char)puVar12->hut_people_inside)) ||
            ((int)(uint)(byte)unit_type_array_building[(byte)puVar12->unit_type].field31_0x20 <=
             (int)(char)puVar12->field_0xad)))) {
          param_1->state_2 = 2;
          bVar4 = false;
        }
        if (bVar4) {
          uVar14 = (int)(short)(param_1->vec3).x - (int)(short)(param_1->pos).x;
          uVar13 = (int)uVar14 >> 0x1f;
          if ((0x6f < (int)((uVar14 ^ uVar13) - uVar13)) ||
             (uVar14 = (int)(short)(param_1->vec3).y - (int)(short)(param_1->pos).y,
             uVar13 = (int)uVar14 >> 0x1f, bVar4 = true, 0x6f < (int)((uVar14 ^ uVar13) - uVar13)))
          {
            bVar4 = false;
          }
          if (bVar4) {
            param_1->state_2 = 4;
            FUN_004d58c0(param_1,0);
          }
        }
      }
      break;
    case '\x02':
      param_1->state_2 = cVar7 + '\x01';
      param_1->field_0xa9 = 0;
      param_1->field_0xaa = 0;
      iVar10 = FUN_00409c50(puVar12,0xffffffff);
      if (iVar10 != 0) {
        param_1->field_0xaa = *(char *)(iVar10 + 0xaa) + '\x01';
      }
      FUN_00409b10(param_1,puVar12);
      FUN_00409710(puVar12,(int)(char)param_1->field_0xaa,&local_4);
      FUN_004e9d80(param_1,&local_4);
      FUN_004d4f40(param_1);
    case '\x03':
      bVar4 = false;
      param_1->flags_2 = param_1->flags_2 | 0x200000;
      if (((((int)(char)puVar12->hut_people_inside <
             (int)(uint)(byte)unit_type_array_building[bVar2].field31_0x20) &&
           (puVar12->field_0xab == '\0')) &&
          ((uint)(ushort)param_1->unit_index == (int)(short)puVar12->field81_0xa2)) &&
         (param_1->field36_0x5f == 0)) {
        bVar4 = true;
      }
      if (bVar4) {
        param_1->state_2 = 6;
        puVar12->field_0xab = 0x10;
      }
      else {
        if ((param_1->field_0xa9 != '\0') &&
           (cVar7 = param_1->field_0xa9 + -1, param_1->field_0xa9 = cVar7, cVar7 == '\0')) {
          uVar8 = *(ushort *)((int)&param_1->loc_2_z + 1);
          puVar11 = (unit_struct *)0x0;
          if ((uVar8 != 0) &&
             ((puVar15 = unit_land_array[uVar8], (*(byte *)&puVar15->flags_2 & 1) == 0 &&
              (puVar15->unit_class != '\0')))) {
            puVar11 = puVar15;
          }
          if (puVar11 != (unit_struct *)0x0) {
            puVar11->field_0xa9 = 2;
          }
          param_1->field_0xaa = 0;
          iVar10 = FUN_00409bd0(param_1,puVar12);
          if (iVar10 != 0) {
            param_1->field_0xaa = *(char *)(iVar10 + 0xaa) + '\x01';
          }
          FUN_00409710(puVar12,(int)(char)param_1->field_0xaa,&local_4);
          FUN_004e9d80(param_1,&local_4);
          FUN_004d4f40(param_1);
        }
        uVar14 = (int)(short)(param_1->vec3).x - (int)(short)(param_1->pos).x;
        uVar13 = (int)uVar14 >> 0x1f;
        if (((int)((uVar14 ^ uVar13) - uVar13) < 0xc) &&
           (uVar14 = (int)(short)(param_1->vec3).y - (int)(short)(param_1->pos).y,
           uVar13 = (int)uVar14 >> 0x1f, (int)((uVar14 ^ uVar13) - uVar13) < 0xc)) {
          bVar4 = true;
        }
        else {
          bVar4 = false;
        }
        if (bVar4) {
          if (param_1->field36_0x5f != 0) {
            FUN_004d4ee0(param_1);
            if (param_1->field_0xaa == '\0') {
              get_building_coords(puVar12,&local_4);
            }
            else {
              FUN_00409710(puVar12,(char)param_1->field_0xaa + -1);
            }
            uVar14 = (uint)(ushort)(local_4 - (param_1->pos).x);
            uVar13 = (uint)(ushort)(local_2 - (param_1->pos).y);
            if (0x7fff < uVar14) {
              uVar14 = uVar14 - 0x10000;
            }
            if (0x7fff < uVar13) {
              uVar13 = uVar13 - 0x10000;
            }
            uVar8 = calc_angle_quadrant(uVar14,-uVar13);
            uVar8 = uVar8 & 0x7ff;
            if ((param_1->flags_2 & 0x80) != 0) {
              param_1->pos_x1 = uVar8;
            }
            *(ushort *)&param_1->field_0x5d = uVar8;
            if ((param_1->flags_2 & 0x8000) == 0) {
              param_1->maybe_shape_angle = uVar8;
            }
            else {
              param_1->maybe_shape_angle = uVar8 + 0x400 & 0x7ff;
            }
            update_gs_unit_related_array_item(param_1);
            param_1->pos_x1 = uVar8;
            uVar14 = param_1->flags_2;
            param_1->flags_2 = uVar14 | 0x80;
            param_1->flags_2 = uVar14 | 0x1080;
          }
          if (((((param_1->class_counter & 0xf) == 0) && (param_1->field_0xa9 == '\0')) &&
              (param_1->unit_type == unit_type_array_building[(byte)puVar12->unit_type].unit_type1))
             && (uVar8 = *(ushort *)((int)&param_1->loc_2_z + 1), uVar8 != 0)) {
            puVar11 = unit_land_array[uVar8];
            puVar15 = (unit_struct *)0x0;
            if (((*(byte *)&puVar11->flags_2 & 1) == 0) && (puVar11->unit_class != '\0')) {
              puVar15 = puVar11;
            }
            if ((puVar15 != (unit_struct *)0x0) &&
               (puVar15->unit_type != unit_type_array_building[(byte)puVar12->unit_type].unit_type1)
               ) {
              iVar10 = FUN_00409bd0(param_1,puVar12);
              if (iVar10 == 0) {
                puVar12->field81_0xa2 = *(undefined2 *)((int)&param_1->loc_2_z + 1);
              }
              else {
                *(undefined2 *)(iVar10 + 0x85) = *(undefined2 *)((int)&param_1->loc_2_z + 1);
              }
              uVar3 = param_1->unit_index;
              *(undefined2 *)((int)&param_1->loc_2_z + 1) =
                   *(undefined2 *)((int)&puVar15->loc_2_z + 1);
              *(undefined2 *)((int)&puVar15->loc_2_z + 1) = uVar3;
              FUN_00409710(puVar12,(int)(char)puVar15->field_0xaa,&local_4);
              FUN_004e9d80(param_1,&local_4);
              FUN_004d4f40(param_1);
              FUN_00409710(puVar12,(int)(char)param_1->field_0xaa,&local_4);
              FUN_004e9d80(puVar15,&local_4);
              FUN_004d4f40(puVar15);
              param_1->field_0xa9 = 1;
              puVar15->field_0xa9 = 1;
            }
          }
        }
        else if (param_1->field36_0x5f == 0) {
          FUN_004d4f40(param_1);
          param_1->coord_scale_3 = 0;
          param_1->coord_scale_1 = 1;
        }
        else {
          sVar9 = *(short *)&param_1->coord_scale_3 + -1;
          *(short *)&param_1->coord_scale_3 = sVar9;
          if (sVar9 < 1) {
            param_1->state_2 = 0;
          }
        }
        if ((param_1->flags_2 & 0x2004) != 0) {
          param_1->state_2 = 2;
        }
      }
      if (param_1->state_2 != '\x03') {
        FUN_00409580(puVar12);
      }
      break;
    case '\x04':
    case '\x05':
      if ((int)(char)puVar12->hut_people_inside <
          (int)(uint)(byte)unit_type_array_building[bVar2].field31_0x20) {
        if (cVar7 == '\x04') {
          param_1->state_2 = 5;
          FUN_004d4f40(param_1);
          get_building_coords(puVar12,&local_4);
          uVar14 = (uint)(ushort)(local_4 - (param_1->pos).x);
          uVar13 = (uint)(ushort)(local_2 - (param_1->pos).y);
          if (0x7fff < uVar14) {
            uVar14 = uVar14 - 0x10000;
          }
          if (0x7fff < uVar13) {
            uVar13 = uVar13 - 0x10000;
          }
          uVar8 = calc_angle_quadrant(uVar14,-uVar13);
          uVar8 = uVar8 & 0x7ff;
          if ((param_1->flags_2 & 0x80) != 0) {
            param_1->pos_x1 = uVar8;
          }
          *(ushort *)&param_1->field_0x5d = uVar8;
          if ((param_1->flags_2 & 0x8000) != 0) {
            uVar8 = uVar8 + 0x400 & 0x7ff;
          }
          param_1->maybe_shape_angle = uVar8;
          uVar14 = param_1->flags_4 & 0xfffefff8;
          param_1->flags_4 = uVar14;
          param_1->flags_4 = uVar14 | 2;
          FUN_004e9dd0(param_1,&local_4);
          if ((int)(char)puVar12->field_0xad <
              (int)(uint)(byte)unit_type_array_building[bVar2].field31_0x20) {
            if ((*(byte *)&puVar12->flags_3 & 0x40) == 0) {
              puVar12->field_0xae = 0x10;
              if ((char)puVar12->field_0xad < 'x') {
                puVar12->field_0xad = puVar12->field_0xad + '\x01';
              }
              if ((int)(uint)(byte)unit_type_array_building[(byte)puVar12->unit_type].field31_0x20 <
                  (int)(char)puVar12->field_0xad) {
                puVar12->flags_3 = puVar12->flags_3 | 0x40;
              }
            }
          }
          else {
            bVar6 = true;
          }
        }
        if (!bVar6) {
          if ((param_1->class_counter & 1) == 0) {
            uVar14 = (int)(short)(param_1->vec3).x - (int)(short)(param_1->pos).x;
            uVar13 = (int)uVar14 >> 0x1f;
            if ((0x6f < (int)((uVar14 ^ uVar13) - uVar13)) ||
               (uVar14 = (int)(short)(param_1->vec3).y - (int)(short)(param_1->pos).y,
               uVar13 = (int)uVar14 >> 0x1f, bVar4 = true, 0x6f < (int)((uVar14 ^ uVar13) - uVar13))
               ) {
              bVar4 = false;
            }
            if (bVar4) {
              FUN_00407150(param_1,puVar12);
              uVar14 = *(uint *)&unit_type_array_building[bVar2].field_0x48 & 0x40;
              if ((uVar14 == 0) && ((*(uint *)&unit_type_array_building[bVar2].field_0x48 & 1) == 0)
                 ) {
                local_5 = 1;
                *(byte *)&param_1->loc_1_x = *(byte *)&param_1->loc_1_x & 0xfe;
              }
              else if (uVar14 == 0) {
                param_1->state_2 = 0xc;
              }
              else {
                param_1->state_2 = 10;
              }
            }
          }
          goto LAB_00434d6b;
        }
      }
      else {
        bVar6 = true;
LAB_00434d6b:
        if (!bVar6) {
          return local_5;
        }
      }
      if (!bVar16) {
        param_1->state_2 = 8;
        return local_5;
      }
      goto LAB_0043511f;
    case '\x06':
      param_1->state_2 = cVar7 + '\x01';
      FUN_004d4f40(param_1);
      FUN_004044b0(puVar12,&local_4);
      FUN_004e9d80(param_1,&local_4);
    case '\a':
      if ((param_1->class_counter & 1) == 0) {
        uVar14 = (int)(short)(param_1->vec3).x - (int)(short)(param_1->pos).x;
        uVar13 = (int)uVar14 >> 0x1f;
        if (((int)((uVar14 ^ uVar13) - uVar13) < 0x70) &&
           (uVar14 = (int)(short)(param_1->vec3).y - (int)(short)(param_1->pos).y,
           uVar13 = (int)uVar14 >> 0x1f, (int)((uVar14 ^ uVar13) - uVar13) < 0x70)) {
          bVar4 = true;
        }
        else {
          bVar4 = false;
        }
        if (bVar4) {
          param_1->state_2 = 4;
          FUN_004d58c0(param_1,0);
        }
      }
      break;
    case '\b':
      param_1->flags_4 = param_1->flags_4 & 0xfffefff8;
      param_1->state_2 = cVar7 + '\x01';
      FUN_004d4f40(param_1);
      FUN_004044b0(puVar12,&local_4);
      FUN_004e9d80(param_1,&local_4);
    case '\t':
      if ((param_1->class_counter & 1) == 0) {
        uVar14 = (int)(short)(param_1->vec3).x - (int)(short)(param_1->pos).x;
        uVar13 = (int)uVar14 >> 0x1f;
        if (((int)((uVar14 ^ uVar13) - uVar13) < 0x70) &&
           (uVar14 = (int)(short)(param_1->vec3).y - (int)(short)(param_1->pos).y,
           uVar13 = (int)uVar14 >> 0x1f, (int)((uVar14 ^ uVar13) - uVar13) < 0x70)) {
          bVar4 = true;
        }
        else {
          bVar4 = false;
        }
        if (bVar4) {
          param_1->state_2 = 0;
        }
      }
      break;
    case '\n':
      param_1->field_0xa9 = 0;
      pbVar1 = (byte *)((int)&param_1->obj_index_anim_prev_2 + 1);
      *pbVar1 = *pbVar1 | 1;
      param_1->state_2 = cVar7 + '\x01';
    case '\v':
      local_5 = FUN_004da5b0(param_1);
      break;
    case '\f':
      param_1->state_2 = cVar7 + '\x01';
      FUN_004d4ee0(param_1);
    }
  }
  return local_5;
}
