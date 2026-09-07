/* Ghidra 12.1.3 pseudocode; entry 004da1d0; FUN_004da1d0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


undefined1 FUN_004da1d0(int param_1)

{
  uint uVar1;
  undefined1 uVar2;
  char *pcVar3;

  uVar2 = 0;
  if ((*(char *)(param_1 + 0x2c) == '\n') || (*(char *)(param_1 + 0x2c) == '!')) {
    pcVar3 = (char *)0x0;
    uVar1 = (uint)*(ushort *)(param_1 + 0x9b);
    if ((uVar1 != 0) ||
       (uVar1 = (uint)*(ushort *)(param_1 + 0x8b + (uint)*(byte *)(param_1 + 0xa6) * 2), uVar1 != 0)
       ) {
      pcVar3 = (char *)((int)(game_state.sunlight_array + 0x32) + uVar1 * 10);
    }
    if ((((pcVar3 != (char *)0x0) && ((pcVar3[1] & 1U) == 0)) &&
        ((*pcVar3 == '\x13' || (*pcVar3 == '\x15')))) && (*(char *)(param_1 + 0x2d) == '\x01')) {
      uVar2 = 1;
    }
  }
  return uVar2;
}
