/* Ghidra 12.1.3 pseudocode; entry 004358f0; FUN_004358f0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_004358f0(void)

{
  char cVar1;
  int iVar2;
  int iVar3;
  char cVar4;

  iVar2 = (int)player_tribe_num;
  (&DAT_00895e03)[*(char *)((int)game_state.tribes_array[iVar2].field1341_0x8bf + 1) * 0x10] =
       (&DAT_00895e03)[*(char *)((int)game_state.tribes_array[iVar2].field1341_0x8bf + 1) * 0x10] |
       2;
  cVar1 = *(char *)game_state.tribes_array[iVar2].field1341_0x8bf + '\x01';
  *(char *)game_state.tribes_array[iVar2].field1341_0x8bf = cVar1;
  if ('\b' < cVar1) {
    *(undefined1 *)game_state.tribes_array[iVar2].field1341_0x8bf = 8;
  }
  iVar3 = (int)player_tribe_num;
  cVar1 = *(char *)game_state.tribes_array[iVar3].field1341_0x8bf;
  if (cVar1 < '\0') {
    cVar1 = '\0';
  }
  if ('\a' < cVar1) {
    cVar1 = '\a';
  }
  cVar4 = *(char *)((int)game_state.tribes_array[iVar3].field1341_0x8bf + 1) + '\x01';
  *(char *)((int)game_state.tribes_array[iVar3].field1341_0x8bf + 1) = cVar4;
  if (cVar1 < cVar4) {
    *(undefined1 *)((int)game_state.tribes_array[iVar3].field1341_0x8bf + 1) = 0;
  }
  iVar2 = (int)*(char *)((int)game_state.tribes_array[iVar2].field1341_0x8bf + 1);
  if (((&DAT_00895e03)[iVar2 * 0x10] & 1) != 0) {
    FUN_004199b0(&DAT_00895df6 + iVar2 * 4);
  }
  return;
}
