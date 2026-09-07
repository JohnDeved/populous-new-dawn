/* Ghidra 12.1.3 pseudocode; entry 004d31f0; FUN_004d31f0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_004d31f0(int param_1)

{
  ushort uVar1;

  uVar1 = (*(short *)(param_1 + 0x78) == 0) - 1 & 4;
  if (((*(uint *)(param_1 + 0xc) & 0x80000) != 0) &&
     (uVar1 = 0xc, (*(byte *)(param_1 + 0x11) & 4) == 0)) {
    uVar1 = 2;
    *(uint *)(param_1 + 0xc) = *(uint *)(param_1 + 0xc) & 0xffff7fff;
  }
  unit_set_object_upper
            (param_1,unit_type_to_obj_indexes_map
                     [(uint)*(byte *)(param_1 + 0x2b) + (short)uVar1 * 9]);
  return;
}
