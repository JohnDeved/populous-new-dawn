/* Ghidra 12.1.3 pseudocode; entry 00432520; FUN_00432520.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_00432520(undefined4 param_1,undefined2 *param_2)

{
  uint uVar1;
  undefined2 local_2;

  local_2 = CONCAT11((char)((ushort)param_2[1] >> 8),(char)((ushort)*param_2 >> 8));
  uVar1 = (local_2 & 0xfe) * 2 | local_2 & 0xfe00;
  if ((*(byte *)((int)&game_state.level_data[0].flags + uVar1 * 4 + 1) & 2) != 0) {
    FUN_004044b0(unit_land_array
                 [(ushort)(&game_state.level_data[0].unit_index_2)[uVar1 * 2] & 0x3ff],param_2);
  }
  return;
}
