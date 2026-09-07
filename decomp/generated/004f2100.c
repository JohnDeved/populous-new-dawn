/* Ghidra 12.1.3 pseudocode; entry 004f2100; FUN_004f2100.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


undefined4 FUN_004f2100(int param_1,int param_2)

{
  char cVar1;
  int iVar2;

  cVar1 = *(char *)(param_1 + 0x2f);
  if (((game_state.tribes_array[cVar1].field_0x598 & 4) != 0) &&
     (iVar2 = FUN_004c2d50(param_2),
     iVar2 <= (int)(uint)*(byte *)(cVar1 * 0xc65 + 0x89d706 + param_2 * 4))) {
    return 0;
  }
  return 1;
}
