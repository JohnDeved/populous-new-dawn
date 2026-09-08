/* Ghidra 12.1.3 pseudocode; entry 0041b5e0; FUN_0041b5e0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


int FUN_0041b5e0(void)

{
  int iVar1;
  int iVar2;
  int iVar3;

  iVar1 = 0;
  iVar2 = 0x89d1c8;
  iVar3 = 4;
  do {
    if ((*(char *)(iVar2 + 0xc20) != '\0') && (*(int *)(iVar2 + 0x949) == 0)) {
      iVar1 = iVar1 + 1;
    }
    iVar2 = iVar2 + 0xc65;
    iVar3 = iVar3 + -1;
  } while (iVar3 != 0);
  return iVar1;
}
