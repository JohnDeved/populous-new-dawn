/* Ghidra 12.1.3 pseudocode; entry 004d50d0; FUN_004d50d0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_004d50d0(int param_1)

{
  short sVar1;

  sVar1 = 6;
  *(undefined2 *)(param_1 + 0x5f) = 0;
  if (((*(uint *)(param_1 + 0xc) & 0x80000) != 0) &&
     (sVar1 = 0xc, (*(byte *)(param_1 + 0x11) & 4) == 0)) {
    sVar1 = 2;
    *(uint *)(param_1 + 0xc) = *(uint *)(param_1 + 0xc) & 0xffff7fff;
  }
  unit_set_object_upper
            (param_1,unit_type_to_obj_indexes_map[(uint)*(byte *)(param_1 + 0x2b) + sVar1 * 9]);
  return;
}
