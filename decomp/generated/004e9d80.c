/* Ghidra 12.1.3 pseudocode; entry 004e9d80; FUN_004e9d80.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_004e9d80(int param_1,undefined4 *param_2)

{
  uint uVar1;
  undefined4 local_4;

  local_4 = *param_2;
  FUN_004ec3f0(param_1,&local_4);
  FUN_004e9e80(param_1,&local_4);
  *(undefined4 *)(param_1 + 0x57) = *(undefined4 *)(param_1 + 0x53);
  uVar1 = *(uint *)(param_1 + 0xc);
  *(uint *)(param_1 + 0xc) = uVar1 | 0x1000;
  *(uint *)(param_1 + 0xc) = uVar1 & 0xffffff7f | 0x1000;
  return;
}
