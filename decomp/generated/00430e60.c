/* Ghidra 12.1.3 pseudocode; entry 00430e60; FUN_00430e60.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_00430e60(char param_1,undefined2 *param_2,undefined2 param_3)

{
  int iVar1;
  ushort local_2;

  iVar1 = (int)param_1;
  if (((&DAT_0059cb10)[(char)global_struct_45B_ARRAY_00683b92[iVar1].field_0x20 * 0x1c] & 0x40) != 0
     ) {
    global_struct_45B_ARRAY_00683b92[iVar1].field24_0x21 =
         global_struct_45B_ARRAY_00683b92[iVar1].field24_0x21 | 0x20;
    local_2 = CONCAT11((char)((ushort)game_state.tribes_array[player_tribe_num].y >> 8),
                       (char)((ushort)game_state.tribes_array[player_tribe_num].x >> 8)) & 0xfefe;
    global_struct_45B_ARRAY_00683b92[iVar1].field17_0x18 = local_2;
    global_struct_45B_ARRAY_00683b92[iVar1].field18_0x1a =
         game_state.tribes_array[player_tribe_num].angle_1;
    local_2 = CONCAT11((char)((ushort)param_2[1] >> 8),(char)((ushort)*param_2 >> 8)) & 0xfefe;
    global_struct_45B_ARRAY_00683b92[iVar1].field15_0x14 = local_2;
    global_struct_45B_ARRAY_00683b92[iVar1].field16_0x16 = param_3;
  }
  return;
}
