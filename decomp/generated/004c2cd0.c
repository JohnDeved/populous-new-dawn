/* Ghidra 12.1.3 pseudocode; entry 004c2cd0; FUN_004c2cd0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_004c2cd0(int param_1,int param_2,char param_3)

{
  byte *pbVar1;
  byte bVar2;
  byte bVar3;

  if (param_3 != '\0') {
    if ((game_state.level_flags & 0x20) == 0) {
      bVar2 = (&DAT_005a80fd)[param_1 * 0x3e];
    }
    else {
      bVar2 = (&DAT_005a80fe)[param_1 * 0x3e];
    }
    pbVar1 = (byte *)(param_1 + 0x96071e + param_2 * 0x38);
    bVar3 = *pbVar1 & 0xf;
    if (bVar3 < bVar2) {
      bVar3 = bVar3 + 1;
      if (0xf < bVar3) {
        bVar3 = 0xf;
      }
      bVar2 = *pbVar1 & 0xf0;
      *pbVar1 = bVar2;
      *pbVar1 = bVar3 | bVar2;
    }
  }
  return;
}
