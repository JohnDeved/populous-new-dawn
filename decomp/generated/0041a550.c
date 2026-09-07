/* Ghidra 12.1.3 pseudocode; entry 0041a550; FUN_0041a550.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_0041a550(void)

{
  int iVar1;
  int iVar2;

  iVar1 = 0x89d1c8;
  iVar2 = 4;
  do {
    if ((*(int *)(iVar1 + 0x949) == 0) && (*(char *)(iVar1 + 0xc20) != '\0')) {
      FUN_0041a590(iVar1);
    }
    iVar1 = iVar1 + 0xc65;
    iVar2 = iVar2 + -1;
  } while (iVar2 != 0);
  return;
}
