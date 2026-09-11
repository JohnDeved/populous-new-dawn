/* Ghidra 12.1.3 pseudocode; entry 00436be0; FUN_00436be0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


undefined1 FUN_00436be0(int param_1)

{
  int iVar1;
  uint uVar2;

  iVar1 = 0;
  uVar2 = (uint)*(byte *)(param_1 + 0xa6);
  while( true ) {
    if (7 < (int)uVar2) {
      uVar2 = 0;
    }
    if (*(short *)(param_1 + 0x8b + uVar2 * 2) == 0) break;
    iVar1 = iVar1 + 1;
    uVar2 = uVar2 + 1;
    if (7 < iVar1) {
      return 0xff;
    }
  }
  return (char)uVar2;
}
