/* Ghidra 12.1.3 pseudocode; entry 00418d70; FUN_00418d70.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


int FUN_00418d70(int param_1)

{
  int iVar1;
  int iVar2;

  iVar2 = 0;
  for (iVar1 = *(int *)(param_1 + 0x881); iVar1 != 0; iVar1 = *(int *)(iVar1 + 8)) {
    if ((*(byte *)(iVar1 + 0x7a) & 0x80) != 0) {
      iVar2 = iVar2 + 1;
    }
  }
  return iVar2;
}
