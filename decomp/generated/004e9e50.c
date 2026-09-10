/* Ghidra 12.1.3 pseudocode; entry 004e9e50; FUN_004e9e50.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_004e9e50(int param_1,undefined4 *param_2)

{
  uint uVar1;

  uVar1 = *(uint *)(param_1 + 0xc);
  *(undefined4 *)(param_1 + 0x57) = *param_2;
  *(uint *)(param_1 + 0xc) = uVar1 | 0x1000;
  *(uint *)(param_1 + 0xc) = uVar1 & 0xffffff7f | 0x1000;
  return;
}
