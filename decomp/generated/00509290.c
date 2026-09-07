/* Ghidra 12.1.3 pseudocode; entry 00509290; FUN_00509290.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_00509290(int param_1)

{
  char cVar1;
  short local_2;

  cVar1 = FUN_005092e0(param_1);
  if ((cVar1 != '\0') && ((*(byte *)(param_1 + 0x16) & 0x80) == 0)) {
    cVar1 = FUN_00504060(param_1,&local_2);
    if (cVar1 != '\0') {
      *(uint *)(param_1 + 0x14) = *(uint *)(param_1 + 0x14) | 0x800000;
      (&DAT_00895fbb)[local_2 * 0x9e] = 1;
    }
  }
  return;
}
