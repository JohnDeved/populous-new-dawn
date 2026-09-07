/* Ghidra 12.1.3 pseudocode; entry 0043b120; FUN_0043b120.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


undefined1 FUN_0043b120(int param_1)

{
  uint uVar1;
  int iVar2;
  ushort *puVar3;

  iVar2 = 0;
  uVar1 = (uint)*(byte *)(param_1 + 0xa6);
  puVar3 = (ushort *)(param_1 + 0x8d + uVar1 * 2);
  while( true ) {
    uVar1 = uVar1 + 1;
    if (7 < (int)uVar1) {
      return 0;
    }
    if ((*puVar3 != 0) &&
       ((*(byte *)((int)(game_state.sunlight_array + 0x32) + (uint)*puVar3 * 10 + 1) & 1) == 0))
    break;
    iVar2 = iVar2 + 1;
    puVar3 = puVar3 + 1;
    if (7 < iVar2) {
      return 0;
    }
  }
  return 1;
}
