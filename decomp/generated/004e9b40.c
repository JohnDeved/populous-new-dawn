/* Ghidra 12.1.3 pseudocode; entry 004e9b40; FUN_004e9b40.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_004e9b40(int param_1)

{
  uint uVar1;

  uVar1 = *(uint *)(param_1 + 0xc);
  *(uint *)(param_1 + 0xc) = uVar1 & 0xfffff7ff;
  uVar1 = uVar1 & 0xdffff7ff;
  *(uint *)(param_1 + 0xc) = uVar1;
  *(uint *)(param_1 + 0xc) = uVar1 | 0x1000;
  *(undefined2 *)(param_1 + 0x61) = 0;
  *(undefined1 *)(param_1 + 0x66) = 0;
  return;
}
