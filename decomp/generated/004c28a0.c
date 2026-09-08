/* Ghidra 12.1.3 pseudocode; entry 004c28a0; FUN_004c28a0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


char FUN_004c28a0(int param_1,int param_2)

{
  byte bVar1;
  bool bVar2;
  char cVar3;
  char cVar4;
  int iVar5;
  char cVar6;
  uint uVar7;

  cVar3 = '\0';
  cVar6 = '\0';
  iVar5 = (int)*(char *)(param_1 + 0xc22);
  bVar1 = *(byte *)(param_2 + 0x96071e + iVar5 * 0x38) & 0xf;
  if ((game_state.level_flags & 0x20) == 0) {
    uVar7 = game_state.array_56b_4[iVar5].spells & 1 << ((byte)param_2 & 0x1f);
    if ((uVar7 == 0) && (bVar1 == 0)) goto LAB_004c293f;
    if ((bVar1 == 0) && ((game_state.tribes_array[iVar5].field_0x93d & 8) == 0)) {
      cVar6 = (uVar7 == 0) + '\x01';
      goto LAB_004c293f;
    }
  }
  else if (((&DAT_005a80fe)[param_2 * 0x3e] == '\0') || (bVar1 == 0)) {
    cVar6 = '\0';
    goto LAB_004c293f;
  }
  cVar6 = '\x03';
LAB_004c293f:
  cVar4 = cVar3;
  if (((cVar6 != '\0') && (cVar4 = cVar6, (*(byte *)(param_1 + 0x93d) & 8) == 0)) &&
     (cVar4 = cVar3, ((&DAT_005a80ea)[param_2 * 0x3e] & 1) != 0)) {
    if (cVar6 == '\x03') {
      bVar2 = true;
    }
    else {
      bVar2 = true;
      if (*(int *)(param_1 + 0x94d) < *(int *)((int)&DAT_005a80d4 + param_2 * 0x3e)) {
        bVar2 = false;
      }
    }
    if (bVar2) {
      return cVar6;
    }
  }
  return cVar4;
}
