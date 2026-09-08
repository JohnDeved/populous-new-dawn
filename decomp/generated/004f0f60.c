/* Ghidra 12.1.3 pseudocode; entry 004f0f60; FUN_004f0f60.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_004f0f60(int param_1)

{
  byte bVar1;

  bVar1 = *(char *)(param_1 + 0x39) + 1;
  *(byte *)(param_1 + 0x39) = bVar1;
  if ((int)anibl0_mem[1].max_counter <= (int)(uint)bVar1) {
    *(undefined1 *)(param_1 + 0x39) = 0;
  }
  return;
}
