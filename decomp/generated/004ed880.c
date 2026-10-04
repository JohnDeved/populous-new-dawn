/* Ghidra 12.1.3 pseudocode; entry 004ed880; FUN_004ed880.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_004ed880(void)

{
  undefined *puVar1;
  int iVar2;

  iVar2 = 0;
  puVar1 = &DAT_008e0428;
  do {
    *(short *)(puVar1 + 0x24) = (short)iVar2;
    puVar1 = puVar1 + 0xb3;
    iVar2 = iVar2 + 1;
  } while (iVar2 < 2000);
  return;
}
