/* Ghidra 12.1.3 pseudocode; entry 0041b330; FUN_0041b330.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


int FUN_0041b330(int param_1)

{
  int iVar1;

  iVar1 = (int)*(short *)(param_1 + 0xb7f) * (int)(short)unit_type_array_building[1]._58_2_ +
          (int)*(short *)(param_1 + 0xb81) * (int)(short)unit_type_array_building[2]._58_2_ +
          (int)*(short *)(param_1 + 0xb83) * (int)(short)unit_type_array_building[3]._58_2_ +
          *(int *)(param_1 + 0x921);
  if (200 < iVar1) {
    iVar1 = 200;
  }
  return iVar1;
}
