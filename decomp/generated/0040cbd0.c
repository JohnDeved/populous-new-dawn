/* Ghidra 12.1.3 pseudocode; entry 0040cbd0; FUN_0040cbd0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_0040cbd0(int param_1)

{
  ushort uVar1;

  uVar1 = *(ushort *)(param_1 + 0x35);
  *(ushort *)(param_1 + 0x35) = uVar1 | 0x400;
  *(ushort *)(param_1 + 0x35) = uVar1 & 0xf7ff | 0x400;
  return;
}
