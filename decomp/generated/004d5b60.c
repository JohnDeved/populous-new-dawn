/* Ghidra 12.1.3 pseudocode; entry 004d5b60; FUN_004d5b60.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


uint FUN_004d5b60(int param_1)

{
  byte bVar1;
  int iVar2;
  uint uVar3;
  char cVar4;
  undefined4 local_8;
  undefined2 local_4;

  cVar4 = '\0';
  FUN_004eec80(param_1);
  local_8 = *(undefined4 *)(param_1 + 0x3d);
  local_4 = *(undefined2 *)(param_1 + 0x41);
  iVar2 = FUN_00465580((undefined4 *)(param_1 + 0x3d),
                       CONCAT22((short)((uint)&local_8 >> 0x10),*(undefined2 *)(param_1 + 0x57)));
  move_pos_angle_length(&local_8,iVar2 + 0x400U & 0x7ff,0x28);
  add_unit_to_cell(param_1,&local_8);
  uVar3 = FUN_004ef140(param_1,(int)*(short *)&unit_type_array_person[*(byte *)(param_1 + 0x2b)].
                                               field_0xa,
                       (int)*(short *)&unit_type_array_person[*(byte *)(param_1 + 0x2b)].field_0xc);
  if ((uVar3 & 0xff) == 1) {
    if ((game_state.level_flags & 2) == 0) {
      uVar3 = (uint)*(byte *)(param_1 + 0x2b);
      cVar4 = unit_type_array_person[uVar3].next_state;
    }
    else {
      bVar1 = *(byte *)(param_1 + 0x2b);
      uVar3 = CONCAT31((int3)(uVar3 >> 8),bVar1);
      if (bVar1 == 7) {
        cVar4 = '\'';
      }
      else {
        uVar3 = (uint)bVar1 * 5;
        cVar4 = unit_type_array_person[bVar1].next_state;
      }
    }
  }
  else if ((uVar3 & 0xff) == 2) {
    cVar4 = '\x03';
  }
  if (cVar4 != '\0') {
    *(uint *)(param_1 + 0xc) = *(uint *)(param_1 + 0xc) & 0xffefffff;
    *(undefined1 *)(param_1 + 0x7d) = *(undefined1 *)(param_1 + 0x2c);
    empty_unit_function(param_1);
    *(char *)(param_1 + 0x2c) = cVar4;
    uVar3 = init_unit_class(param_1);
    *(uint *)(param_1 + 0xc) = *(uint *)(param_1 + 0xc) & 0xfffffffd;
  }
  return uVar3 & 0xffffff00;
}
