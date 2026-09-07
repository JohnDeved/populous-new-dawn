/* Ghidra 12.1.3 pseudocode; entry 004f6730; FUN_004f6730.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


int FUN_004f6730(int param_1)

{
  int iVar1;
  int iVar2;
  uint uVar3;
  char *pcVar4;

  iVar2 = 0;
  for (iVar1 = *(int *)(param_1 + 0x881); iVar1 != 0; iVar1 = *(int *)(iVar1 + 8)) {
    if ((*(char *)(iVar1 + 0x2c) == '\n') || (*(char *)(iVar1 + 0x2c) == '!')) {
      pcVar4 = (char *)0x0;
      uVar3 = (uint)*(ushort *)(iVar1 + 0x9b);
      if ((uVar3 != 0) ||
         (uVar3 = (uint)*(ushort *)(iVar1 + 0x8b + (uint)*(byte *)(iVar1 + 0xa6) * 2), uVar3 != 0))
      {
        pcVar4 = (char *)((int)(game_state.sunlight_array + 0x32) + uVar3 * 10);
      }
      if (((pcVar4 != (char *)0x0) && ((pcVar4[1] & 1U) == 0)) && (*pcVar4 == '\x06')) {
        iVar2 = iVar2 + 1;
      }
    }
  }
  return iVar2;
}
