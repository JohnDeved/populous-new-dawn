/* Ghidra 12.1.3 pseudocode; entry 004f2f50; FUN_004f2f50.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


int FUN_004f2f50(undefined4 param_1,int param_2)

{
  int iVar1;
  byte bVar2;
  int iVar3;
  int iVar4;

  iVar3 = 0;
  if (*(byte *)(param_2 + 0xaf) != 0) {
    iVar1 = *(char *)(param_2 + 0x2f) * 0xc65 + 0x89d1ac + (uint)*(byte *)(param_2 + 0xaf) * 0x52;
    if (*(char *)(iVar1 + 0x4f) == '\x14') {
      iVar4 = 0;
      do {
        bVar2 = *(byte *)(iVar1 + 0x1f + iVar4);
        if (bVar2 != 0) {
          iVar3 = iVar3 + *(int *)((int)&DAT_005a80d4 + (uint)bVar2 * 0x3e);
        }
        iVar4 = iVar4 + 1;
      } while (iVar4 < 3);
    }
  }
  return iVar3;
}
