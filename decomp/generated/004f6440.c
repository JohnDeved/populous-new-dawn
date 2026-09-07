/* Ghidra 12.1.3 pseudocode; entry 004f6440; FUN_004f6440.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_004f6440(int param_1,int param_2)

{
  if (((param_2 - param_1) + -0x36) / 0x52 == (uint)*(byte *)(param_1 + 0x5b3)) {
    *(uint *)(param_1 + 0x596) = *(uint *)(param_1 + 0x596) & 0xfffffffd;
    *(undefined1 *)(param_1 + 0x5b3) = 10;
  }
  return;
}
