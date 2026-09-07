/* Ghidra 12.1.3 pseudocode; entry 004d3ff0; FUN_004d3ff0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_004d3ff0(int param_1,short param_2)

{
  if ((*(uint *)(param_1 + 0xc) & 0x80000) != 0) {
    if ((*(byte *)(param_1 + 0x11) & 4) == 0) {
      *(uint *)(param_1 + 0xc) = *(uint *)(param_1 + 0xc) & 0xffff7fff;
      param_2 = 2;
    }
    else {
      param_2 = 0xc;
    }
  }
  unit_set_object_upper
            (param_1,CONCAT22((short)((uint)(param_2 * 9) >> 0x10),
                              unit_type_to_obj_indexes_map
                              [(uint)*(byte *)(param_1 + 0x2b) + param_2 * 9]));
  return;
}
