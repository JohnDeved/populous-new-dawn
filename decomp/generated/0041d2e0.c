/* Ghidra 12.1.3 pseudocode; entry 0041d2e0; set_globe_coord_centre.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void set_globe_coord_centre(byte param_1,byte param_2)

{
  undefined2 local_2;

  FUN_00417470();
  DAT_005fe434 = (int)DAT_0089d172;
  DAT_005fe428 = (int)(DAT_005fe434 * 4 + (DAT_005fe434 * 4 >> 0x1f & 7U)) >> 3;
  if (DAT_005fe428 < 6) {
    DAT_005fe428 = 6;
  }
  local_2 = CONCAT11((char)((ushort)game_state.tribes_array[player_tribe_num].y >> 8),
                     (char)((ushort)game_state.tribes_array[player_tribe_num].x >> 8)) & 0xfefe;
  globe_coord_centre_x = (uint)(byte)local_2 - (uint)param_1;
  if (0x80 < globe_coord_centre_x) {
    globe_coord_centre_x = globe_coord_centre_x + -0x100;
  }
  if (globe_coord_centre_x < -0x80) {
    globe_coord_centre_x = globe_coord_centre_x + 0x100;
  }
  globe_coord_centre_y = (uint)local_2._1_1_ - (uint)param_2;
  if (0x80 < globe_coord_centre_y) {
    globe_coord_centre_y = globe_coord_centre_y + -0x100;
  }
  if (globe_coord_centre_y < -0x80) {
    globe_coord_centre_y = globe_coord_centre_y + 0x100;
  }
  globe_coord_centre_x = (globe_coord_centre_x * -0x100) / DAT_005fe434;
  globe_coord_centre_y = (globe_coord_centre_y * -0x100) / DAT_005fe434;
  return;
}
