/* Ghidra 12.1.3 pseudocode; entry 00409ed0; FUN_00409ed0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_00409ed0(int param_1)

{
  ushort uVar1;
  unit_struct *puVar2;
  int iVar3;
  short *psVar4;
  undefined2 local_2;

  local_2 = CONCAT11((char)((ushort)*(undefined2 *)(param_1 + 0x3f) >> 8),
                     (char)((ushort)*(undefined2 *)(param_1 + 0x3d) >> 8));
  uVar1 = (&game_state.level_data[0].unit_index_2)[((local_2 & 0xfe) * 2 | local_2 & 0xfe00) * 2] &
          0x3ff;
  if (uVar1 == 0) {
    puVar2 = game_state.tribes_array[*(char *)(param_1 + 0x2f)].building_units;
    if (puVar2 != (unit_struct *)0x0) {
      do {
        iVar3 = 0;
        psVar4 = &puVar2->loc_3_x;
        do {
          if ((int)*psVar4 == (uint)*(ushort *)(param_1 + 0x24)) goto LAB_00409f57;
          psVar4 = psVar4 + 1;
          iVar3 = iVar3 + 1;
        } while (iVar3 < 6);
        puVar2 = puVar2->next_unit;
      } while (puVar2 != (unit_struct *)0x0);
LAB_00409f57:
      if (puVar2 != (unit_struct *)0x0) {
        remove_person_from_hut(puVar2,param_1);
        return;
      }
    }
  }
  else if (unit_land_array[uVar1]->unit_class == '\x02') {
    remove_person_from_hut(unit_land_array[uVar1],param_1);
  }
  return;
}
