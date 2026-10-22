/* Ghidra 12.1.3 pseudocode; entry 00435c40; FUN_00435c40.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_00435c40(int param_1)

{
  int iVar1;
  int iVar2;

  for (iVar1 = *(int *)(param_1 + 0x881); iVar1 != 0; iVar1 = *(int *)(iVar1 + 8)) {
    if ((*(byte *)(iVar1 + 0x7a) & 0x80) != 0) {
      iVar2 = 0;
      *(undefined1 *)(iVar1 + 0xa6) = 0;
      do {
        if (*(short *)(iVar1 + 0x8b + iVar2 * 2) != 0) {
          FUN_004364d0(iVar1,iVar2);
        }
        iVar2 = iVar2 + 1;
      } while (iVar2 < 8);
      if (*(short *)(iVar1 + 0x9b) != 0) {
        FUN_004364d0(iVar1,0xffffffff);
      }
      *(uint *)(iVar1 + 0xc) = *(uint *)(iVar1 + 0xc) & 0xf7ffffff;
      *(uint *)(iVar1 + 0x10) = *(uint *)(iVar1 + 0x10) & 0xfffffdff;
    }
  }
  return;
}
