/* Ghidra 12.1.3 pseudocode; entry 00436ca0; FUN_00436ca0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_00436ca0(int param_1)

{
  int iVar1;

  iVar1 = 0;
  *(undefined1 *)(param_1 + 0xa6) = 0;
  do {
    if (*(short *)(param_1 + 0x8b + iVar1 * 2) != 0) {
      FUN_004364d0(param_1,iVar1);
    }
    iVar1 = iVar1 + 1;
  } while (iVar1 < 8);
  if (*(short *)(param_1 + 0x9b) != 0) {
    FUN_004364d0(param_1,0xffffffff);
  }
  *(uint *)(param_1 + 0xc) = *(uint *)(param_1 + 0xc) & 0xf7ffffff;
  *(uint *)(param_1 + 0x10) = *(uint *)(param_1 + 0x10) & 0xfffffdff;
  return;
}
