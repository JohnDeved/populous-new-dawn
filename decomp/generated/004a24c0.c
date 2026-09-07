/* Ghidra 12.1.3 pseudocode; entry 004a24c0; draw_ingame_window.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void draw_ingame_window(int param_1,int param_2,int param_3,int param_4,undefined1 param_5)

{
  int *piStack_1c;
  undefined *puStack_18;
  undefined1 *local_14;
  int local_10;
  int local_c;
  int local_8;
  int local_4;

  local_c = param_2 + -4;
  local_4 = param_4 + param_2 + 3;
  local_10 = param_1 + -4;
  local_14 = (undefined1 *)&piStack_1c;
  local_8 = param_3 + param_1 + 3;
  set_indexed_value_from_system_palette(param_5);
  add_vertex_ghost_index(&local_10);
  piStack_1c = &local_10;
  puStack_18 = &DAT_005caae8;
  draw_hfx_ingame_window();
  return;
}
