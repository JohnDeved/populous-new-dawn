/* Ghidra 12.1.3 pseudocode; entry 004655f0; FUN_004655f0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


int FUN_004655f0(undefined2 *param_1)

{
  undefined2 local_2;

  local_2 = CONCAT11((char)((ushort)param_1[1] >> 8),(char)((ushort)*param_1 >> 8));
  return (int)(char)landscape_height_array
                    [(&game_state.level_data[0].c_3)[((local_2 & 0xfe) * 2 | local_2 & 0xfe00) * 4]
                     & 0xf].field_0x1;
}
