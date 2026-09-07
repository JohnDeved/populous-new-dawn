/* Ghidra 12.1.3 pseudocode; entry 00409d40; FUN_00409d40.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_00409d40(int param_1)

{
  bool bVar1;
  uint uVar2;
  char *pcVar3;

  bVar1 = true;
  if (*(char *)(param_1 + 0x2c) == '\n') {
    pcVar3 = (char *)0x0;
    uVar2 = (uint)*(ushort *)(param_1 + 0x9b);
    if ((uVar2 != 0) ||
       (uVar2 = (uint)*(ushort *)(param_1 + 0x8b + (uint)*(byte *)(param_1 + 0xa6) * 2), uVar2 != 0)
       ) {
      pcVar3 = (char *)((int)(game_state.sunlight_array + 0x32) + uVar2 * 10);
    }
    if (((pcVar3 == (char *)0x0) || (*pcVar3 != '\b')) ||
       ((int)*(short *)(param_1 + 0x72) != (uint)*(ushort *)(pcVar3 + 6))) goto LAB_00409da1;
  }
  else if (*(char *)(param_1 + 0x2c) != '\x0e') goto LAB_00409da1;
  bVar1 = false;
LAB_00409da1:
  if (bVar1) {
    FUN_00409580(unit_land_array[*(short *)(param_1 + 0x72)]);
    *(uint *)(param_1 + 0x14) = *(uint *)(param_1 + 0x14) & 0xffffffdf;
    *(undefined2 *)(param_1 + 0x85) = 0;
  }
  return;
}
