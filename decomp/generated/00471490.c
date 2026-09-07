/* Ghidra 12.1.3 pseudocode; entry 00471490; render_object_with_faces.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */

void render_object_with_faces(int param_1)

{
  undefined1 uVar1;
  short sVar2;
  short sVar3;
  objs0_struct *poVar4;
  uint uVar5;
  undefined2 extraout_var;
  undefined2 extraout_var_00;
  pnts_related_struct *ppVar6;
  uint uVar7;
  uint uVar8;
  pnts0_struct *ppVar9;
  int iVar10;
  facs0_struct *pfVar11;
  int iVar12;
  int iVar13;
  int iVar14;
  float10 fVar15;
  short *local_50;
  pnts_related_struct *local_44;
  pnts_related_struct *local_40;
  pnts_related_struct *local_3c;
  pnts_related_struct *local_38;
  uint local_34;
  int local_30;
  int local_2c;
  int local_28;
  int local_24;
  int local_20;
  int local_1c;
  int local_18;
  int local_14;
  int local_10;
  int local_c;
  int local_8;
  int local_4;

  local_34 = (uint)*(ushort *)(param_1 + 0x24);
  poVar4 = objs0_mem + *(short *)(param_1 + 0x33);
  if ((*(ushort *)(param_1 + 0x35) & 0x200) == 0) {
    iVar14 = poVar4->maybe_coord_scale;
  }
  else {
    iVar14 = *(int *)(param_1 + 0x68);
  }
  if ((*(ushort *)(param_1 + 0x35) & 0x20) == 0) {
    if (((*(short *)(param_1 + 0x26) == 0) && (*(short *)(param_1 + 0x6c) == 0)) &&
       (*(short *)(param_1 + 0x6e) == 0)) {
      sVar3 = 0;
    }
    else {
      sVar3 = 1;
    }
    if (sVar3 == 0) goto LAB_00471586;
    init_matrix3x3(&local_24);
    create_z_rot_matrix3x3(CONCAT22(extraout_var,*(undefined2 *)(param_1 + 0x6c)),&local_24);
    create_y_rot_matrix3x3(CONCAT22(extraout_var_00,*(undefined2 *)(param_1 + 0x6e)),&local_24);
  }
  else {
    sVar3 = *(short *)(param_1 + 0x26);
    if (sVar3 == 0) goto LAB_00471586;
    init_matrix3x3(&local_24);
  }
  local_50 = (short *)(param_1 + 0x26);
  rotate_basis(&local_24,CONCAT22((short)((uint)local_50 >> 0x10),-*local_50),2);
LAB_00471586:
  local_50 = (short *)(param_1 + 0x26);
  uVar7 = (uint)*(ushort *)(param_1 + 0x3d) - (uint)(ushort)tribe_ptr->x;
  uVar5 = uVar7;
  if ((int)uVar7 < 0) {
    uVar5 = -uVar7;
  }
  uVar8 = uVar7;
  if (((uVar5 & 0x8000) != 0) && (uVar8 = uVar5 - 0x10000, (int)uVar7 < 1)) {
    uVar8 = 0x10000 - uVar5;
  }
  local_30 = (int)uVar8 >> 1;
  uVar7 = (uint)*(ushort *)(param_1 + 0x3f) - (uint)(ushort)tribe_ptr->y;
  uVar5 = uVar7;
  if ((int)uVar7 < 0) {
    uVar5 = -uVar7;
  }
  uVar8 = uVar7;
  if (((uVar5 & 0x8000) != 0) && (uVar8 = uVar5 - 0x10000, (int)uVar7 < 1)) {
    uVar8 = 0x10000 - uVar5;
  }
  local_2c = (int)uVar8 >> 1;
  ppVar6 = temp_pnts_related_array;
  ppVar9 = poVar4->pnts0_ptr;
  iVar10 = (int)(short)poVar4->pnts_num;
  if (0 < (short)poVar4->pnts_num) {
    do {
      local_28 = iVar10;
      sVar2 = ppVar9->z;
      iVar13 = ppVar9->x * iVar14 >> 8;
      iVar12 = ppVar9->y * iVar14 >> 8;
      ppVar6->x = iVar13;
      iVar10 = sVar2 * iVar14 >> 8;
      ppVar6->y = iVar12;
      ppVar6->z = iVar10;
      *(undefined4 *)&ppVar6->field_0x18 = 0;
      if (sVar3 != 0) {
        ppVar6->x = local_1c * iVar10 + local_20 * iVar12 + local_24 * iVar13 >> 0xe;
        ppVar6->y = local_10 * iVar10 + local_14 * iVar12 + local_18 * iVar13 >> 0xe;
        ppVar6->z = local_4 * iVar10 + local_8 * iVar12 + local_c * iVar13 >> 0xe;
      }
      ppVar6->x = ppVar6->x + local_30;
      ppVar6->z = ppVar6->z + local_2c;
      ppVar9 = ppVar9 + 1;
      ppVar6->y = ppVar6->y + (int)*(short *)(param_1 + 0x41);
      local_28 = local_28 + -1;
      ppVar6 = ppVar6 + 1;
      iVar10 = local_28;
    } while (local_28 != 0);
  }
  iVar14 = (int)(short)poVar4->facs_num;
  pfVar11 = poVar4->facs0_ptr;
  if (0 < iVar14) {
    do {
      local_44 = temp_pnts_related_array + pfVar11->point_1;
      local_40 = temp_pnts_related_array + pfVar11->point_2;
      local_3c = temp_pnts_related_array + pfVar11->point_3;
      if ((pfVar11->f5 & 1) == 0) {
        pfVar11->maybe_normal =
             (&pfVar11->f6)[(short)((int)((int)*local_50 + ((int)*local_50 >> 0x1f & 0x1ffU)) >> 9)]
        ;
      }
      else {
        sVar3 = calc_normal_maybe(local_44,local_40,local_3c);
        pfVar11->maybe_normal = sVar3;
      }
      pfVar11 = pfVar11 + 1;
      iVar14 = iVar14 + -1;
    } while (iVar14 != 0);
  }
  ppVar6 = temp_pnts_related_array;
  iVar14 = (int)(short)poVar4->pnts_num;
  if (0 < iVar14) {
    do {
      coord_pnts_global_convert(ppVar6);
      ppVar6 = ppVar6 + 1;
      iVar14 = iVar14 + -1;
    } while (iVar14 != 0);
  }
  iVar14 = (int)(short)poVar4->facs_num;
  pfVar11 = poVar4->facs0_ptr;
  if (0 < iVar14) {
    do {
      local_44 = temp_pnts_related_array + pfVar11->point_1;
      local_40 = temp_pnts_related_array + pfVar11->point_2;
      local_3c = temp_pnts_related_array + pfVar11->point_3;
      local_38 = temp_pnts_related_array + pfVar11->point_4;
      if (((pfVar11->flags & 1) == 0) && ((*(byte *)&poVar4->flags & 2) == 0)) {
        uVar1 = (&sunlight_related_array_1)[pfVar11->maybe_normal];
      }
      else {
        uVar1 = (&sunlight_related_array_2)[pfVar11->maybe_normal];
      }
      fVar15 = (float10)screen_clipping(local_44,local_40,local_3c);
      if ((float10)_DAT_0058f468 < fVar15) {
        add_polygon_to_draw_3v_2
                  (pfVar11,&local_44,-((int)poVar4->f1 + (int)pfVar11->f8),uVar1,0,1,2,local_34);
      }
      if ((3 < (byte)pfVar11->num_points) &&
         (fVar15 = (float10)screen_clipping(local_44,local_3c,local_38),
         (float10)_DAT_0058f468 < fVar15)) {
        add_polygon_to_draw_3v_2
                  (pfVar11,&local_44,-((int)poVar4->f1 + (int)pfVar11->f8),uVar1,0,2,3,local_34);
      }
      pfVar11 = pfVar11 + 1;
      iVar14 = iVar14 + -1;
    } while (iVar14 != 0);
  }
  return;
}
