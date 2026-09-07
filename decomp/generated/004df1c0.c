/* Ghidra 12.1.3 pseudocode; entry 004df1c0; FUN_004df1c0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


uint FUN_004df1c0(int param_1)

{
  char cVar1;
  undefined4 in_EAX;
  uint uVar2;
  uint uVar3;
  undefined3 uVar4;
  char *pcVar5;

  cVar1 = *(char *)(param_1 + 0x2c);
  uVar2 = CONCAT31((int3)((uint)in_EAX >> 8),cVar1);
  if ((cVar1 == '\n') || (cVar1 == '!')) {
    pcVar5 = (char *)0x0;
    uVar3 = (uint)*(ushort *)(param_1 + 0x9b);
    if ((uVar3 != 0) ||
       (uVar3 = (uint)*(ushort *)(param_1 + 0x8b + (uint)*(byte *)(param_1 + 0xa6) * 2), uVar2 = 0,
       uVar3 != 0)) {
      uVar2 = uVar3 * 5;
      pcVar5 = (char *)((int)(game_state.sunlight_array + 0x32) + uVar3 * 10);
    }
    if ((pcVar5 != (char *)0x0) && ((pcVar5[1] & 1U) == 0)) {
      cVar1 = *pcVar5;
      uVar4 = (undefined3)(uVar2 >> 8);
      uVar2 = CONCAT31(uVar4,cVar1);
      if ((cVar1 == '\v') || (cVar1 == '\x19')) {
        return CONCAT31(uVar4,1);
      }
    }
  }
  return uVar2 & 0xffffff00;
}
