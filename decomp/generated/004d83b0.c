/* Ghidra 12.1.3 pseudocode; entry 004d83b0; FUN_004d83b0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


/* WARNING: Removing unreachable block (ram,0x004d8af0) */
/* WARNING: Removing unreachable block (ram,0x004d8afa) */

undefined1 FUN_004d83b0(int param_1)

{
  short *psVar1;
  byte bVar2;
  unit_struct *puVar3;
  undefined4 uVar4;
  unit_related_struct_20B *puVar5;
  bool bVar6;
  char cVar7;
  char cVar8;
  short sVar9;
  ushort uVar10;
  uint uVar11;
  int iVar12;
  uint uVar13;
  int iVar14;
  char *pcVar15;
  unit_struct *puVar16;
  undefined2 local_32;
  ushort local_30;
  short sStack_2e;
  undefined2 local_2c;
  undefined2 uStack_2a;
  uint local_28;
  uint local_24;
  int local_20;
  uint local_1c;
  uint local_18;
  uint local_14;
  uint local_10;
  uint local_c;
  ushort local_8;
  short local_6;
  undefined2 local_4;

  cVar8 = *(char *)(param_1 + 0x2f);
  puVar16 = (unit_struct *)0x0;
  bVar6 = false;
  local_20 = 0;
  if (((*(ushort *)(param_1 + 0x89) != 0) &&
      (puVar3 = unit_land_array[*(ushort *)(param_1 + 0x89)], (*(byte *)&puVar3->flags_2 & 1) == 0))
     && (puVar3->unit_class != '\0')) {
    puVar16 = puVar3;
  }
  if (puVar16 == (unit_struct *)0x0) {
    if ((game_state.level_flags & 2) == 0) {
      return unit_type_array_person[*(byte *)(param_1 + 0x2b)].next_state;
    }
    if (*(byte *)(param_1 + 0x2b) != 7) {
      return unit_type_array_person[*(byte *)(param_1 + 0x2b)].next_state;
    }
    return 0x27;
  }
  if (((*(uint *)(param_1 + 0xc) & 0x2004) != 0) ||
     ((puVar16->state != '\n' && (puVar16->state != '!')))) {
LAB_004d8d88:
    if ((game_state.level_flags & 2) == 0) {
      return unit_type_array_person[*(byte *)(param_1 + 0x2b)].next_state;
    }
    if (*(byte *)(param_1 + 0x2b) != 7) {
      return unit_type_array_person[*(byte *)(param_1 + 0x2b)].next_state;
    }
    return 0x27;
  }
  pcVar15 = (char *)0x0;
  uVar11 = (uint)*(ushort *)&puVar16->field_0x9b;
  if ((uVar11 != 0) ||
     (uVar11 = (uint)*(ushort *)
                      ((int)&puVar16->loc_3_z + (uint)(byte)puVar16->hut_people_inside * 2 + 1),
     uVar11 != 0)) {
    pcVar15 = (char *)((int)(game_state.sunlight_array + 0x32) + uVar11 * 10);
  }
  if (((((pcVar15 == (char *)0x0) || ((pcVar15[1] & 1U) != 0)) ||
       ((cVar7 = *pcVar15, cVar7 != '\x11' && ((cVar7 != '\x1f' && (cVar7 != ' ')))))) ||
      ((puVar16->flags_2 & 0x2004) != 0)) || (puVar16->field36_0x5f != 0)) goto LAB_004d8d88;
  sVar9 = *(short *)(param_1 + 0x70);
  *(short *)(param_1 + 0x70) = sVar9 + -1;
  iVar12 = DAT_005aa500;
  if ((-1 < sVar9) && ((game_state.tribes_array[cVar8].field_0x941 & 0x40) == 0)) {
LAB_004d8867:
    cVar8 = *(char *)(param_1 + 0x2d);
    switch(cVar8) {
    case '\0':
      uVar13 = (uint)*(ushort *)(param_1 + 0x3d) - (uint)(ushort)(puVar16->pos).x;
      uVar11 = uVar13;
      if ((int)uVar13 < 0) {
        uVar11 = -uVar13;
      }
      local_c = uVar13;
      if (((uVar11 & 0x8000) != 0) && (local_c = uVar11 - 0x10000, (int)uVar13 < 1)) {
        local_c = 0x10000 - uVar11;
      }
      uVar13 = (uint)*(ushort *)(param_1 + 0x3f) - (uint)(ushort)(puVar16->pos).y;
      uVar11 = uVar13;
      if ((int)uVar13 < 0) {
        uVar11 = -uVar13;
      }
      local_10 = uVar13;
      if (((uVar11 & 0x8000) != 0) && (local_10 = uVar11 - 0x10000, (int)uVar13 < 1)) {
        local_10 = 0x10000 - uVar11;
      }
      iVar12 = FUN_0049bb60(*(undefined2 *)(param_1 + 0x89),local_c,local_10);
      if (iVar12 == -1) {
        *(undefined1 *)(param_1 + 0x2d) = 2;
        *(undefined2 *)(param_1 + 0x5f) = 0;
        uVar10 = (*(short *)(param_1 + 0x78) == 0) - 1 & 4;
        if (((*(uint *)(param_1 + 0xc) & 0x80000) != 0) &&
           (uVar10 = 0xc, (*(byte *)(param_1 + 0x11) & 4) == 0)) {
          uVar10 = 2;
          *(uint *)(param_1 + 0xc) = *(uint *)(param_1 + 0xc) & 0xffff7fff;
        }
        unit_set_object_upper
                  (param_1,unit_type_to_obj_indexes_map
                           [(uint)*(byte *)(param_1 + 0x2b) + (short)uVar10 * 9]);
        return 0;
      }
      *(char *)(param_1 + 0xa8) = (char)iVar12;
      local_30 = (&DAT_00972ae8)[iVar12 * 2] + (puVar16->pos).x;
      sStack_2e = (&DAT_00972aea)[iVar12 * 2] + (puVar16->pos).y;
      FUN_004e9d80(param_1,&local_30);
      *(undefined1 *)(param_1 + 0x2d) = 1;
      break;
    case '\x01':
      if ((*(byte *)(param_1 + 0x2e) & 1) == 0) {
        uVar11 = (int)*(short *)(param_1 + 0x4f) - (int)*(short *)(param_1 + 0x3d);
        uVar13 = (int)uVar11 >> 0x1f;
        if ((0x6f < (int)((uVar11 ^ uVar13) - uVar13)) ||
           (uVar11 = (int)*(short *)(param_1 + 0x51) - (int)*(short *)(param_1 + 0x3f),
           uVar13 = (int)uVar11 >> 0x1f, bVar6 = true, 0x6f < (int)((uVar11 ^ uVar13) - uVar13))) {
          bVar6 = false;
        }
        if (bVar6) {
          uVar11 = (uint)*(byte *)(param_1 + 0xa8);
          iVar12 = FUN_0049bc20(*(undefined2 *)(param_1 + 0x89),uVar11);
          if (iVar12 == 0) {
            *(undefined1 *)(param_1 + 0x2d) = 0;
            return 0;
          }
          local_30 = (&DAT_00972ae8)[uVar11 * 2] + (puVar16->pos).x;
          local_6 = (&DAT_00972aea)[uVar11 * 2] + (puVar16->pos).y;
          uVar4 = CONCAT22(sStack_2e,local_30);
          sStack_2e = local_6;
          local_8 = local_30;
          local_4 = calc_point_height(uVar4,CONCAT22(local_2c,local_6));
          add_unit_to_cell(param_1,&local_8);
          *(undefined1 *)(param_1 + 0x2d) = 2;
          *(undefined2 *)(param_1 + 0x5f) = 0;
          uVar10 = (*(short *)(param_1 + 0x78) == 0) - 1 & 4;
          if (((*(uint *)(param_1 + 0xc) & 0x80000) != 0) &&
             (uVar10 = 0xc, (*(byte *)(param_1 + 0x11) & 4) == 0)) {
            uVar10 = 2;
            *(uint *)(param_1 + 0xc) = *(uint *)(param_1 + 0xc) & 0xffff7fff;
          }
          unit_set_object_upper
                    (param_1,unit_type_to_obj_indexes_map
                             [(uint)*(byte *)(param_1 + 0x2b) + (short)uVar10 * 9]);
          return 0;
        }
      }
      break;
    case '\x02':
      *(char *)(param_1 + 0x2d) = cVar8 + '\x01';
      *(uint *)(param_1 + 0xc) = *(uint *)(param_1 + 0xc) & 0xffdfffff;
      uVar11 = (uint)(ushort)((puVar16->pos).x - *(short *)(param_1 + 0x3d));
      uVar13 = (uint)(ushort)((puVar16->pos).y - *(short *)(param_1 + 0x3f));
      if (0x7fff < uVar11) {
        uVar11 = uVar11 - 0x10000;
      }
      if (0x7fff < uVar13) {
        uVar13 = uVar13 - 0x10000;
      }
      uVar10 = calc_angle_quadrant(uVar11,-uVar13);
      update_gs_unit_related_array_item(param_1);
      *(ushort *)(param_1 + 0x57) = uVar10 & 0x7ff;
      uVar11 = *(uint *)(param_1 + 0xc);
      *(uint *)(param_1 + 0xc) = uVar11 | 0x80;
      *(uint *)(param_1 + 0xc) = uVar11 | 0x1080;
      return 0;
    case '\x03':
      if (((*(byte *)(param_1 + 0x2e) & 0xf) == 0) &&
         (uVar13 = game_state.pseudo_random_val * 0x24a1 + 0x24df, uVar11 = uVar13 >> 0xd,
         local_28 = uVar11 | uVar13 * 0x80000, game_state.pseudo_random_val = local_28,
         (uVar11 & 1) == 0)) {
        *(char *)(param_1 + 0x2d) = *(char *)(param_1 + 0x2d) + '\x01';
        bVar2 = *(byte *)(unit_type_to_obj_indexes_map + *(byte *)(param_1 + 0x2b) + 0x75);
        unit_set_object_upper(param_1,CONCAT22((short)((uint)puVar16 >> 0x10),(ushort)bVar2));
        *(undefined1 *)(param_1 + 0x39) = 0;
        *(undefined2 *)(param_1 + 0x37) = 1;
        *(char *)(param_1 + 0xaa) =
             vstart_related[(short)obj_indexes_table[(uint)(ushort)bVar2 * 2]].frame_counter *
             (obj_related_array[*(byte *)(param_1 + 0x3a) + 3]._f2 + '\x01');
        return 0;
      }
      break;
    case '\x04':
      cVar7 = *(char *)(param_1 + 0xaa) + -1;
      *(char *)(param_1 + 0xaa) = cVar7;
      if (cVar7 < '\x01') {
        *(char *)(param_1 + 0x2d) = cVar8 + '\x01';
        unit_set_object_upper
                  (param_1,(char)unit_type_to_obj_indexes_map[*(byte *)(param_1 + 0x2b) + 0x75]);
        *(undefined1 *)(param_1 + 0x39) = 0;
        *(undefined2 *)(param_1 + 0x37) = 1;
        iVar12 = (int)*(short *)(param_1 + 0x78);
        cVar8 = vstart_related
                [(short)obj_indexes_table
                        [unit_type_to_obj_indexes_map[*(byte *)(param_1 + 0x2b) + 0x75] * 2]].
                frame_counter;
        *(byte *)(param_1 + 0x35) = *(byte *)(param_1 + 0x35) | 2;
        *(undefined2 *)(param_1 + 0x37) = 1;
        *(char *)(param_1 + 0x39) = cVar8 + -1;
        if (iVar12 != 0) {
          if (0 < iVar12) {
            do {
              iVar14 = alloc_unit(5,0xb,0xff,param_1 + 0x3d);
              if (iVar14 == 0) break;
              iVar12 = iVar12 + -100;
              add_unit_to_cell(iVar14,param_1 + 0x3d);
              FUN_0048a050(param_1,0xb,0);
            } while (0 < iVar12);
          }
          if (iVar12 < 0) {
            iVar12 = 0;
          }
          *(short *)(param_1 + 0x78) = (short)iVar12;
          return 0;
        }
      }
      break;
    case '\x06':
      if ((*(byte *)(param_1 + 0x2e) & 1) == 0) {
        cVar8 = FUN_00432da0((undefined4 *)(param_1 + 0x3d),0x38,param_1 + 0x4f,0x38);
        if (cVar8 != '\0') {
          *(undefined2 *)(param_1 + 0x89) = 0;
          uVar4 = *(undefined4 *)(param_1 + 0x3d);
          local_2c = (undefined2)uVar4;
          uStack_2a = (undefined2)((uint)uVar4 >> 0x10);
          iVar12 = FUN_00405050(&local_2c);
          if ((*(byte *)(iVar12 + 1) & 2) != 0) {
            FUN_004044b0(unit_land_array[*(ushort *)(iVar12 + 8) & 0x3ff],&local_2c);
          }
          FUN_00402e70(param_1,&local_2c);
          if ((game_state.level_flags & 2) == 0) {
            return unit_type_array_person[*(byte *)(param_1 + 0x2b)].next_state;
          }
          if (*(byte *)(param_1 + 0x2b) != 7) {
            return unit_type_array_person[*(byte *)(param_1 + 0x2b)].next_state;
          }
          return 0x27;
        }
      }
    }
    return 0;
  }
  uVar11 = game_state.pseudo_random_val * 0x24a1 + 0x24df;
  local_14 = uVar11 >> 0xd | uVar11 * 0x80000;
  if ((local_14 % DAT_005aa504 == 1) ||
     (((load_level_flags._3_1_ & 4) != 0 ||
      ((game_state.tribes_array[cVar8].field_0x941 & 0x40) != 0)))) {
    bVar6 = true;
  }
  game_state.pseudo_random_val = local_14;
  if (!bVar6) {
    uVar11 = DAT_005aa500 >> 3;
    *(short *)(param_1 + 0x70) = (short)DAT_005aa500;
    if (uVar11 != 0) {
      uVar13 = game_state.pseudo_random_val * 0x24a1 + 0x24df;
      local_24 = uVar13 >> 0xd | uVar13 * 0x80000;
      game_state.pseudo_random_val = local_24;
      *(short *)(param_1 + 0x70) =
           *(short *)(param_1 + 0x70) +
           ((short)(local_24 % uVar11) - (short)((int)(uVar11 - (iVar12 >> 0x1f)) >> 1));
    }
    goto LAB_004d8867;
  }
  if ((*(byte *)(param_1 + 0x11) & 8) == 0) {
    if ((199 < (int)game_state.tribes_array[(char)puVar16->tribe_index].num_persons) &&
       ((game_state.tribes_array[cVar8].field_0x941 & 0x40) == 0)) goto LAB_004d87f0;
    ptr_unit_related_20B->field0_0x0 = (int)*(short *)(param_1 + 0x3d);
    ptr_unit_related_20B->field1_0x4 = (int)*(short *)(param_1 + 0x3f);
    ptr_unit_related_20B->unit_ptr = (unit_struct *)(int)*(short *)(param_1 + 0x5d);
    ptr_unit_related_20B->field3_0xc = 0;
    puVar5 = ptr_unit_related_20B;
    ptr_unit_related_20B->field4_0x10 = 0;
    ptr_unit_related_20B = ptr_unit_related_20B + 1;
    unit_allocation_flag = 1;
    iVar12 = alloc_unit(1,CONCAT31((int3)((uint)puVar5 >> 8),*(undefined1 *)(param_1 + 0x2b)),
                        puVar16->tribe_index,param_1 + 0x3d);
    psVar1 = (short *)(game_state.tribes_array[*(char *)(param_1 + 0x2f)].field1414_0x969 + 0x2d);
    *psVar1 = *psVar1 + 1;
    uVar13 = game_state.pseudo_random_val * 0x24a1 + 0x24df;
    uVar11 = uVar13 >> 0xd;
    game_state.pseudo_random_val = uVar11 | uVar13 * 0x80000;
    local_18 = game_state.pseudo_random_val;
    convert_from_polar(0x500,0x40,uVar11 & 0x3f,&local_c,&local_10);
    local_30 = (puVar16->pos).x + (short)local_c;
    sStack_2e = (puVar16->pos).y + (short)local_10;
    if (iVar12 == 0) goto LAB_004d87f0;
    local_32 = CONCAT11((char)((ushort)sStack_2e >> 8),(char)(local_30 >> 8));
    uVar11 = (local_32 & 0xfe) * 2 | local_32 & 0xfe00;
    if ((*(byte *)((int)&game_state.level_data[0].flags + uVar11 * 4 + 1) & 2) != 0) {
      FUN_004044b0(unit_land_array
                   [(ushort)(&game_state.level_data[0].unit_index_2)[uVar11 * 2] & 0x3ff],&local_30)
      ;
    }
    FUN_004e9d80(iVar12,&local_30);
    *(uint *)(iVar12 + 0x68) = CONCAT22(sStack_2e,local_30);
    *(ushort *)(iVar12 + 0x68) = (local_30 & 0xfe00) + 0x100;
    *(ushort *)(iVar12 + 0x6a) = (*(ushort *)(iVar12 + 0x6a) & 0xfe00) + 0x100;
    *(byte *)(iVar12 + 0x82) = *(byte *)(iVar12 + 0x82) & 0xf0;
    *(undefined1 *)(iVar12 + 0x82) = 0;
    uVar11 = (int)*(short *)&unit_related_struct_26B_ARRAY_005a7b90[*(byte *)(iVar12 + 0x30)].
                             field_0x4 >> 2;
    if (uVar11 == 0) {
      uVar11 = 1;
    }
    uVar13 = game_state.pseudo_random_val * 0x24a1 + 0x24df;
    local_1c = uVar13 >> 0xd | uVar13 * 0x80000;
    sVar9 = (short)((int)*(short *)&unit_related_struct_26B_ARRAY_005a7b90[*(byte *)(iVar12 + 0x30)]
                                    .field_0x4 + local_1c % uVar11);
    game_state.pseudo_random_val = local_1c;
    *(short *)(iVar12 + 0x5f) = sVar9;
    if ((*(byte *)(iVar12 + 0x16) & 8) != 0) {
      *(short *)(iVar12 + 0x5f) = sVar9 * 2;
    }
    FUN_004d3ff0(iVar12,(-(uint)(*(short *)(iVar12 + 0x78) == 0) & 0xfffffffc) + 5);
    *(uint *)(iVar12 + 0x10) = *(uint *)(iVar12 + 0x10) | 0x40000;
    *(uint *)(iVar12 + 0x14) = *(uint *)(iVar12 + 0x14) | 0x1000000;
    iVar14 = FUN_004f2480(puVar16);
    if ((iVar14 != 0) &&
       (*(char *)((int)game_state.start_n1 +
                 (char)game_state.tribes_array[(char)puVar16->tribe_index].tribe_num * 0x30 + -7) !=
        '\0')) {
      FUN_004f2560(puVar16,unit_type_array_person[*(byte *)(param_1 + 0x2b)].field_0x1e);
    }
    iVar14 = alloc_unit(7,0x3a,0xff,param_1 + 0x3d);
    if (iVar14 != 0) {
      FUN_0048a050(param_1,5,0);
      *(undefined2 *)(iVar14 + 0x72) = *(undefined2 *)(iVar12 + 0x24);
    }
  }
  local_20 = 1;
LAB_004d87f0:
  if (local_20 != 0) {
    FUN_004d4b50(param_1);
  }
  return 0;
}
