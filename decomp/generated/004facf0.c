/* Ghidra 12.1.3 pseudocode; entry 004facf0; FUN_004facf0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_004facf0(int param_1)

{
  undefined4 *puVar1;
  byte bVar2;
  unit_struct *puVar3;
  char cVar4;
  ushort uVar5;
  short sVar6;
  undefined2 uVar7;
  unit_struct *puVar8;
  int iVar9;
  undefined2 extraout_var;
  uint uVar10;
  undefined2 extraout_var_00;
  undefined4 uVar11;
  undefined4 local_14;
  undefined4 local_10;
  undefined2 local_8;
  undefined2 local_6;
  undefined2 local_4;

  if ((*(uint *)(param_1 + 0xc) & 4) != 0) {
    *(undefined1 *)(param_1 + 0x2d) = 0;
    *(uint *)(param_1 + 0xc) = *(uint *)(param_1 + 0xc) & 0xfffffffb;
  }
  if (*(char *)(param_1 + 0x2d) == '\0') {
    uVar10 = 0xffffffff;
    *(undefined1 *)(param_1 + 0x2d) = 1;
    cVar4 = *(char *)(param_1 + 0x7c);
    if (cVar4 == '\x02') {
      uVar10 = (uint)*(ushort *)&unit_type_array_building[*(int *)(param_1 + 0x74)].field_0xa;
    }
    else if (cVar4 == '\x06') {
      uVar10 = 0x420;
    }
    else if (cVar4 == '\v') {
      uVar10 = (uint)(ushort)(&DAT_005a80de)[*(int *)(param_1 + 0x74) * 0x1f];
    }
    if (-1 < (int)uVar10) {
      unit_set_object(param_1 + 0x33,0,uVar10);
    }
    uVar5 = *(ushort *)(param_1 + 0x35);
    puVar1 = (undefined4 *)(param_1 + 0x3d);
    local_14 = *puVar1;
    *(ushort *)(param_1 + 0x35) = uVar5 | 0x8000;
    sVar6 = 800;
    *(ushort *)(param_1 + 0x35) = uVar5 | 0x8080;
    *(ushort *)(param_1 + 0x35) = uVar5 & 0xffef | 0x8080;
    local_10._0_2_ = CONCAT11((char)((uint)local_14 >> 0x18),(char)((uint)local_14 >> 8));
    uVar10 = ((ushort)local_10 & 0xfe) * 2 | (ushort)local_10 & 0xfe00;
    uVar5 = (&game_state.level_data[0].unit_index_2)[uVar10 * 2] & 0x3ff;
    if (uVar5 != 0) {
      puVar8 = unit_land_array[uVar5];
      if (((*(byte *)((int)&game_state.level_data[0].flags + uVar10 * 4 + 1) & 2) == 0) ||
         (puVar8->unit_type != '\x12')) {
        if (puVar8->unit_class == '\t') {
          FUN_004b9fc0();
        }
        else {
          FUN_004044b0(puVar8,&local_14);
        }
      }
      else {
        sVar6 = FUN_00404540(puVar8,1,&local_10);
        local_14 = local_10;
      }
    }
    local_4 = 0;
    local_8 = (undefined2)local_14;
    local_6 = local_14._2_2_;
    add_unit_to_cell(param_1,&local_8);
    uVar7 = calc_point_height(CONCAT22(extraout_var_00,*(undefined2 *)puVar1),
                              CONCAT22(extraout_var,*(undefined2 *)(param_1 + 0x3f)));
    *(undefined2 *)(param_1 + 0x41) = uVar7;
    *(uint *)(param_1 + 0x10) = *(uint *)(param_1 + 0x10) & 0xfffffbff;
    uVar5 = *(ushort *)(param_1 + 0x78);
    *(short *)(param_1 + 0x41) = *(short *)(param_1 + 0x41) + sVar6;
    if (uVar5 == 0) {
      puVar8 = (unit_struct *)alloc_unit(6,8,0xff,puVar1);
      if (puVar8 == (unit_struct *)0x0) goto LAB_004faf03;
      unit_set_object(&puVar8->object,0x2b,0x589);
      puVar8->flags_3 = puVar8->flags_3 | 0x400;
      (puVar8->object).morph_index = 1;
      sunlight_update_unit_landscape(puVar8,4,4,0);
      *(undefined2 *)(param_1 + 0x78) = puVar8->unit_index;
    }
    else {
      puVar8 = (unit_struct *)0x0;
      if (((uVar5 != 0) && (puVar3 = unit_land_array[uVar5], (*(byte *)&puVar3->flags_2 & 1) == 0))
         && (puVar3->unit_class != '\0')) {
        puVar8 = puVar3;
      }
    }
    if (puVar8 != (unit_struct *)0x0) {
      (puVar8->pos).z = *(short *)(param_1 + 0x41) + -0x50;
    }
  }
LAB_004faf03:
  if (*(short *)(param_1 + 0x7a) == 0) {
    if ((*(byte *)(param_1 + 0x2e) & 3) == 0) {
      local_10._0_2_ =
           CONCAT11((char)((ushort)*(undefined2 *)(param_1 + 0x3f) >> 8),
                    (char)((ushort)*(undefined2 *)(param_1 + 0x3d) >> 8));
      puVar8 = unit_land_array
               [(short)(&game_state.level_data[0].unit_index)
                       [(((ushort)local_10 & 0xfe) * 2 | (ushort)local_10 & 0xfe00) * 2]];
      if (puVar8 != (unit_struct *)0x0) {
        while (((puVar8->unit_class != '\x01' || (puVar8->tribe_index == -1)) ||
               (((puVar8->flags_4 & 0x800) != 0 || (iVar9 = FUN_004f62c0(puVar8,0x1d), iVar9 == 0)))
               )) {
          puVar8 = unit_land_array[puVar8->next_unit_index];
          if (puVar8 == (unit_struct *)0x0) {
            return;
          }
        }
        *(undefined1 *)(param_1 + 0x7e) = puVar8->tribe_index;
        *(undefined1 *)(param_1 + 0x7f) = 6;
        *(undefined2 *)(param_1 + 0x7a) = 0x52;
        FUN_0048a050(0,0x70,1);
        *(undefined1 *)(param_1 + 0x7f) = 1;
        return;
      }
    }
  }
  else {
    if ((*(char *)(param_1 + 0x7f) != '\0') &&
       (cVar4 = *(char *)(param_1 + 0x7f) + -1, *(char *)(param_1 + 0x7f) = cVar4, cVar4 == '\0')) {
      *(byte *)(param_1 + 0x35) = *(byte *)(param_1 + 0x35) | 0x10;
      if ((uint)*(byte *)(param_1 + 0x7e) == (int)player_tribe_num) {
        FUN_00481550(param_1);
      }
      puVar8 = (unit_struct *)0x0;
      if (((*(ushort *)(param_1 + 0x78) != 0) &&
          (puVar3 = unit_land_array[*(ushort *)(param_1 + 0x78)],
          (*(byte *)&puVar3->flags_2 & 1) == 0)) && (puVar3->unit_class != '\0')) {
        puVar8 = puVar3;
      }
      if (puVar8 != (unit_struct *)0x0) {
        *(undefined2 *)(param_1 + 0x78) = 0;
        update_after_unit_alloc(puVar8);
      }
    }
    sVar6 = *(short *)(param_1 + 0x7a) + -1;
    *(short *)(param_1 + 0x7a) = sVar6;
    if (sVar6 < 1) {
      local_14 = CONCAT31(local_14._1_3_,1);
      cVar4 = *(char *)(param_1 + 0x7c);
      if (cVar4 == '\x02') {
        uVar11 = 0xb;
        if (*(char *)(param_1 + 0x80) == '\x03') {
          FUN_00408e90(*(undefined4 *)(param_1 + 0x74),*(undefined1 *)(param_1 + 0x7e),1);
        }
        else {
          struct_56B_set_field_4(*(undefined4 *)(param_1 + 0x74),*(undefined1 *)(param_1 + 0x7e));
        }
      }
      else if (cVar4 == '\x06') {
        bVar2 = *(byte *)(param_1 + 0x7e);
        local_14 = (uint)local_14._1_3_ << 8;
        FUN_0041a500(bVar2,*(undefined4 *)(param_1 + 0x70));
        *(undefined2 *)(game_state.tribes_array[bVar2].field1414_0x969 + 0x27) = 0;
        uVar11 = local_10;
      }
      else {
        uVar11 = local_10;
        if (cVar4 == '\v') {
          if ((&DAT_005a80d0)[*(int *)(param_1 + 0x74) * 0x1f] == 2) {
            set_spell_type_global(*(int *)(param_1 + 0x74));
          }
          uVar11 = 10;
          if (*(char *)(param_1 + 0x80) == '\x03') {
            FUN_004c2cd0(*(undefined4 *)(param_1 + 0x74),*(undefined1 *)(param_1 + 0x7e),1);
            FUN_004c2aa0(*(undefined1 *)(param_1 + 0x7e),*(undefined4 *)(param_1 + 0x74));
          }
          else {
            set_struct_56B_field_0_spell
                      (*(undefined4 *)(param_1 + 0x74),*(undefined1 *)(param_1 + 0x7e));
            FUN_004c2cd0(*(undefined4 *)(param_1 + 0x74),*(undefined1 *)(param_1 + 0x7e),1);
          }
        }
      }
      if (((char)local_14 != '\0') && (*(char *)(param_1 + 0x80) == '\x01')) {
        FUN_0041b580(*(undefined1 *)(param_1 + 0x7e),uVar11,*(undefined4 *)(param_1 + 0x74));
      }
      FUN_004ef180(param_1);
    }
  }
  return;
}
