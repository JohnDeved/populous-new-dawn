/* Ghidra 12.1.3 pseudocode; entry 004d1450; FUN_004d1450.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_004d1450(int param_1)

{
  byte bVar1;
  int iVar2;
  int iVar3;
  int iVar4;
  byte *pbVar5;
  undefined1 *puVar6;

  iVar2 = tribe_get_shaman(param_1);
  if (iVar2 != 0) {
    pbVar5 = (byte *)(param_1 + 0x4ce);
    iVar4 = 8;
    iVar3 = FUN_004f2f50(param_1,iVar2);
    do {
      pbVar5[1] = 0;
      bVar1 = *pbVar5;
      if ((bVar1 != 0) &&
         (*(int *)((int)&DAT_005a80d4 + (uint)bVar1 * 0x3e) + *(int *)(pbVar5 + -8) + iVar3 <=
          *(int *)(param_1 + 0x94d))) {
        bVar1 = FUN_004c2e00(iVar2,bVar1);
        pbVar5[1] = bVar1;
      }
      pbVar5 = pbVar5 + 0xc;
      iVar4 = iVar4 + -1;
    } while (iVar4 != 0);
    return;
  }
  puVar6 = (undefined1 *)(param_1 + 0x4cf);
  iVar2 = 8;
  do {
    *puVar6 = 0;
    puVar6 = puVar6 + 0xc;
    iVar2 = iVar2 + -1;
  } while (iVar2 != 0);
  return;
}
