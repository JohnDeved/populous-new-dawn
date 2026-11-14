/* Ghidra 12.1.3 pseudocode; entry 004ba640; FUN_004ba640.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_004ba640(ushort param_1)

{
  unit_struct *puVar1;
  bool bVar2;

  bVar2 = false;
  puVar1 = unit_land_array
           [(short)(&game_state.level_data[0].unit_index)
                   [((param_1 & 0xfe) * 2 | param_1 & 0xfe00) * 2]];
  while ((puVar1 != (unit_struct *)0x0 && (!bVar2))) {
    bVar2 = false;
    if ((PTR_008922d8 != puVar1) && ((puVar1->unit_class == '\n' && (puVar1->unit_type == '\x10'))))
    {
      bVar2 = true;
    }
    puVar1 = unit_land_array[puVar1->next_unit_index];
  }
  return;
}
