/* Ghidra 12.1.3 pseudocode; entry 0042c130; clear_landscape_c_3.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void clear_landscape_c_3(void)

{
  int iVar1;
  int iVar2;

  iVar1 = 0x8a03e4;
  iVar2 = 0x4000;
  do {
    *(undefined1 *)(iVar1 + 0xc) = 0;
    iVar1 = iVar1 + 0x10;
    iVar2 = iVar2 + -1;
  } while (iVar2 != 0);
  return;
}
