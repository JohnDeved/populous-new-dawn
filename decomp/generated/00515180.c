/* Ghidra 12.1.3 pseudocode; entry 00515180; FUN_00515180.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_00515180(int param_1)

{
  byte bVar1;
  ushort uVar2;
  undefined2 uVar3;
  unit_struct *puVar4;
  unit_struct *puVar5;
  undefined4 uVar6;
  bool bVar7;
  short sVar8;
  uint uVar9;
  uint uVar10;
  undefined1 uVar11;
  int iVar12;
  short *psVar13;
  ushort *puVar14;
  ushort local_2a;
  undefined2 local_28;
  undefined2 local_26;
  int local_24;
  uint local_20;
  uint local_1c;
  char local_18;
  int local_14;
  short local_10;
  short sStack_e;
  undefined2 local_c;
  ushort local_6;

  bVar7 = false;
  sVar8 = *(short *)(param_1 + 0x6c) + 1;
  *(short *)(param_1 + 0x6c) = sVar8;
  switch(sVar8) {
  case 1:
    alloc_unit(7,0x48,*(undefined1 *)(param_1 + 0x2f),param_1 + 0x3d);
    break;
  case 8:
    if (0x333 < *(short *)(param_1 + 0x41)) {
LAB_005151f4:
      bVar7 = true;
    }
    break;
  case 9:
    if (0x267 < *(short *)(param_1 + 0x41)) goto LAB_005151f4;
    break;
  case 10:
    if (0x19b < *(short *)(param_1 + 0x41)) goto LAB_005151f4;
    break;
  case 0xb:
    if (0xcf < *(short *)(param_1 + 0x41)) goto LAB_005151f4;
    break;
  case 0xc:
    if (-1 < *(short *)(param_1 + 0x41)) goto LAB_005151f4;
  }
  if (!bVar7) {
    return;
  }
  puVar4 = game_state.tribes_array[*(char *)(param_1 + 0x2f)].shaman;
  if (puVar4 == (unit_struct *)0x0) goto LAB_0051560a;
  local_14 = 9;
  uVar2 = (puVar4->pos).x;
  local_6 = (puVar4->pos).y & 0xfe00;
  do {
    iVar12 = 9;
    do {
      uVar9 = game_state.pseudo_random_val * 0x24a1 + 0x24df;
      uVar10 = uVar9 >> 0xd;
      local_1c = uVar10 | uVar9 * 0x80000;
      local_10 = ((ushort)uVar10 & 0x1ff) + (uVar2 & 0xfe00);
      uVar9 = local_1c * 0x24a1 + 0x24df;
      uVar10 = uVar9 >> 0xd;
      game_state.pseudo_random_val = uVar10 | uVar9 * 0x80000;
      uVar6 = CONCAT22(sStack_e,local_10);
      sStack_e = ((ushort)uVar10 & 0x1ff) + local_6;
      local_20 = game_state.pseudo_random_val;
      local_c = calc_point_height(uVar6,CONCAT22(local_c,sStack_e));
      alloc_unit(7,3,*(undefined1 *)(param_1 + 0x2f),&local_10);
      iVar12 = iVar12 + -1;
    } while (iVar12 != 0);
    local_14 = local_14 + -1;
  } while (local_14 != 0);
  if ((puVar4->unit_land_array_index != 0) &&
     (puVar5 = unit_land_array[(ushort)puVar4->unit_land_array_index], puVar5 != (unit_struct *)0x0)
     ) {
    puVar4->unit_land_array_index = 0;
    puVar4->flags_4 = puVar4->flags_4 & 0xfdffffff;
    FUN_004d8250(puVar4,1);
    iVar12 = 0;
    puVar5->field_0x9e = puVar5->field_0x9e + -1;
    if ('\0' < (char)unit_type_array_vehicle[(byte)puVar5->unit_type].field_0x8) {
      psVar13 = &puVar5->loc_1_x;
      do {
        if (*psVar13 == puVar4->unit_index) break;
        psVar13 = psVar13 + 1;
        iVar12 = iVar12 + 1;
      } while (iVar12 < (char)unit_type_array_vehicle[(byte)puVar5->unit_type].field_0x8);
    }
    (&puVar5->loc_1_x)[iVar12] = 0;
    uVar10._0_1_ = puVar5->num_points;
    uVar10._1_1_ = puVar5->tex_size_type;
    uVar10._2_2_ = puVar5->facs0_index;
    uVar10 = uVar10 | 2;
    puVar5->num_points = (char)uVar10;
    puVar5->tex_size_type = (char)(uVar10 >> 8);
    puVar5->facs0_index = (short)(uVar10 >> 0x10);
    *(undefined1 *)((int)&puVar5->unit_land_array_index + 1) = 2;
    puVar5->field_0xa1 = puVar4->tribe_index;
    if ((puVar5->field_0x9e != '\0') && (iVar12 == 0)) {
      FUN_004668b0(puVar5);
    }
  }
  if ((*(byte *)((int)&puVar4->flags_2 + 2) & 0x80) != 0) {
    local_26 = CONCAT11((char)((ushort)(puVar4->pos).y >> 8),(char)((ushort)(puVar4->pos).x >> 8));
    remove_person_from_hut
              (unit_land_array
               [(ushort)(&game_state.level_data[0].unit_index_2)
                        [((local_26 & 0xfe) * 2 | local_26 & 0xfe00) * 2] & 0x3ff],puVar4);
  }
  if ((*(byte *)((int)&puVar4->flags_2 + 2) & 2) != 0) {
    add_unit_to_cell(puVar4,param_1 + 0x3d);
  }
  local_24 = *(int *)(param_1 + 0x3d);
  local_28 = CONCAT11((char)((uint)local_24 >> 0x18),(char)((uint)local_24 >> 8));
  uVar10 = (local_28 & 0xfe) * 2 | local_28 & 0xfe00;
  if ((*(byte *)((int)&game_state.level_data[0].flags + uVar10 * 4 + 1) & 2) != 0) {
    FUN_004044b0(unit_land_array
                 [(ushort)(&game_state.level_data[0].unit_index_2)[uVar10 * 2] & 0x3ff],&local_24);
  }
  puVar4->coord_scale_4 = local_24;
  *(ushort *)&puVar4->coord_scale_4 = ((ushort)local_24 & 0xfe00) + 0x100;
  *(ushort *)((int)&puVar4->coord_scale_4 + 2) =
       (*(ushort *)((int)&puVar4->coord_scale_4 + 2) & 0xfe00) + 0x100;
  *(byte *)&puVar4->loc_2_y = *(byte *)&puVar4->loc_2_y & 0xf0;
  *(undefined1 *)&puVar4->loc_2_y = 0;
  if ((game_state.level_flags & 2) == 0) {
    bVar1 = puVar4->unit_type;
LAB_005154ce:
    uVar11 = unit_type_array_person[bVar1].next_state;
  }
  else {
    bVar1 = puVar4->unit_type;
    if (bVar1 != 7) goto LAB_005154ce;
    uVar11 = 0x27;
  }
  if ((*(byte *)((int)&puVar4->flags_2 + 2) & 0x10) == 0) {
    *(undefined1 *)((int)&puVar4->loc_1_y + 1) = puVar4->state;
    empty_unit_function(puVar4);
    puVar4->state = uVar11;
    init_unit_class(puVar4);
  }
  FUN_004d4ee0(puVar4);
  FUN_004e9dd0(puVar4,(int *)(param_1 + 0x3d));
  uVar3 = *(undefined2 *)&puVar4->field_0x5d;
  update_gs_unit_related_array_item(puVar4);
  uVar10 = puVar4->flags_2;
  puVar4->flags_2 = uVar10 | 0x80;
  puVar4->flags_2 = uVar10 | 0x1080;
  puVar4->pos_x1 = uVar3;
  local_2a = CONCAT11((char)((ushort)(puVar4->pos).y >> 8),(char)((ushort)(puVar4->pos).x >> 8)) &
             0xfefe;
  for (puVar5 = unit_land_array
                [(short)(&game_state.level_data[0].unit_index)
                        [((local_2a & 0xfe) * 2 | local_2a & 0xfe00) * 2]];
      puVar5 != (unit_struct *)0x0; puVar5 = unit_land_array[puVar5->next_unit_index]) {
    if (puVar5->unit_class == '\x04') {
      bVar7 = false;
      if (puVar5->field_0x9e == '\0') {
        bVar7 = true;
        goto LAB_005155fc;
      }
      iVar12 = 0;
      local_18 = unit_type_array_vehicle[(byte)puVar5->unit_type].field_0x8;
      if (local_18 < '\x01') goto LAB_005155fc;
      puVar14 = &puVar5->loc_1_x;
      goto LAB_005155cd;
    }
  }
LAB_0051560a:
  update_after_unit_alloc(param_1);
  return;
  while( true ) {
    if ((unit_land_array[*puVar14] != (unit_struct *)0x0) &&
       (puVar4->tribe_index == unit_land_array[*puVar14]->tribe_index)) {
      bVar7 = true;
    }
    puVar14 = puVar14 + 1;
    iVar12 = iVar12 + 1;
    if (local_18 <= iVar12) break;
LAB_005155cd:
    if (bVar7) goto LAB_00515600;
  }
LAB_005155fc:
  if (bVar7) {
LAB_00515600:
    FUN_004657d0(puVar4,puVar5);
  }
  goto LAB_0051560a;
}
