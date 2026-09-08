/* Ghidra 12.1.3 pseudocode; entry 00470160; add_object_to_rendering_queue_type_0xc.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */

void add_object_to_rendering_queue_type_0xc(int param_1)

{
  char cVar1;
  float fVar2;
  union_polygon *puVar3;
  char cVar4;
  ushort uVar5;
  undefined2 extraout_var;
  uint uVar6;
  int iVar7;
  undefined2 extraout_var_00;
  int iVar8;
  uint uVar9;
  uint uVar10;
  facs0_struct *pfVar11;
  int iVar12;
  short *psVar13;
  int *piVar14;
  uint local_c4;
  uint local_c0;
  facs0_struct *local_bc;
  uint local_b8;
  int local_b4;
  int local_b0;
  int local_ac;
  int local_a4;
  int local_a0;
  int local_9c;
  int local_98;
  int local_94;
  int local_90;
  int local_8c;
  int local_88;
  int local_84;
  int local_80 [3];
  float afStack_74 [5];
  undefined1 local_60 [32];
  undefined1 local_40 [64];

  cVar1 = *(char *)(param_1 + 0x2f);
  local_bc = (facs0_struct *)0x0;
  if (*(short *)(param_1 + 0x94) < 0) {
    local_c0 = (uint)*(char *)(param_1 + 0x92);
  }
  else {
    local_bc = facs0_mem + *(short *)(param_1 + 0x94);
    local_c0 = (uint)(byte)local_bc->num_points;
  }
  init_matrix3x3(&local_a4);
  create_z_rot_matrix3x3(CONCAT22(extraout_var_00,*(undefined2 *)(param_1 + 0x6c)),&local_a4);
  create_y_rot_matrix3x3(CONCAT22(extraout_var,*(undefined2 *)(param_1 + 0x6e)),&local_a4);
  rotate_basis(&local_a4,-*(short *)(param_1 + 0x26),2);
  psVar13 = (short *)(param_1 + 0x7a);
  if (0 < (int)local_c0) {
    local_c4 = local_c0;
    piVar14 = local_80;
    do {
      iVar8 = (int)*psVar13;
      *piVar14 = iVar8;
      iVar7 = (int)psVar13[1];
      piVar14[1] = iVar7;
      iVar12 = (int)psVar13[2];
      piVar14[2] = iVar12;
      *piVar14 = local_9c * iVar12 + local_a0 * iVar7 + local_a4 * iVar8 >> 0xe;
      piVar14[1] = local_90 * iVar12 + local_94 * iVar7 + local_98 * iVar8 >> 0xe;
      piVar14[2] = local_84 * iVar12 + local_88 * iVar7 + local_8c * iVar8 >> 0xe;
      uVar9 = (uint)*(ushort *)(param_1 + 0x3d) - (uint)(ushort)tribe_ptr->x;
      uVar6 = uVar9;
      if ((int)uVar9 < 0) {
        uVar6 = -uVar9;
      }
      uVar10 = uVar9;
      if (((uVar6 & 0x8000) != 0) && (uVar10 = uVar6 - 0x10000, (int)uVar9 < 1)) {
        uVar10 = 0x10000 - uVar6;
      }
      *piVar14 = *piVar14 + ((int)uVar10 >> 1);
      uVar9 = (uint)*(ushort *)(param_1 + 0x3f) - (uint)(ushort)tribe_ptr->y;
      uVar6 = uVar9;
      if ((int)uVar9 < 0) {
        uVar6 = -uVar9;
      }
      uVar10 = uVar9;
      if (((uVar6 & 0x8000) != 0) && (uVar10 = uVar6 - 0x10000, (int)uVar9 < 1)) {
        uVar10 = 0x10000 - uVar6;
      }
      psVar13 = psVar13 + 3;
      piVar14[2] = piVar14[2] + ((int)uVar10 >> 1);
      piVar14[1] = piVar14[1] + (int)*(short *)(param_1 + 0x41);
      coord_pnts_global_convert(piVar14);
      local_c4 = local_c4 - 1;
      piVar14 = piVar14 + 8;
    } while (local_c4 != 0);
  }
  uVar6 = calc_normal_maybe(local_80,local_60,local_40);
  local_b8 = (uint)(byte)(&sunlight_related_array_1)[uVar6 & 0xffff];
  iVar7 = 2 - (uint)(local_c0 == 3);
  puVar3 = empty_polygon;
  do {
    if (iVar7 == 0) {
      empty_polygon = puVar3;
      return;
    }
    if (iVar7 == 1) {
      local_ac = 0;
      local_b0 = 1;
      local_b4 = 2;
    }
    else if (iVar7 == 2) {
      local_ac = 0;
      local_b0 = 2;
      local_b4 = 3;
    }
    uVar6 = 0;
    uVar9 = 0;
    uVar10 = 0;
    if ((uint)afStack_74[local_ac * 8] < 0x80000001) {
      if ((float)(int)screen_width_2 <= afStack_74[local_ac * 8]) {
        uVar9 = 4;
      }
    }
    else {
      uVar9 = 2;
    }
    fVar2 = (float)(int)screen_height_2;
    if (fVar2 <= afStack_74[local_ac * 8 + 1]) {
      uVar9 = uVar9 | 0x10;
    }
    empty_polygon = puVar3;
    if (uVar9 == 0) {
LAB_004704d2:
      if (puVar3 < polypool_mem_end_2) {
        fVar2 = afStack_74[local_ac * 8 + -1];
        empty_polygon = puVar3 + 1;
        iVar8 = ((int)afStack_74[local_b0 * 8 + -1] + (int)afStack_74[local_b4 * 8 + -1] +
                 (int)fVar2 + 0x15000) * 0x55;
        iVar12 = iVar8 >> 8;
        if (iVar12 < 0x40) {
          local_c4 = 0;
        }
        else {
          local_c4 = (int)(iVar12 + (iVar8 >> 0x1f & 0xfU)) >> 4;
          if (0xe00 < (int)local_c4) {
            local_c4 = 0xe00;
          }
        }
        if ((-0xd00 < (int)fVar2) &&
           (iVar8 = (-0xd00 - (int)fVar2) * 0x20,
           local_b8 = local_b8 + ((int)(iVar8 + (iVar8 >> 0x1f & 0x1fffU)) >> 0xd),
           (int)local_b8 < 1)) {
          local_b8 = 1;
        }
        (puVar3->field0).next = polygons_to_draw[local_c4];
        polygons_to_draw[local_c4] = (polygon_drawn *)puVar3;
        (puVar3->field0).type = 6;
        (puVar3->field0).unknown_1 = 0;
        (puVar3->field0).tex_index_2 = *(undefined2 *)(param_1 + 0x24);
        if (*(char *)(param_1 + 0x9e) == '\0') {
          if (local_bc == (facs0_struct *)0x0) {
            (puVar3->field0).tex_size_type = *(char *)(param_1 + 0x93) + '\x01';
            cVar4 = (char)*(short *)(param_1 + 0x33);
            if (((&DAT_005aa218)[*(short *)(param_1 + 0x33)] & 1) == 0) {
              (puVar3->field0).tex_index = cVar4 + '\x01';
            }
            else {
              (puVar3->field0).tex_index = cVar4 + cVar1 + '\x01';
            }
            goto LAB_00470648;
          }
          (puVar3->field0).tex_size_type = local_bc->f11;
          uVar5 = local_bc->maybe_tex_index;
          if (((&DAT_005aa218)[(short)uVar5] & 1) != 0) {
            uVar5 = (ushort)(byte)((char)uVar5 + cVar1);
          }
          (puVar3->field0).tex_index = (char)uVar5 + '\x01';
          pfVar11 = (facs0_struct *)&local_bc->point_1_u;
        }
        else {
          (puVar3->field0).tex_size_type = 7;
          (puVar3->field0).tex_index = 0xfb;
LAB_00470648:
          pfVar11 = &facs0_struct_0087cb03;
        }
        (puVar3->field0).point_1_color = local_b8;
        (puVar3->field0).point_2_color = local_b8;
        (puVar3->field0).point_3_color = local_b8;
        if ((afStack_74[local_b0 * 8] - afStack_74[local_ac * 8]) *
            (afStack_74[local_b4 * 8 + 1] - afStack_74[local_b0 * 8 + 1]) -
            (afStack_74[local_b0 * 8 + 1] - afStack_74[local_ac * 8 + 1]) *
            (afStack_74[local_b4 * 8] - afStack_74[local_b0 * 8]) <= _DAT_0058f468) {
          (puVar3->field0).point_1_x = afStack_74[local_b4 * 8];
          (puVar3->field0).point_1_y = afStack_74[local_b4 * 8 + 1];
          (puVar3->field0).point_2_x = afStack_74[local_b0 * 8];
          (puVar3->field0).point_2_y = afStack_74[local_b0 * 8 + 1];
          (puVar3->field0).point_3_x = afStack_74[local_ac * 8];
          (puVar3->field0).point_3_y = afStack_74[local_ac * 8 + 1];
          (puVar3->field0).point_1_u = *(undefined4 *)(&pfVar11->maybe_normal + local_b4 * 4);
          (puVar3->field0).point_1_v = *(undefined4 *)(&pfVar11->maybe_normal + local_b4 * 4 + 2);
          (puVar3->field0).point_2_u = *(undefined4 *)(&pfVar11->maybe_normal + local_b0 * 4);
          (puVar3->field0).point_2_v = *(undefined4 *)(&pfVar11->maybe_normal + local_b0 * 4 + 2);
          (puVar3->field0).point_3_u = *(undefined4 *)(&pfVar11->maybe_normal + local_ac * 4);
          (puVar3->field0).point_3_v = *(undefined4 *)(&pfVar11->maybe_normal + local_ac * 4 + 2);
        }
        else {
          (puVar3->field0).point_1_x = afStack_74[local_ac * 8];
          (puVar3->field0).point_1_y = afStack_74[local_ac * 8 + 1];
          (puVar3->field0).point_2_x = afStack_74[local_b0 * 8];
          (puVar3->field0).point_2_y = afStack_74[local_b0 * 8 + 1];
          (puVar3->field0).point_3_x = afStack_74[local_b4 * 8];
          (puVar3->field0).point_3_y = afStack_74[local_b4 * 8 + 1];
          (puVar3->field0).point_1_u = *(undefined4 *)(&pfVar11->maybe_normal + local_ac * 4);
          (puVar3->field0).point_1_v = *(undefined4 *)(&pfVar11->maybe_normal + local_ac * 4 + 2);
          (puVar3->field0).point_2_u = *(undefined4 *)(&pfVar11->maybe_normal + local_b0 * 4);
          (puVar3->field0).point_2_v = *(undefined4 *)(&pfVar11->maybe_normal + local_b0 * 4 + 2);
          (puVar3->field0).point_3_u = *(undefined4 *)(&pfVar11->maybe_normal + local_b4 * 4);
          (puVar3->field0).point_3_v = *(undefined4 *)(&pfVar11->maybe_normal + local_b4 * 4 + 2);
        }
      }
    }
    else {
      if ((uint)afStack_74[local_b0 * 8] < 0x80000001) {
        if ((float)(int)screen_width_2 <= afStack_74[local_b0 * 8]) {
          uVar10 = 4;
        }
      }
      else {
        uVar10 = 2;
      }
      if (fVar2 <= afStack_74[local_b0 * 8 + 1]) {
        uVar10 = uVar10 | 0x10;
      }
      if ((uVar9 & uVar10) == 0) goto LAB_004704d2;
      if ((uint)afStack_74[local_b4 * 8] < 0x80000001) {
        if ((float)(int)screen_width_2 <= afStack_74[local_b4 * 8]) {
          uVar6 = 4;
        }
      }
      else {
        uVar6 = 2;
      }
      if (fVar2 <= afStack_74[local_b4 * 8 + 1]) {
        uVar6 = uVar6 | 0x10;
      }
      if ((uVar6 & uVar9 & uVar10) == 0) goto LAB_004704d2;
    }
    iVar7 = iVar7 + -1;
    puVar3 = empty_polygon;
  } while( true );
}
