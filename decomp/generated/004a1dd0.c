/* Ghidra 12.1.3 pseudocode; entry 004a1dd0; FUN_004a1dd0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_004a1dd0(int param_1,undefined4 param_2,undefined4 param_3,undefined4 param_4)

{
  undefined4 local_10;
  undefined4 local_c;
  undefined4 local_8;
  undefined4 local_4;

  local_4 = 0;
  local_8 = 0;
  local_c = 0;
  local_10 = 0;
  local_10 = parameterize_by_screen_width(*(undefined4 *)(param_1 + 0x37));
  local_c = parameterize_by_screen_height(*(undefined4 *)(param_1 + 0x3b));
  local_8 = parameterize_by_screen_width(*(int *)(param_1 + 0x47) + *(int *)(param_1 + 0x37));
  local_4 = parameterize_by_screen_height(*(int *)(param_1 + 0x4b) + *(int *)(param_1 + 0x3b));
  if (*(int *)(param_1 + 0x10) != 0) {
    if (*(int *)(param_1 + 8) == 0) {
      vertices_flags = vertices_flags | 8;
    }
    else {
      vertices_flags = vertices_flags & 0xfffffff7;
    }
    if (((*(int *)(param_1 + 0x18) == 0) && (*(int *)(param_1 + 0x1c) == 0)) &&
       (param_3 = param_2, *(int *)(param_1 + 0xc) != 0)) {
      param_3 = param_4;
    }
    draw_hfx_ingame_window(&local_10,param_3);
  }
  vertices_flags = vertices_flags & 0xfffffff7;
  return;
}
