/* Ghidra 12.1.3 pseudocode; entry 00516810; FUN_00516810.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_00516810(int param_1,int param_2,int param_3,undefined4 param_4,undefined4 param_5)

{
  int iStack_10;
  int iStack_c;
  int iStack_8;
  int iStack_4;

  iStack_10 = param_1;
  iStack_8 = param_1 + 1;
  iStack_c = param_2;
  iStack_4 = param_2 + param_3 + 1;
  if (((byte)vertices_flags & 4) != 0) {
    FUN_005168e0();
    return;
  }
  add_vertex_ghost_index(&iStack_10,param_4,param_5);
  return;
}
