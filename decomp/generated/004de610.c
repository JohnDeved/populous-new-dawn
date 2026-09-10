/* Ghidra 12.1.3 pseudocode; entry 004de610; FUN_004de610.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


undefined1 FUN_004de610(int param_1)

{
  undefined1 uVar1;
  uint uVar2;
  undefined2 local_2;

  uVar1 = 0;
  if ((*(byte *)(param_1 + 0xe) & 0x80) != 0) {
    local_2 = CONCAT11((char)((ushort)*(undefined2 *)(param_1 + 0x3f) >> 8),
                       (char)((ushort)*(undefined2 *)(param_1 + 0x3d) >> 8));
    uVar2 = (local_2 & 0xfe) * 2 | local_2 & 0xfe00;
    if ((((*(byte *)((int)&game_state.level_data[0].flags + uVar2 * 4 + 1) & 2) != 0) &&
        (unit_land_array[(ushort)(&game_state.level_data[0].unit_index_2)[uVar2 * 2] & 0x3ff]->
         unit_type == '\x04')) &&
       (unit_land_array[(ushort)(&game_state.level_data[0].unit_index_2)[uVar2 * 2] & 0x3ff]->state
        == '\x02')) {
      uVar1 = 1;
    }
  }
  return uVar1;
}
