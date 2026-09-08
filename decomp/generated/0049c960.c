/* Ghidra 12.1.3 pseudocode; entry 0049c960; FUN_0049c960.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_0049c960(void)

{
  int local_8;
  int local_4;

  if (render_var_1 != '\0') {
    render_var_1 = '\0';
    screen_coord_2_x = screen_coord_1_x;
    render_var_flag_1 = '\x01';
    screen_coord_3_x = (uint)screen_coord_1_x;
    screen_coord_2_y = screen_coord_1_y;
    screen_coord_3_y = (uint)screen_coord_1_y;
  }
  if (render_var_flag_1 != '\0') {
    render_var_flag_1 = '\0';
    local_8 = (int)(short)screen_coord_2_x;
    local_4 = (int)(short)screen_coord_2_y;
    FUN_00526de0(&local_8);
  }
  return;
}
