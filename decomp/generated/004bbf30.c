/* Ghidra 12.1.3 pseudocode; entry 004bbf30; unit_processing_class_8_shot_2.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


/* WARNING: Removing unreachable block (ram,0x004bc115) */
/* WARNING: Removing unreachable block (ram,0x004bc11f) */

void unit_processing_class_8_shot_2(int param_1)

{
  byte bVar1;
  byte bVar2;
  byte bVar3;
  char cVar4;
  undefined2 uVar5;
  undefined4 uVar6;
  undefined2 uVar7;
  byte bVar8;
  ushort uVar9;
  ushort uVar10;
  ushort uVar11;
  byte bVar12;
  uint3 uVar13;
  uint3 uVar14;
  byte bVar15;
  byte bVar16;
  short sVar17;
  undefined2 uVar18;
  ushort uVar19;
  unit_struct *puVar20;
  undefined2 extraout_var;
  int iVar21;
  uint uVar22;
  unit_struct *puVar23;
  undefined2 extraout_var_00;
  uint uVar24;
  uint uVar25;
  int *piVar26;
  uint uVar27;
  unit_struct *puVar28;
  undefined4 local_68;
  short local_64;
  short sStack_62;
  short local_60;
  undefined4 local_5c;
  short local_58;
  int local_54;
  undefined2 local_50;
  undefined2 local_4e;
  int local_4c;
  int local_48;
  ushort local_44;
  int local_40;
  ushort local_3c;
  int local_38;
  undefined2 local_34;
  int local_30;
  ushort local_2c;
  int local_28;
  ushort local_24;
  int local_20;
  ushort local_1c;
  int local_18;
  undefined2 local_14;
  int local_10;
  ushort local_c;
  int local_8;
  ushort local_4;

  uVar6 = *(undefined4 *)(param_1 + 0x3d);
  local_64 = (short)uVar6;
  sStack_62 = (short)((uint)uVar6 >> 0x10);
  puVar23 = (unit_struct *)0x0;
  local_60 = *(short *)(param_1 + 0x41);
  local_4c = 0;
  uVar19 = *(ushort *)(param_1 + 0x88);
  puVar20 = (unit_struct *)CONCAT22((short)((uint)(param_1 + 0x3d) >> 0x10),uVar19);
  cVar4 = *(char *)(param_1 + 0x2f);
  local_54 = (int)*(short *)(param_1 + 0x5f);
  if (((uVar19 != 0) && (puVar20 = unit_land_array[uVar19], (*(byte *)&puVar20->flags_2 & 1) == 0))
     && (puVar20->unit_class != '\0')) {
    puVar23 = puVar20;
  }
  if (puVar23 == (unit_struct *)0x0) {
    *(undefined2 *)(param_1 + 0x88) = 0;
  }
  uVar19 = *(ushort *)(param_1 + 0x8a);
  puVar20 = (unit_struct *)CONCAT22((short)((uint)puVar20 >> 0x10),uVar19);
  puVar28 = (unit_struct *)0x0;
  if (((uVar19 != 0) && (puVar20 = unit_land_array[uVar19], (*(byte *)&puVar20->flags_2 & 1) == 0))
     && (puVar20->unit_class != '\0')) {
    puVar28 = puVar20;
  }
  if (puVar28 == (unit_struct *)0x0) {
    *(undefined2 *)(param_1 + 0x8a) = 0;
    sVar17 = calc_point_height(CONCAT22((short)((uint)puVar23 >> 0x10),
                                        *(undefined2 *)(param_1 + 0x76)),
                               CONCAT22((short)((uint)puVar20 >> 0x10),
                                        *(undefined2 *)(param_1 + 0x78)));
    if (*(short *)(param_1 + 0x7a) < sVar17) {
      *(short *)(param_1 + 0x7a) = sVar17;
    }
  }
  else {
    local_4c = 0;
    if (puVar28->unit_class == '\x02') {
      get_building_coords(puVar28,&local_50);
      *(undefined2 *)(param_1 + 0x76) = local_50;
      *(undefined2 *)(param_1 + 0x78) = local_4e;
      *(undefined2 *)(param_1 + 0x7a) = 0;
      uVar18 = calc_point_height(CONCAT22(extraout_var_00,local_50),CONCAT22(extraout_var,local_4e))
      ;
      *(undefined2 *)(param_1 + 0x7a) = uVar18;
    }
    else {
      *(undefined4 *)(param_1 + 0x76) = *(undefined4 *)&puVar28->pos;
      *(undefined2 *)(param_1 + 0x7a) = (puVar28->pos).z;
    }
    *(short *)(param_1 + 0x7a) = *(short *)(param_1 + 0x7a) + puVar28->mid2 + 0x10;
  }
  local_5c = *(undefined4 *)(param_1 + 0x76);
  local_58 = *(short *)(param_1 + 0x7a);
  iVar21 = (int)(short)local_5c;
  uVar24 = iVar21 - local_64 >> 0x1f;
  if ((((int)((iVar21 - local_64 ^ uVar24) - uVar24) < 0x408) &&
      (uVar24 = (int)local_58 - (int)local_60 >> 0x1f,
      (int)(((int)local_58 - (int)local_60 ^ uVar24) - uVar24) < 0x408)) &&
     ((local_5c._2_2_ = (short)((uint)local_5c >> 0x10), iVar21 = (int)local_5c._2_2_,
      uVar24 = iVar21 - sStack_62 >> 0x1f, (int)((iVar21 - sStack_62 ^ uVar24) - uVar24) < 0x408 &&
      (iVar21 = FUN_00450520(&local_5c,&local_64), iVar21 < local_54)))) {
    local_4c = 1;
    local_54 = (int)(iVar21 * 0xf + (iVar21 * 0xf >> 0x1f & 0xfU)) >> 4;
  }
  alloc_unit(7,3,*(undefined1 *)(param_1 + 0x2f),param_1 + 0x3d);
  uVar24 = (uint)(ushort)((short)local_5c - local_64);
  local_48 = ((int)local_58 - (int)local_60) * 2;
  uVar25 = (uint)(ushort)(local_5c._2_2_ - sStack_62);
  if (0x7fff < uVar24) {
    uVar24 = uVar24 - 0x10000;
  }
  if (0x7fff < uVar25) {
    uVar25 = uVar25 - 0x10000;
  }
  uVar27 = uVar24;
  if ((int)uVar24 < 0) {
    uVar27 = -uVar24;
  }
  uVar22 = uVar25;
  if ((int)uVar25 < 0) {
    uVar22 = -uVar25;
  }
  if ((int)uVar27 <= (int)uVar22) {
    uVar27 = uVar22;
  }
  uVar19 = calc_angle_quadrant(uVar24,-uVar25);
  uVar24 = calc_angle_quadrant(uVar27,-local_48);
  FUN_004e6ac0(&local_64,uVar19 & 0x7ff,uVar24 & 0xffff07ff,local_54);
  sVar17 = calc_point_height(CONCAT22(sStack_62,local_64),CONCAT22(local_60,sStack_62));
  if (local_60 < sVar17) {
    local_60 = sVar17;
  }
  add_unit_to_cell(param_1,&local_64);
  bVar15 = (byte)((ushort)*(undefined2 *)(param_1 + 0x3d) >> 8);
  bVar16 = (byte)((ushort)*(undefined2 *)(param_1 + 0x3f) >> 8);
  local_68._0_1_ = bVar15 & 0xfe;
  bVar8 = (byte)local_68;
  local_68._1_1_ = bVar16 & 0xfe;
  bVar12 = local_68._1_1_;
  bVar1 = local_68._1_1_ + 2;
  local_68._0_2_ = CONCAT11(bVar1,(byte)local_68 - 2);
  uVar19 = (ushort)local_68;
  local_44 = (ushort)local_68;
  local_68._1_3_ = (uint3)bVar1;
  uVar13 = local_68._1_3_;
  local_68._0_2_ = CONCAT11(bVar1,bVar15) & 0xfffe;
  local_3c = (ushort)local_68;
  bVar2 = bVar8 + 2;
  local_34 = CONCAT11(bVar1,bVar2);
  local_68._0_2_ = CONCAT11(bVar16,bVar2) & 0xfeff;
  uVar9 = (ushort)local_68;
  local_2c = (ushort)local_68;
  bVar1 = bVar12 - 2;
  local_68._0_2_ = CONCAT11(bVar1,bVar2);
  uVar10 = (ushort)local_68;
  local_24 = (ushort)local_68;
  local_68._1_3_ = (uint3)bVar1;
  uVar14 = local_68._1_3_;
  local_68._0_2_ = CONCAT11(bVar1,bVar15) & 0xfffe;
  local_1c = (ushort)local_68;
  bVar3 = bVar8 - 2;
  local_14 = CONCAT11(bVar1,bVar3);
  local_68._0_2_ = CONCAT11(bVar16,bVar3) & 0xfeff;
  uVar11 = (ushort)local_68;
  local_c = (ushort)local_68;
  local_68._0_2_ = CONCAT11(bVar16,bVar15) & 0xfefe;
  local_4 = (ushort)local_68;
  local_48 = ((uVar19 & 0xfe) * 2 | uVar19 & 0xfe00) * 4 + 0x8a03e4;
  local_40 = ((uint)bVar8 * 2 | (uint)uVar13 << 8) * 4 + 0x8a03e4;
  local_38 = ((uint)bVar2 * 2 | (uint)uVar13 << 8) * 4 + 0x8a03e4;
  local_30 = ((uVar9 & 0xfe) * 2 | uVar9 & 0xfe00) * 4 + 0x8a03e4;
  local_28 = ((uVar10 & 0xfe) * 2 | uVar10 & 0xfe00) * 4 + 0x8a03e4;
  local_20 = ((uint)bVar8 * 2 | (uint)uVar14 << 8) * 4 + 0x8a03e4;
  local_18 = ((uint)bVar3 * 2 | (uint)uVar14 << 8) * 4 + 0x8a03e4;
  local_10 = ((uVar11 & 0xfe) * 2 | uVar11 & 0xfe00) * 4 + 0x8a03e4;
  local_8 = ((uint)bVar8 * 2 | (uint)bVar12 << 8) * 4 + 0x8a03e4;
  piVar26 = &local_48;
  do {
    for (puVar20 = unit_land_array[*(short *)(*piVar26 + 6)]; puVar20 != (unit_struct *)0x0;
        puVar20 = unit_land_array[puVar20->next_unit_index]) {
      if (((((puVar20->unit_class == '\x01') && (puVar20->tribe_index == cVar4)) &&
           (puVar20->state != ')')) &&
          (((unit_type_array_person[(byte)puVar20->unit_type].flags & 0x80) != 0 &&
           ((puVar20->flags_4 & 0x400) == 0)))) &&
         (((*(byte *)((int)&puVar20->flags_2 + 2) & 8) == 0 && (puVar20->field36_0x5f == 0)))) {
        puVar20->flags_4 = puVar20->flags_4 | 0x400000;
      }
    }
    piVar26 = piVar26 + 2;
  } while (piVar26 < &stack0x00000000);
  if (local_4c != 0) {
    iVar21 = 0;
    if (*(char *)(param_1 + 0x7c) == '\x01') {
      if (puVar28 != (unit_struct *)0x0) {
        uVar5 = (puVar28->pos).x;
        uVar7 = (puVar28->pos).y;
        local_60 = (puVar28->pos).z + puVar28->mid2 + 0x10;
        local_64 = uVar5;
        sStack_62 = uVar7;
        add_unit_to_cell(param_1,&local_64);
      }
      iVar21 = FUN_0048a050(param_1,0xb2,0);
      FUN_00514410(param_1);
    }
    else if (*(char *)(param_1 + 0x7c) == '\x02') {
      iVar21 = FUN_0048a050(param_1,0xb2,0);
    }
    if (iVar21 != 0) {
      *(undefined2 *)(iVar21 + 0xc) = 0;
    }
    update_after_unit_alloc(param_1);
  }
  return;
}
