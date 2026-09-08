/* Ghidra 12.1.3 pseudocode; entry 00445c20; FUN_00445c20.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_00445c20(int param_1)

{
  undefined2 uVar1;

  uVar1 = calc_point_height(*(undefined2 *)(param_1 + 0x3d),*(undefined2 *)(param_1 + 0x3f));
  *(undefined2 *)(param_1 + 0x41) = uVar1;
  *(uint *)(param_1 + 0x10) = *(uint *)(param_1 + 0x10) & 0xfffffbff;
  return;
}
