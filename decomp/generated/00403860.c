/* Ghidra 12.1.3 pseudocode; entry 00403860; FUN_00403860.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_00403860(int param_1)

{
  char cVar1;
  unit_struct *puVar2;
  unit_struct *puVar3;
  undefined2 unaff_retaddr;
  undefined1 uVar4;

  if (game_state.tribes_array[*(char *)(param_1 + 0x2f)].field_0xc1f == '\x01') {
    uVar4 = game_state.tribes_array[*(char *)(param_1 + 0x2f)].field_0x5be;
  }
  else {
    uVar4 = 0xb;
  }
  set_land_pos_ph_2(param_1,uVar4,1);
  cVar1 = *(char *)(param_1 + 0xa6);
  while (cVar1 != '\0') {
    remove_person_from_hut(param_1,0);
    cVar1 = *(char *)(param_1 + 0xa6);
  }
  landscape_move_1(param_1,0);
  landscape_move_1(param_1,4);
  cVar1 = *(char *)(param_1 + 0x2b);
  if (cVar1 == '\x04') {
    game_state._858454_1_ = game_state._858454_1_ | '\x01' << (*(byte *)(param_1 + 0x2f) & 0x1f);
  }
  else if (cVar1 == '\n') {
    FUN_0042cfc0(CONCAT22(unaff_retaddr,
                          CONCAT11((char)((ushort)*(undefined2 *)(param_1 + 0x3f) >> 8),
                                   (char)((ushort)*(undefined2 *)(param_1 + 0x3d) >> 8))) &
                 0xfffffefe);
  }
  else if (cVar1 == '\x13') {
    FUN_0040c3a0(param_1);
  }
  puVar3 = (unit_struct *)0x0;
  if (((*(ushort *)(param_1 + 0x82) != 0) &&
      (puVar2 = unit_land_array[*(ushort *)(param_1 + 0x82)], (*(byte *)&puVar2->flags_2 & 1) == 0))
     && (puVar2->unit_class != '\0')) {
    puVar3 = puVar2;
  }
  if (puVar3 != (unit_struct *)0x0) {
    FUN_004ef180(puVar3);
  }
  puVar3 = (unit_struct *)0x0;
  if (((*(ushort *)(param_1 + 0x84) != 0) &&
      (puVar2 = unit_land_array[*(ushort *)(param_1 + 0x84)], (*(byte *)&puVar2->flags_2 & 1) == 0))
     && (puVar2->unit_class != '\0')) {
    puVar3 = puVar2;
  }
  if (puVar3 != (unit_struct *)0x0) {
    FUN_004ef180(puVar3);
  }
  puVar3 = (unit_struct *)0x0;
  if (((*(ushort *)(param_1 + 0x92) != 0) &&
      (puVar2 = unit_land_array[*(ushort *)(param_1 + 0x92)], (*(byte *)&puVar2->flags_2 & 1) == 0))
     && (puVar2->unit_class != '\0')) {
    puVar3 = puVar2;
  }
  if (puVar3 != (unit_struct *)0x0) {
    FUN_004ef180(puVar3);
  }
  puVar3 = (unit_struct *)0x0;
  if (((*(ushort *)(param_1 + 0x94) != 0) &&
      (puVar2 = unit_land_array[*(ushort *)(param_1 + 0x94)], (*(byte *)&puVar2->flags_2 & 1) == 0))
     && (puVar2->unit_class != '\0')) {
    puVar3 = puVar2;
  }
  if (puVar3 != (unit_struct *)0x0) {
    FUN_004ef180(puVar3);
  }
  return;
}
