/* Ghidra 12.1.3 pseudocode; entry 004756a0; FUN_004756a0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_004756a0(undefined4 param_1,int param_2)

{
  undefined1 *puVar1;
  int iVar2;
  int iVar3;
  undefined4 *puVar4;

  puVar1 = DAT_0075d508;
  iVar2 = 0xfffffff;
  if (DAT_0075d508 < DAT_0075d504) {
    puVar4 = &DAT_0074daf8;
    iVar3 = (int)*(short *)(param_2 + 4);
    if (0 < iVar3) {
      do {
        if ((int)puVar4[2] < iVar2) {
          iVar2 = puVar4[2];
        }
        puVar4 = puVar4 + 8;
        iVar3 = iVar3 + -1;
      } while (iVar3 != 0);
    }
    iVar2 = iVar2 + 0x6f9c;
    DAT_0075d508 = DAT_0075d508 + 10;
    if (iVar2 < 0x40) {
      iVar2 = 0;
    }
    else {
      iVar2 = (int)(iVar2 + (iVar2 >> 0x1f & 0xfU)) >> 4;
      if (0xe00 < iVar2) {
        iVar2 = 0xe00;
      }
    }
    *(undefined4 *)(puVar1 + 2) = (&DAT_0075d50c)[iVar2];
    (&DAT_0075d50c)[iVar2] = puVar1;
    *puVar1 = 0x16;
    *(undefined4 *)(puVar1 + 6) = param_1;
  }
  return;
}
