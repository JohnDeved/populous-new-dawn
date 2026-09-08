/* Ghidra 12.1.3 pseudocode; entry 004ee300; update_unit_lists.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void update_unit_lists(void)

{
  ushort uVar1;
  unit_struct *puVar2;

  free_units_more_640 = (unit_struct *)0x0;
  free_units_less_640 = (unit_struct *)0x0;
  allocated_units = (unit_struct *)0x0;
  units_to_free = (unit_struct *)0x0;
  DAT_0089c651 = 0;
  DAT_0089c659 = 0;
  puVar2 = unit_array_ptr_2;
  if (unit_array_ptr_2 < unit_array_ptr_3) {
    do {
      if (puVar2->unit_class == '\0') {
        if ((puVar2->flags_2 & 1) != 0) {
          puVar2->next_unit_1 = units_to_free;
          puVar2->prev_unit = (unit_struct *)0x0;
          units_to_free = puVar2;
          if (puVar2->next_unit_1 != (unit_struct *)0x0) {
            puVar2->next_unit_1->prev_unit = puVar2;
          }
          uVar1 = puVar2->unit_index;
          goto joined_r0x004ee3d4;
        }
        if ((ushort)puVar2->unit_index < 0x280) {
          puVar2->next_unit_1 = free_units_less_640;
          puVar2->prev_unit = (unit_struct *)0x0;
          free_units_less_640 = puVar2;
          if (puVar2->next_unit_1 != (unit_struct *)0x0) {
            puVar2->next_unit_1->prev_unit = puVar2;
          }
        }
        else {
          puVar2->next_unit_1 = free_units_more_640;
          puVar2->prev_unit = (unit_struct *)0x0;
          free_units_more_640 = puVar2;
          if (puVar2->next_unit_1 != (unit_struct *)0x0) {
            puVar2->next_unit_1->prev_unit = puVar2;
          }
        }
      }
      else {
        puVar2->next_unit_1 = allocated_units;
        puVar2->prev_unit = (unit_struct *)0x0;
        allocated_units = puVar2;
        if (puVar2->next_unit_1 != (unit_struct *)0x0) {
          puVar2->next_unit_1->prev_unit = puVar2;
        }
        uVar1 = puVar2->unit_index;
joined_r0x004ee3d4:
        DAT_0089c651 = DAT_0089c651 + 1;
        if (uVar1 < 0x280) {
          DAT_0089c659 = DAT_0089c659 + 1;
        }
      }
      puVar2 = puVar2 + 1;
    } while (puVar2 < unit_array_ptr_3);
  }
  free_units_2 = (unit_struct *)0x0;
  allocated_units_2 = (unit_struct *)0x0;
  DAT_0089c655 = 0;
  DAT_0089c65d = 0;
  puVar2 = unit_array_ptr_4;
  if (unit_array_ptr_4 < unit_array_ptr_end_2) {
    do {
      if (puVar2->unit_class == '\0') {
        puVar2->next_unit_1 = free_units_2;
        puVar2->prev_unit = (unit_struct *)0x0;
        free_units_2 = puVar2;
        if (puVar2->next_unit_1 != (unit_struct *)0x0) {
          puVar2->next_unit_1->prev_unit = puVar2;
        }
      }
      else {
        puVar2->next_unit_1 = allocated_units_2;
        puVar2->prev_unit = (unit_struct *)0x0;
        allocated_units_2 = puVar2;
        if (puVar2->next_unit_1 != (unit_struct *)0x0) {
          puVar2->next_unit_1->prev_unit = puVar2;
        }
        DAT_0089c655 = DAT_0089c655 + 1;
      }
      puVar2 = puVar2 + 1;
    } while (puVar2 < unit_array_ptr_end_2);
  }
  return;
}
