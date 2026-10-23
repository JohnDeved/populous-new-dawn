/* Ghidra 12.1.3 pseudocode; entry 00435c10; FUN_00435c10.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_00435c10(int param_1)

{
  int iVar1;
  byte bVar2;

  for (iVar1 = *(int *)(param_1 + 0x881); iVar1 != 0; iVar1 = *(int *)(iVar1 + 8)) {
    bVar2 = *(byte *)(iVar1 + 0x7a);
    if ((bVar2 & 0x80) == 0) {
      bVar2 = bVar2 & 0xfe;
    }
    else {
      bVar2 = bVar2 | 1;
    }
    *(byte *)(iVar1 + 0x7a) = bVar2;
  }
  return;
}
