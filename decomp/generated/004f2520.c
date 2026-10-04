/* Ghidra 12.1.3 pseudocode; entry 004f2520; FUN_004f2520.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_004f2520(int param_1,uint param_2)

{
  int iVar1;

  for (iVar1 = *(int *)(param_1 + 0x881); iVar1 != 0; iVar1 = *(int *)(iVar1 + 8)) {
    if (*(byte *)(iVar1 + 0xaf) == param_2) {
      *(undefined1 *)(iVar1 + 0xaf) = 0;
      *(byte *)(iVar1 + 0x7f) = *(byte *)(iVar1 + 0x7f) & 0xfe;
      *(uint *)(iVar1 + 0x14) = *(uint *)(iVar1 + 0x14) & 0xffffdfff;
    }
  }
  return;
}
