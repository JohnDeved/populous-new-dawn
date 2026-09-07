/* Ghidra 12.1.3 pseudocode; entry 004ed8a0; alloc_unit.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


unit_struct * alloc_unit(byte param_1,byte param_2,undefined1 param_3,undefined4 *param_4)

{
  undefined2 uVar1;
  uint uVar2;
  unit_struct *puVar3;
  unit_struct *puVar4;
  undefined4 uVar5;
  unit_type_scenery *puVar6;
  int iVar7;
  uint uVar8;
  unit_struct **ppuVar9;
  unit_struct *puVar10;
  unit_struct *puVar11;
  bool bVar12;

  uVar8 = (uint)param_1;
  bVar12 = false;
  if (((unit_class_struct_ARRAY_005a6830[uVar8].f3 & 1) != 0) ||
     (((((unit_class_struct_ARRAY_005a6830[uVar8].f3 & 0x40) != 0 && (uVar8 == 5)) &&
       (puVar6 = unit_type_array_scenery + param_2, uVar2._0_1_ = puVar6->flags_1,
       uVar2._1_1_ = puVar6->flags, uVar2._2_1_ = puVar6->field14_0x16,
       uVar2._3_1_ = puVar6->field15_0x17, bVar12 = (uVar2 & 0x1000000) != 0,
       (uVar2 & 0x2000000) != 0)) &&
      (game_state._858461_1_ = game_state._858461_1_ + '\x01', (game_state._858461_1_ & 1) != 0))))
  {
    bVar12 = true;
  }
  if (!bVar12) {
    puVar10 = free_units_more_640;
    if (DAT_0089c651 - DAT_0089c659 < 0x44d) goto LAB_004ed965;
    if ((unit_class_struct_ARRAY_005a6830[uVar8].f3 & 2) == 0) {
      if ((free_units_more_640 != (unit_struct *)0x0) ||
         ((unit_class_struct_ARRAY_005a6830[uVar8].f3 & 4) == 0)) goto LAB_004ed965;
    }
    else if ((0x250 < DAT_0089c659) || (free_units_less_640 == (unit_struct *)0x0))
    goto LAB_004ed965;
  }
  puVar10 = free_units_less_640;
LAB_004ed965:
  if (puVar10 == (unit_struct *)0x0) {
    if (unit_allocation_flag != '\0') {
      ptr_unit_related_20B = ptr_unit_related_20B + -1;
      unit_allocation_flag = '\0';
    }
  }
  else {
    puVar3 = puVar10->prev_unit;
    if ((ushort)puVar10->unit_index < 0x280) {
      if (puVar3 == (unit_struct *)0x0) {
        free_units_less_640 = puVar10->next_unit_1;
      }
      else {
        puVar3->next_unit_1 = puVar10->next_unit_1;
      }
    }
    else if (puVar3 == (unit_struct *)0x0) {
      free_units_more_640 = puVar10->next_unit_1;
    }
    else {
      puVar3->next_unit_1 = puVar10->next_unit_1;
    }
    ppuVar9 = &puVar10->next_unit_1;
    if (*ppuVar9 != (unit_struct *)0x0) {
      (*ppuVar9)->prev_unit = puVar10->prev_unit;
    }
    puVar10->prev_unit = (unit_struct *)0x0;
    *ppuVar9 = allocated_units;
    allocated_units = puVar10;
    if (*ppuVar9 != (unit_struct *)0x0) {
      (*ppuVar9)->prev_unit = puVar10;
    }
    puVar3 = *ppuVar9;
    puVar4 = puVar10->prev_unit;
    uVar1 = puVar10->unit_index;
    puVar11 = puVar10;
    for (iVar7 = 0x2c; iVar7 != 0; iVar7 = iVar7 + -1) {
      puVar11->prev_unit = (unit_struct *)0x0;
      puVar11 = (unit_struct *)&puVar11->next_unit_1;
    }
    *(undefined2 *)&puVar11->prev_unit = 0;
    *(undefined1 *)((int)&puVar11->prev_unit + 2) = 0;
    puVar10->unit_index = uVar1;
    *ppuVar9 = puVar3;
    puVar10->prev_unit = puVar4;
    DAT_0089c651 = DAT_0089c651 + 1;
    if ((ushort)puVar10->unit_index < 0x280) {
      DAT_0089c659 = DAT_0089c659 + 1;
    }
    game_state.units_allocated = game_state.units_allocated + 1;
    puVar10->class_counter = game_state.start_24[uVar8 + 7];
    if ((unit_class_struct_ARRAY_005a6830[uVar8].f2 & 0x10) == 0) {
      game_state.start_24[uVar8 + 7] = game_state.start_24[uVar8 + 7] + '\x01';
    }
    puVar10->unit_class = param_1;
    puVar10->unit_type = param_2;
    puVar10->tribe_index = param_3;
    uVar5 = *param_4;
    (puVar10->pos).x = (short)uVar5;
    (puVar10->pos).y = (short)((uint)uVar5 >> 0x10);
    (puVar10->pos).z = *(undefined2 *)(param_4 + 1);
    puVar10->flags_2 = 0;
    puVar10->flags_4 = 0;
    puVar10->flags_3 = 0;
    (puVar10->vec1).x = 0;
    (puVar10->vec1).y = 0;
    (puVar10->vec1).z = 0;
    puVar10->r2 = 0;
    puVar10->mid = sprite_animation_counter;
    if (unit_allocation_flag_2 == '\0') {
      if (unit_allocation_flag != '\0') {
        puVar10->flags_2 = puVar10->flags_2 | 0x400;
        unit_allocation_flag = '\0';
      }
      init_unit_class(puVar10);
    }
  }
  unit_allocation_flag_2 = 0;
  return puVar10;
}
