/* Ghidra 12.1.3 pseudocode; entry 004f62c0; FUN_004f62c0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


undefined4 FUN_004f62c0(int param_1,uint param_2)

{
  uint uVar1;
  byte *pbVar2;

  if ((*(char *)(param_1 + 0x2c) == '\n') || (*(char *)(param_1 + 0x2c) == '!')) {
    pbVar2 = (byte *)0x0;
    uVar1 = (uint)*(ushort *)(param_1 + 0x9b);
    if ((uVar1 != 0) ||
       (uVar1 = (uint)*(ushort *)(param_1 + 0x8b + (uint)*(byte *)(param_1 + 0xa6) * 2), uVar1 != 0)
       ) {
      pbVar2 = (byte *)((int)(game_state.sunlight_array + 0x32) + uVar1 * 10);
    }
    if (((pbVar2 != (byte *)0x0) && ((pbVar2[1] & 1) == 0)) && (*pbVar2 == param_2)) {
      return 1;
    }
  }
  return 0;
}
