/* Ghidra 12.1.3 pseudocode; entry 004d44e0; FUN_004d44e0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


undefined1 FUN_004d44e0(int param_1)

{
  bool bVar1;
  bool bVar2;
  uint uVar3;
  int iVar4;
  char *pcVar5;
  char cVar6;
  byte local_4;
  undefined1 local_2;

  pcVar5 = (char *)0x0;
  local_2 = 0;
  cVar6 = '\0';
  local_4 = 0;
  if ((*(short *)(param_1 + 0x9f) == 0) || (*(char *)(param_1 + 0x2b) == '\x06')) {
    if ((*(char *)(param_1 + 0x2c) == '\n') || (*(char *)(param_1 + 0x2c) == '!')) {
      bVar1 = true;
    }
    else {
      bVar1 = false;
    }
    if (bVar1) {
      pcVar5 = (char *)0x0;
      uVar3 = (uint)*(ushort *)(param_1 + 0x9b);
      if ((uVar3 != 0) ||
         (uVar3 = (uint)*(ushort *)(param_1 + 0x8b + (uint)*(byte *)(param_1 + 0xa6) * 2),
         uVar3 != 0)) {
        pcVar5 = (char *)((int)(game_state.sunlight_array + 0x32) + uVar3 * 10);
      }
      if ((pcVar5 != (char *)0x0) && ((pcVar5[1] & 1U) == 0)) {
        local_4 = pcVar5[1] & 0x40;
        cVar6 = *pcVar5;
      }
    }
    if ((((((*(byte *)(param_1 + 0x11) & 0x10) == 0) || ((bVar1 && (cVar6 == '\x1c')))) &&
         ((*(byte *)(param_1 + 0x76) & 4) == 0)) &&
        ((unit_type_related_1_ARRAY_005a6f78[*(byte *)(param_1 + 0x2c)].field_0x1 & 0x40) == 0)) &&
       (((!bVar1 || ((cVar6 != '\x13' && (cVar6 != '\x15')))) ||
        ((*(char *)(param_1 + 0x2d) != '\x01' &&
         ((*(char *)(param_1 + 0x2d) != '\x03' ||
          ((*(char *)(param_1 + 0xa8) != '.' && (*(char *)(param_1 + 0xa8) != '5')))))))))) {
      bVar2 = false;
      if ((!bVar1) ||
         (((cVar6 != '\x1b' || (*(char *)(param_1 + 0x2d) == '\0')) ||
          ((iVar4 = FUN_00508f70(unit_land_array[*(ushort *)(pcVar5 + 6)]), iVar4 != 0 &&
           (1 < *(byte *)(param_1 + 0x6f))))))) {
        bVar2 = true;
      }
      if ((bVar2) &&
         ((((!bVar1 || ((cVar6 != '\x15' && (cVar6 != '\v')))) &&
           ((*(byte *)(param_1 + 0x11) & 4) == 0)) && ((*(byte *)(param_1 + 0xe) & 8) == 0)))) {
        if (bVar1) {
          if (cVar6 == '\x1e') {
            return 1;
          }
          if ((local_4 != 0) &&
             ((unit_type_array_person[*(byte *)(param_1 + 0x2b)].field_0x31 & 8) != 0)) {
            return 0;
          }
        }
        local_2 = 1;
      }
    }
  }
  return local_2;
}
