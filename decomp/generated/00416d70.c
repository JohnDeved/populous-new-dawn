/* Ghidra 12.1.3 pseudocode; entry 00416d70; FUN_00416d70.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


byte FUN_00416d70(int param_1,int param_2)

{
  byte bVar1;
  byte bVar2;

  bVar1 = *(byte *)(param_2 + 0x2f);
  if (bVar1 != 0xff) {
    bVar2 = *(byte *)(param_1 + 0x2f);
    if (bVar2 != 0xff) {
      if (bVar2 != bVar1) {
        return *(byte *)((int)game_state.start_n1 + (char)bVar1 + 0x9c) & '\x01' << (bVar2 & 0x1f);
      }
      return 1;
    }
  }
  return 1;
}
