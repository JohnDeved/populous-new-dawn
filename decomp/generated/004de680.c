/* Ghidra 12.1.3 pseudocode; entry 004de680; FUN_004de680.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


undefined1 FUN_004de680(int param_1)

{
  uint uVar1;
  int iVar2;
  char *pcVar3;
  undefined1 uVar4;

  uVar4 = 0;
  if (*(char *)(param_1 + 0x2c) == '\n') {
    pcVar3 = (char *)0x0;
    uVar1 = (uint)*(ushort *)(param_1 + 0x9b);
    if ((uVar1 != 0) ||
       (uVar1 = (uint)*(ushort *)(param_1 + 0x8b + (uint)*(byte *)(param_1 + 0xa6) * 2), uVar1 != 0)
       ) {
      pcVar3 = (char *)((int)(game_state.sunlight_array + 0x32) + uVar1 * 10);
    }
    if (((pcVar3 != (char *)0x0) && ((pcVar3[1] & 1U) == 0)) && (*pcVar3 == '\b')) {
      iVar2 = get_adjacent_unit(param_1,0);
      if (((iVar2 != 0) && ((unit_type_array_building[*(byte *)(iVar2 + 0x2b)].field_0x48 & 1) != 0)
          ) && (*(char *)(param_1 + 0x2d) == '\r')) {
        uVar4 = 1;
      }
    }
  }
  return uVar4;
}
