/* Ghidra 12.1.3 pseudocode; entry 00516890; FUN_00516890.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_00516890(undefined4 param_1,undefined4 param_2,undefined4 param_3)

{
  if (((byte)vertices_flags & 4) != 0) {
    FUN_005168e0();
    return;
  }
  add_vertex_ghost_index(param_1,param_2,param_3);
  return;
}
