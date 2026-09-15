/* Ghidra 12.1.3 pseudocode; entry 00465580; FUN_00465580.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


uint FUN_00465580(undefined2 *param_1,ushort param_2)

{
  undefined2 local_2;

  local_2 = CONCAT11((char)((ushort)param_1[1] >> 8),(char)((ushort)*param_1 >> 8));
  if ((char)landscape_height_array
            [(&game_state.level_data[0].c_3)[((local_2 & 0xfe) * 2 | local_2 & 0xfe00) * 4] & 0xf].
            field_0x1 < 0) {
    return param_2 & 0x7ff;
  }
  return ((int)(char)landscape_height_array
                     [(&game_state.level_data[0].c_3)[((local_2 & 0xfe) * 2 | local_2 & 0xfe00) * 4]
                      & 0xf].field_0x1 + 4U & 7) << 8;
}
