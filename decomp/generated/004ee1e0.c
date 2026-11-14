/* Ghidra 12.1.3 pseudocode; entry 004ee1e0; FUN_004ee1e0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_004ee1e0(unit_struct *param_1)

{
  ushort *puVar1;
  unit_struct **ppuVar2;
  int iVar3;
  sunlight_struct *psVar4;
  undefined2 local_2;

  if ((*(byte *)((int)&param_1->flags_2 + 2) & 2) != 0) {
    local_2 = CONCAT11((char)((ushort)(param_1->pos).y >> 8),(char)((ushort)(param_1->pos).x >> 8));
    puVar1 = &param_1->next_unit_index;
    if (param_1->r1 == 0) {
      (&game_state.level_data[0].unit_index)[((local_2 & 0xfe) * 2 | local_2 & 0xfe00) * 2] =
           *puVar1;
    }
    else {
      unit_land_array[(ushort)param_1->r1]->next_unit_index = *puVar1;
    }
    if (*puVar1 != 0) {
      unit_land_array[*puVar1]->r1 = param_1->r1;
    }
    param_1->flags_2 = param_1->flags_2 & 0xfffdffff;
  }
  ppuVar2 = &param_1->next_unit_1;
  DAT_0089c655 = DAT_0089c655 + -1;
  param_1->unit_class = 0;
  if (param_1->prev_unit == (unit_struct *)0x0) {
    allocated_units_2 = *ppuVar2;
  }
  else {
    param_1->prev_unit->next_unit_1 = *ppuVar2;
  }
  if (*ppuVar2 != (unit_struct *)0x0) {
    (*ppuVar2)->prev_unit = param_1->prev_unit;
  }
  param_1->prev_unit = (unit_struct *)0x0;
  *ppuVar2 = free_units_2;
  free_units_2 = param_1;
  if (*ppuVar2 != (unit_struct *)0x0) {
    (*ppuVar2)->prev_unit = param_1;
  }
  if ((*(byte *)((int)&param_1->flags_2 + 3) & 4) != 0) {
    iVar3 = 0;
    psVar4 = game_state.sunlight_array;
    while ((psVar4->enabled & psVar4->unit_index == param_1->unit_index) == 0) {
      iVar3 = iVar3 + 1;
      psVar4 = psVar4 + 1;
      if (0x31 < iVar3) {
        return;
      }
    }
    landscape_modification_sunlight_item(psVar4);
  }
  return;
}
