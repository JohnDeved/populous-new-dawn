/* Ghidra 12.1.3 pseudocode; entry 004d4690; FUN_004d4690.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_004d4690(int param_1)

{
  char cVar1;
  int iVar2;
  uint uVar3;
  char *pcVar4;

  if ((*(byte *)(param_1 + 0x2e) & unit_type_array_person[*(byte *)(param_1 + 0x2b)].field_0x2f) ==
      0) {
    *(uint *)(param_1 + 0x14) = *(uint *)(param_1 + 0x14) | 0x800;
  }
  if ((*(uint *)(param_1 + 0x14) & 0x800) != 0) {
    *(uint *)(param_1 + 0x14) = *(uint *)(param_1 + 0x14) & 0xfffff7ff;
    iVar2 = FUN_0051ff60(param_1);
    if (((iVar2 != 0) && ((level_flags_2._3_1_ & 2) == 0)) &&
       (cVar1 = FUN_004d44e0(param_1), cVar1 != '\0')) {
      if ((*(byte *)(param_1 + 0x11) & 8) == 0) {
        cVar1 = *(char *)(param_1 + 0x2b);
        if (cVar1 == '\x04') {
          if ((*(char *)(param_1 + 0x2c) == '\n') || (*(char *)(param_1 + 0x2c) == '!')) {
            pcVar4 = (char *)0x0;
            uVar3 = (uint)*(ushort *)(param_1 + 0x9b);
            if ((uVar3 != 0) ||
               (uVar3 = (uint)*(ushort *)(param_1 + 0x8b + (uint)*(byte *)(param_1 + 0xa6) * 2),
               uVar3 != 0)) {
              pcVar4 = (char *)((int)(game_state.sunlight_array + 0x32) + uVar3 * 10);
            }
            if ((((pcVar4 != (char *)0x0) && ((pcVar4[1] & 1U) == 0)) &&
                ((cVar1 = *pcVar4, cVar1 == '\x11' || ((cVar1 == '\x1f' || (cVar1 == ' ')))))) &&
               ((*(byte *)(param_1 + 0x76) & 0x40) != 0)) {
              return;
            }
          }
          FUN_0051e7b0(param_1);
          return;
        }
        if (cVar1 == '\x06') {
          cVar1 = FUN_0051fcd0(param_1);
          if (cVar1 != '\0') {
            FUN_0051e9a0(param_1);
            return;
          }
        }
        else {
          if (cVar1 != '\a') {
            FUN_0051e5e0(param_1);
            return;
          }
          cVar1 = *(char *)(param_1 + 0xa7);
          if (((cVar1 == '\x1c') || (cVar1 == '\x13')) || (cVar1 == '\x04')) {
            FUN_0051e7b0(param_1);
            return;
          }
        }
      }
      else {
        FUN_0051e6f0(param_1);
      }
    }
  }
  return;
}
