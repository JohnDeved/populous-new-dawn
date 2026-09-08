/* Ghidra 12.1.3 pseudocode; entry 004ea300; FUN_004ea300.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_004ea300(int param_1)

{
  short sVar1;
  undefined2 uVar2;
  bool bVar3;
  bool bVar4;
  char cVar5;

  if ((*(uint *)(param_1 + 0x10) & 0x200) == 0) {
    return;
  }
  bVar3 = true;
  if ((*(ushort *)(param_1 + 0x9f) == 0) ||
     (bVar4 = true, (*(uint *)(param_1 + 0x10) & 0x2000000) != 0)) {
    bVar4 = false;
  }
  if (((bVar4) && ((*(byte *)(param_1 + 0xe) & 8) == 0)) && (*(short *)(param_1 + 99) != 0)) {
    cVar5 = FUN_00465650(unit_land_array[*(ushort *)(param_1 + 0x9f)]);
    if (cVar5 == '\0') goto LAB_004ea38a;
    sVar1 = *(short *)(param_1 + 99);
    if (game_state.unit_related_array_1[sVar1].sub_array_counter == '\0') {
      uVar2 = *(undefined2 *)&game_state.unit_related_array_1[sVar1].field_0x6;
      cVar5 = (char)uVar2;
    }
    else {
      cVar5 = SUB41(game_state.unit_related_array_1[sVar1].sub_array[0],2);
    }
    if (cVar5 == '\0') goto LAB_004ea38a;
  }
  bVar3 = false;
LAB_004ea38a:
  if (!bVar3) {
    *(uint *)(param_1 + 0xc) = *(uint *)(param_1 + 0xc) & 0xf7ffffff;
    return;
  }
  *(uint *)(param_1 + 0xc) = *(uint *)(param_1 + 0xc) | 0x8000000;
  return;
}
