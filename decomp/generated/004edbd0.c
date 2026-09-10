/* Ghidra 12.1.3 pseudocode; entry 004edbd0; alloc_unit_2.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


unit_struct * alloc_unit_2(byte param_1,undefined1 param_2,undefined1 param_3,undefined4 *param_4)

{
  unit_struct **ppuVar1;
  undefined2 uVar2;
  unit_struct *puVar3;
  unit_struct *puVar4;
  undefined4 uVar5;
  unit_struct *puVar6;
  int iVar7;
  unit_struct *puVar8;

  puVar6 = free_units_2;
  if (free_units_2 == (unit_struct *)0x0) {
    if (unit_allocation_flag != '\0') {
      ptr_unit_related_20B = ptr_unit_related_20B + -1;
      unit_allocation_flag = '\0';
    }
    return (unit_struct *)0x0;
  }
  ppuVar1 = &free_units_2->next_unit_1;
  if (free_units_2->prev_unit == (unit_struct *)0x0) {
    free_units_2 = *ppuVar1;
  }
  else {
    free_units_2->prev_unit->next_unit_1 = *ppuVar1;
  }
  if (*ppuVar1 != (unit_struct *)0x0) {
    (*ppuVar1)->prev_unit = puVar6->prev_unit;
  }
  puVar6->prev_unit = (unit_struct *)0x0;
  *ppuVar1 = allocated_units_2;
  allocated_units_2 = puVar6;
  if (*ppuVar1 != (unit_struct *)0x0) {
    (*ppuVar1)->prev_unit = puVar6;
  }
  uVar2 = puVar6->unit_index;
  puVar3 = *ppuVar1;
  puVar4 = puVar6->prev_unit;
  puVar8 = puVar6;
  for (iVar7 = 0x2c; iVar7 != 0; iVar7 = iVar7 + -1) {
    puVar8->prev_unit = (unit_struct *)0x0;
    puVar8 = (unit_struct *)&puVar8->next_unit_1;
  }
  *(undefined2 *)&puVar8->prev_unit = 0;
  *(undefined1 *)((int)&puVar8->prev_unit + 2) = 0;
  puVar6->unit_index = uVar2;
  *ppuVar1 = puVar3;
  puVar6->prev_unit = puVar4;
  DAT_0089c655 = DAT_0089c655 + 1;
  puVar6->class_counter = game_state.start_24[param_1 + 7];
  puVar6->unit_class = param_1;
  puVar6->unit_type = param_2;
  puVar6->tribe_index = param_3;
  uVar5 = *param_4;
  (puVar6->pos).x = (short)uVar5;
  (puVar6->pos).y = (short)((uint)uVar5 >> 0x10);
  (puVar6->pos).z = *(undefined2 *)(param_4 + 1);
  if (unit_allocation_flag_2 == '\0') {
    if (unit_allocation_flag != '\0') {
      puVar6->flags_2 = puVar6->flags_2 | 0x400;
      unit_allocation_flag = '\0';
    }
    init_unit_class(puVar6);
    return puVar6;
  }
  unit_allocation_flag_2 = 0;
  return puVar6;
}
