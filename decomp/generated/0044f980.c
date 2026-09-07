/* Ghidra 12.1.3 pseudocode; entry 0044f980; FUN_0044f980.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


uint FUN_0044f980(ushort *param_1)

{
  uint uVar1;
  undefined2 local_2;

  local_2 = CONCAT11((char)(param_1[1] >> 8),(char)(*param_1 >> 8));
  uVar1 = (uint)((&game_state.level_data[0].c_3)[((local_2 & 0xfe) * 2 | local_2 & 0xfe00) * 4] &
                0xf);
  if ((*(byte *)(landscape_height_array + uVar1) & 1) != 0) {
    return 1;
  }
  if ((*(byte *)(landscape_height_array + uVar1) & 0x3c) != 0) {
    return (uint)*(byte *)(((int)(0xff - (uint)((param_1[1] & 0x1fe) >> 1)) >> 5) + 0x5aa32e +
                          uVar1 * 0xe) & 1 << (7 - ((byte)(*param_1 >> 6) & 7) & 0x1f);
  }
  return 0;
}
