/* Ghidra 12.1.3 pseudocode; entry 005092e0; FUN_005092e0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


uint FUN_005092e0(int param_1)

{
  char cVar1;
  uint in_EAX;
  uint uVar2;
  int3 iVar3;
  unit_struct *puVar4;
  undefined2 local_2;

  uVar2 = in_EAX & 0xffffff00;
  cVar1 = *(char *)(param_1 + 0x2a);
  iVar3 = (int3)(player_tribe_num >> 7);
  if (cVar1 == '\x02') {
    if (*(char *)(param_1 + 0x2b) == '\x12') {
      local_2 = CONCAT11((char)((ushort)*(undefined2 *)(param_1 + 0x3f) >> 8),
                         (char)((ushort)*(undefined2 *)(param_1 + 0x3d) >> 8));
      for (puVar4 = unit_land_array
                    [(short)(&game_state.level_data[0].unit_index)
                            [((local_2 & 0xfe) * 2 | local_2 & 0xfe00) * 2]];
          puVar4 != (unit_struct *)0x0; puVar4 = unit_land_array[puVar4->next_unit_index]) {
        if ((puVar4->unit_class == '\x06') && (puVar4->unit_type == '\x06')) goto LAB_00509395;
      }
      puVar4 = (unit_struct *)0x0;
LAB_00509395:
      if (puVar4 != (unit_struct *)0x0) {
        return CONCAT31(iVar3,*(undefined1 *)(&puVar4->loc_3_x + player_tribe_num));
      }
    }
    else if (*(char *)(param_1 + 0x2f) == player_tribe_num) {
      return CONCAT31((int3)(CONCAT22((short)(in_EAX >> 0x10),*(undefined2 *)(param_1 + 0x9c)) >> 8)
                      ,(char)*(undefined2 *)(param_1 + 0x9c)) & 0xffffff80;
    }
  }
  else if (cVar1 == '\x05') {
    local_2 = CONCAT11((char)((ushort)*(undefined2 *)(param_1 + 0x3f) >> 8),
                       (char)((ushort)*(undefined2 *)(param_1 + 0x3d) >> 8));
    for (puVar4 = unit_land_array
                  [(short)(&game_state.level_data[0].unit_index)
                          [((local_2 & 0xfe) * 2 | local_2 & 0xfe00) * 2]];
        puVar4 != (unit_struct *)0x0; puVar4 = unit_land_array[puVar4->next_unit_index]) {
      if ((puVar4->unit_class == '\x06') && (puVar4->unit_type == '\x06')) goto LAB_00509413;
    }
    puVar4 = (unit_struct *)0x0;
LAB_00509413:
    if (puVar4 != (unit_struct *)0x0) {
      return CONCAT31(iVar3,*(undefined1 *)(&puVar4->loc_3_x + player_tribe_num));
    }
  }
  else {
    if (cVar1 != '\x06') {
      return uVar2;
    }
    uVar2 = CONCAT31(iVar3,*(undefined1 *)(param_1 + 0x86 + player_tribe_num * 2));
  }
  return uVar2;
}
