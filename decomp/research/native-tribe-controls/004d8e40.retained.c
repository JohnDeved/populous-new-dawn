/* Ghidra 12.1.3 pseudocode; entry 004d8e40; FUN_004d8e40.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


undefined1 FUN_004d8e40(int param_1)

{
  unit_struct *puVar1;
  uint uVar2;
  bool bVar3;
  byte bVar4;
  uint uVar5;
  undefined1 uVar6;
  unit_struct *puVar7;
  undefined4 local_8;
  undefined2 local_4;

  uVar6 = 0;
  puVar7 = (unit_struct *)0x0;
  bVar3 = false;
  if (((*(ushort *)(param_1 + 0x89) != 0) &&
      (puVar1 = unit_land_array[*(ushort *)(param_1 + 0x89)], (*(byte *)&puVar1->flags_2 & 1) == 0))
     && (puVar1->unit_class != '\0')) {
    puVar7 = puVar1;
  }
  if (puVar7 != (unit_struct *)0x0) {
    bVar4 = *(char *)(param_1 + 0x2d) + 1;
    *(byte *)(param_1 + 0x2d) = bVar4;
    if ((bVar4 < 0x13) && (puVar7->state_2 == '\0')) {
      local_8 = *(undefined4 *)(param_1 + 0x3d);
      *(uint *)(param_1 + 0xc) = *(uint *)(param_1 + 0xc) | 0x4000;
      local_4 = *(undefined2 *)(param_1 + 0x41);
      FUN_0049bcf0(puVar7,&local_8,bVar4);
      add_unit_to_cell(param_1,&local_8);
      goto LAB_004d8ece;
    }
  }
  bVar3 = true;
LAB_004d8ece:
  if (bVar3) {
    *(uint *)(param_1 + 0x10) = *(uint *)(param_1 + 0x10) | 0x400;
    uVar2 = *(uint *)(param_1 + 0xc);
    *(uint *)(param_1 + 0xc) = uVar2 | 0x2000;
    *(uint *)(param_1 + 0xc) = uVar2 | 0x82000;
    *(uint *)(param_1 + 0xc) = uVar2 & 0xffffbfff | 0x82000;
    uVar5 = game_state.pseudo_random_val * 0x24a1 + 0x24df;
    uVar2 = uVar5 >> 0xd;
    game_state.pseudo_random_val = uVar2 | uVar5 * 0x80000;
    *(undefined2 *)(param_1 + 0x49) = 0;
    *(undefined2 *)(param_1 + 0x4d) = 0;
    FUN_004e93f0((undefined2 *)(param_1 + 0x49),param_1 + 0x3d,0xc0,uVar2 & 0x7ff);
    *(undefined2 *)(param_1 + 0x4b) = 0xe6;
    if (puVar7 != (unit_struct *)0x0) {
      *(undefined1 *)(param_1 + 0xb0) = puVar7->tribe_index;
    }
    if ((game_state.level_flags & 2) != 0) {
      if (*(byte *)(param_1 + 0x2b) == 7) {
        return 0x27;
      }
      return unit_type_array_person[*(byte *)(param_1 + 0x2b)].next_state;
    }
    uVar6 = unit_type_array_person[*(byte *)(param_1 + 0x2b)].next_state;
  }
  return uVar6;
}
