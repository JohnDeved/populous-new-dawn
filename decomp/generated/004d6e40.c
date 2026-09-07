/* Ghidra 12.1.3 pseudocode; entry 004d6e40; FUN_004d6e40.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


undefined1 FUN_004d6e40(int param_1)

{
  char cVar1;
  short sVar2;
  uint uVar3;
  uint uVar4;
  undefined1 uVar5;
  undefined4 uVar6;

  uVar5 = 0;
  sVar2 = *(short *)(param_1 + 0x70) + -1;
  *(short *)(param_1 + 0x70) = sVar2;
  if ((sVar2 < 1) || ((*(uint *)(param_1 + 0xc) & 0x2004) != 0)) {
    if ((game_state.level_flags & 2) != 0) {
      if (*(byte *)(param_1 + 0x2b) == 7) {
        return 0x27;
      }
      return unit_type_array_person[*(byte *)(param_1 + 0x2b)].next_state;
    }
    uVar5 = unit_type_array_person[*(byte *)(param_1 + 0x2b)].next_state;
  }
  else {
    cVar1 = *(char *)(param_1 + 0x2d) + -1;
    *(char *)(param_1 + 0x2d) = cVar1;
    if (cVar1 == '\0') {
      uVar3 = game_state.pseudo_random_val * 0x24a1 + 0x24df;
      game_state.pseudo_random_val = uVar3 >> 0xd | uVar3 * 0x80000;
      *(char *)(param_1 + 0x2d) = (char)((ulonglong)game_state.pseudo_random_val % 0xc) + '\b';
      if (*(short *)(param_1 + 0x33) == obj_indexes_table[6]) {
        uVar6 = 4;
      }
      else {
        uVar6 = 3;
      }
      unit_set_object_upper(param_1,uVar6);
    }
    if ((*(byte *)(param_1 + 0x10) & 0x10) == 0) {
      uVar4 = pseudo_random * 0x24a1 + 0x24df;
      uVar3 = uVar4 >> 0xd;
      pseudo_random = uVar3 | uVar4 * 0x80000;
      if ((uVar3 & 1) != 0) {
        FUN_0048a050(param_1,4,0);
        return 0;
      }
      FUN_0048a050(param_1,0xbf,0);
      return 0;
    }
  }
  return uVar5;
}
