/* Ghidra 12.1.3 pseudocode; entry 00436c20; FUN_00436c20.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


int FUN_00436c20(void)

{
  bool bVar1;
  int iVar2;
  int iVar3;
  undefined1 *puVar4;

  iVar3 = 0;
  iVar2 = 0;
  bVar1 = false;
  puVar4 = (undefined1 *)
           ((int)(game_state.sunlight_array + 0x32) + (short)game_state._841984_2_ * 10);
  while( true ) {
    if (&game_state.field_0x9d5f7 < puVar4) {
      puVar4 = &game_state.field_0x9b6c2;
    }
    if (*(short *)(puVar4 + 2) == 0) break;
    iVar3 = iVar3 + 1;
    puVar4 = puVar4 + 10;
    if (799 < iVar3) {
LAB_00436c62:
      if (bVar1) {
        puVar4[1] = 0;
        *puVar4 = 0;
        iVar2 = (int)(puVar4 + -0x938830) / 10;
        *(undefined2 *)(puVar4 + 4) = 0;
        game_state._841984_2_ = (short)iVar2 + 1;
        if (799 < (short)game_state._841984_2_) {
          game_state._841984_2_ = 1;
        }
      }
      return iVar2;
    }
  }
  bVar1 = true;
  goto LAB_00436c62;
}
