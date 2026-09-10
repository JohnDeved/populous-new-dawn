/* Ghidra 12.1.3 pseudocode; entry 00502060; FUN_00502060.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_00502060(int param_1)

{
  short *psVar1;
  int iVar2;

  iVar2 = 0;
  psVar1 = (short *)(param_1 + 0x6a);
  do {
    if (*psVar1 == 0) break;
    psVar1 = psVar1 + 1;
    iVar2 = iVar2 + 1;
  } while (iVar2 < 0xc);
  *(char *)(param_1 + 0x69) = (char)iVar2;
  return;
}
