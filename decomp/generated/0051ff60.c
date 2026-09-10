/* Ghidra 12.1.3 pseudocode; entry 0051ff60; FUN_0051ff60.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


uint FUN_0051ff60(int param_1)

{
  int iVar1;
  uint uVar2;
  uint uVar3;
  char cVar4;
  byte *pbVar5;

  uVar3 = 0;
  cVar4 = '\x01';
  uVar2 = (uint)*(byte *)(param_1 + 0x2b);
  if (uVar2 == 6) {
    if (*(char *)(param_1 + 0x2c) == '\n') {
      cVar4 = (&DAT_005a7dc3)[(uint)*(byte *)(param_1 + 0xa7) * 0x16];
    }
    if (cVar4 == '\x01') {
      uVar3 = (uint)(byte)unit_type_array_person[6]._24_1_;
    }
    else if (cVar4 == '\x02') {
      uVar3 = (uint)(byte)unit_type_array_person[6]._25_1_;
    }
    else if (cVar4 == '\x03') {
      uVar3 = (byte)unit_type_array_person[6]._25_1_ + 2;
    }
    iVar1 = (int)(short)((int)((int)*(short *)(param_1 + 0x41) +
                              ((int)*(short *)(param_1 + 0x41) >> 0x1f & 0x7fU)) >> 7);
    if (iVar1 < 0) {
      iVar1 = 0;
    }
    if (7 < iVar1) {
      iVar1 = 7;
    }
    uVar2 = (int)((&DAT_005aa558)[iVar1] * uVar3 +
                 ((int)((&DAT_005aa558)[iVar1] * uVar3) >> 0x1f & 0xffU)) >> 8;
    iVar1 = get_adjacent_unit(param_1,4);
    if (iVar1 != 0) {
      uVar2 = uVar2 + 4;
    }
    return uVar2 | 1;
  }
  if (*(char *)(param_1 + 0x2c) == '\n') {
    pbVar5 = (byte *)0x0;
    uVar3 = (uint)*(ushort *)(param_1 + 0x9b);
    if ((uVar3 != 0) ||
       (uVar3 = (uint)*(ushort *)(param_1 + 0x8b + (uint)*(byte *)(param_1 + 0xa6) * 2), uVar3 != 0)
       ) {
      pbVar5 = (byte *)((int)(game_state.sunlight_array + 0x32) + uVar3 * 10);
    }
    if ((pbVar5 != (byte *)0x0) && ((pbVar5[1] & 0x20) == 0)) {
      cVar4 = (&DAT_005a7dc3)[(uint)*pbVar5 * 0x16];
    }
  }
  if (cVar4 == '\x01') {
    return (uint)(byte)unit_type_array_person[uVar2].field_0x18;
  }
  if (cVar4 == '\x02') {
    return (uint)(byte)unit_type_array_person[uVar2].field_0x19;
  }
  if (cVar4 == '\x03') {
    return (byte)unit_type_array_person[uVar2].field_0x19 + 2;
  }
  return 0;
}
