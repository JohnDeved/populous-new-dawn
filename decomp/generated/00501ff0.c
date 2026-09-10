/* Ghidra 12.1.3 pseudocode; entry 00501ff0; FUN_00501ff0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_00501ff0(int param_1,byte param_2)

{
  int iVar1;
  short *psVar2;
  short *psVar3;
  int iVar4;

  iVar4 = 0;
  psVar2 = (short *)(param_1 + 0x6a + (uint)param_2 * 2);
  do {
    psVar3 = psVar2;
    iVar1 = iVar4;
    if (*psVar2 == 0) {
      do {
        iVar1 = iVar1 + 1;
        if (3 < iVar1) goto LAB_0050202f;
        psVar3 = psVar3 + 3;
      } while (*psVar3 == 0);
      *psVar2 = *psVar3;
      *psVar3 = 0;
    }
LAB_0050202f:
    iVar4 = iVar4 + 1;
    psVar2 = psVar2 + 3;
  } while (iVar4 < 4);
  iVar4 = 0;
  psVar2 = (short *)(param_1 + 0x6a);
  do {
    if (*psVar2 == 0) break;
    psVar2 = psVar2 + 1;
    iVar4 = iVar4 + 1;
  } while (iVar4 < 0xc);
  *(char *)(param_1 + 0x69) = (char)iVar4;
  return;
}
