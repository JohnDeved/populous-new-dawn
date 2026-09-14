/* Ghidra 12.1.3 pseudocode; entry 0051fce0; FUN_0051fce0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


undefined1 FUN_0051fce0(int param_1,int param_2)

{
  byte bVar1;
  unit_struct *puVar2;
  bool bVar3;
  char cVar4;
  byte bVar5;
  int iVar6;
  undefined1 uVar7;
  unit_struct *puVar8;

  uVar7 = 0;
  puVar8 = (unit_struct *)0x0;
  if (((*(ushort *)(param_2 + 6) != 0) &&
      (puVar2 = unit_land_array[*(ushort *)(param_2 + 6)], (*(byte *)&puVar2->flags_2 & 1) == 0)) &&
     (puVar2->unit_class != '\0')) {
    puVar8 = puVar2;
  }
  if ((puVar8 == (unit_struct *)0x0) || (*(short *)&puVar8->field_0x6e < 1)) {
    return 1;
  }
  cVar4 = FUN_0051a2a0(param_1,param_2);
  if (cVar4 == '\0') {
    return 0;
  }
  if (*(char *)(param_1 + 0x2b) != '\x04') goto LAB_0051fe12;
  bVar3 = true;
  if ((*(short *)&puVar8->field_0x6e < 1) || ((*(byte *)((int)&puVar8->flags_2 + 2) & 1) != 0)) {
LAB_0051fdfe:
    bVar3 = false;
  }
  else {
    bVar1 = *(byte *)(param_1 + 0x2f);
    if ((bVar1 == 0xff) || ((bVar5 = puVar8->tribe_index, bVar5 == 0xff || (bVar1 == bVar5)))) {
      bVar5 = 1;
    }
    else {
      bVar5 = *(byte *)((int)game_state.start_n1 + (char)bVar1 + 0x9c) & '\x01' << (bVar5 & 0x1f);
    }
    if (((((bVar5 != 0) || (bVar1 == puVar8->tribe_index)) || (puVar8->tribe_index == 0xff)) ||
        ((iVar6 = FUN_004de7b0(puVar8,(int)(char)bVar1), iVar6 != 0 ||
         (iVar6 = FUN_004de7b0(param_1,(int)(char)puVar8->tribe_index), iVar6 != 0)))) ||
       ((*(byte *)((int)&puVar8->flags_4 + 1) & 0x10) != 0)) goto LAB_0051fdfe;
    cVar4 = *(char *)(param_1 + 0x2b);
    if (cVar4 == '\x04') {
      if ((((game_state.level_flags & 2) != 0) || (puVar8->unit_type == '\x04')) ||
         (puVar8->unit_type == '\a')) goto LAB_0051fe03;
      goto LAB_0051fdfe;
    }
    if (cVar4 == '\x06') {
      if (((game_state.level_flags & 2) != 0) && (puVar8->unit_type == '\a')) goto LAB_0051fdfe;
    }
    else if ((cVar4 != '\b') && (puVar8->unit_type == '\b')) goto LAB_0051fdfe;
  }
LAB_0051fe03:
  if ((!bVar3) && ((*(byte *)(param_2 + 1) & 0x40) == 0)) {
    uVar7 = 1;
  }
LAB_0051fe12:
  if ((*(char *)(param_1 + 0x2b) != '\x06') && (puVar8->unit_land_array_index != 0)) {
    return 1;
  }
  return uVar7;
}
