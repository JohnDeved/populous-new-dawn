/* Ghidra 12.1.3 pseudocode; entry 00462770; FUN_00462770.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_00462770(int param_1)

{
  uint uVar1;

  uVar1 = *(uint *)(param_1 + 0x3e);
  *(uint *)(param_1 + 0x3e) = uVar1 & 0xfffffffe;
  *(uint *)(param_1 + 0x3e) = uVar1 & 0xfffffffc;
  return;
}
