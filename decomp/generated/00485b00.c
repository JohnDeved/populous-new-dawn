/* Ghidra 12.1.3 pseudocode; entry 00485b00; load_level_unit_post_processing.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void load_level_unit_post_processing(int param_1,char *param_2)

{
  char cVar1;
  short sVar2;
  undefined2 uVar3;
  uint uVar4;
  uint uVar5;
  int iVar6;
  undefined2 *puVar7;
  ushort local_6;

  switch(param_2[1]) {
  case '\x01':
    uVar5 = game_state.pseudo_random_val * 0x24a1 + 0x24df;
    uVar4 = uVar5 >> 0xd;
    game_state.pseudo_random_val = uVar4 | uVar5 * 0x80000;
    *(ushort *)(param_1 + 0x87) = (ushort)uVar4 & 0xff;
    if (*param_2 == '\a') {
      local_6 = CONCAT11((char)((ushort)*(undefined2 *)(param_1 + 0x3f) >> 8),
                         (char)((ushort)*(undefined2 *)(param_1 + 0x3d) >> 8)) & 0xfefe;
      game_state.tribes_array[*(char *)(param_1 + 0x2f)].maybe_shaman_location = local_6;
      return;
    }
    if (*param_2 == '\x01') {
      if ((*(byte *)(param_1 + 0xe) & 0x10) == 0) {
        *(undefined1 *)(param_1 + 0x7d) = *(undefined1 *)(param_1 + 0x2c);
        empty_unit_function(param_1);
        *(undefined1 *)(param_1 + 0x2c) = 8;
        init_unit_class(param_1);
      }
      *(undefined1 *)(param_1 + 0x2d) = 1;
      *(uint *)(param_1 + 0xc) = *(uint *)(param_1 + 0xc) | 0x40000000;
      return;
    }
    break;
  case '\x05':
    *(undefined2 *)(param_1 + 0x26) = *(undefined2 *)(param_2 + 10);
    switch(*param_2) {
    case '\t':
      *(char *)(param_1 + 0x8b) = param_2[0xc];
      return;
    case '\x0f':
      *(char *)(param_1 + 0x8c) = param_2[0xf];
      FUN_004a66c0(param_1,unit_type_array_scenery[*(byte *)(param_1 + 0x2b)].obj_related_index,
                   unit_type_array_scenery[*(byte *)(param_1 + 0x2b)].obj_index);
      return;
    case '\x12':
    case '\x13':
      *(char *)(param_1 + 0x8f) = param_2[0xf];
      FUN_004a66c0(param_1,unit_type_array_scenery[*(byte *)(param_1 + 0x2b)].obj_related_index,
                   unit_type_array_scenery[*(byte *)(param_1 + 0x2b)].obj_index);
      return;
    }
    break;
  case '\x06':
    if (*(char *)(param_1 + 0x2b) != '\x02') {
      if (*(char *)(param_1 + 0x2b) != '\x06') {
        return;
      }
      *(char *)(param_1 + 0x68) = param_2[7];
      *(char *)(param_1 + 0x69) = param_2[8];
      *(undefined2 *)(param_1 + 0x8e) = *(undefined2 *)(param_2 + 0xb);
      *(char *)(param_1 + 0x6a) = param_2[9];
      *(char *)(param_1 + 0x6b) = param_2[10];
      *(int *)(param_1 + 0x9a) = (int)*(short *)(param_2 + 0x21);
      cVar1 = param_2[0x23];
      *(char *)(param_1 + 0x70) = cVar1;
      sVar2 = *(short *)(param_2 + 0x25);
      *(short *)(param_1 + 0x94) = sVar2;
      *(char *)(param_1 + 0x71) = param_2[0x24];
      if (cVar1 == '\0') {
        *(byte *)(param_1 + 0x6d) = *(byte *)(param_1 + 0x6d) | 1;
      }
      else {
        *(byte *)(param_1 + 0x6d) = *(byte *)(param_1 + 0x6d) & 0xfe;
      }
      if (sVar2 == 0) {
        *(short *)(param_1 + 0x94) = (short)DAT_005aa468;
      }
      param_2 = param_2 + 0xd;
      *(undefined2 *)(param_1 + 0xa2) = 0;
      *(undefined2 *)(param_1 + 0xa2) = *(undefined2 *)(param_1 + 0x94);
      puVar7 = (undefined2 *)(param_1 + 0x72);
      *(undefined2 *)(param_1 + 0x94) = 1;
      iVar6 = 10;
      do {
        uVar3 = *(undefined2 *)param_2;
        param_2 = param_2 + 2;
        *puVar7 = uVar3;
        puVar7 = puVar7 + 1;
        iVar6 = iVar6 + -1;
      } while (iVar6 != 0);
      return;
    }
    *(char *)(param_1 + 0x7c) = param_2[7];
    *(uint *)(param_1 + 0x74) = (uint)(byte)param_2[8];
    cVar1 = param_2[9];
    *(char *)(param_1 + 0x80) = cVar1;
    *(char *)(param_1 + 0x7d) = param_2[10];
    *(undefined4 *)(param_1 + 0x70) = *(undefined4 *)(param_2 + 0xb);
    if (((interface_state != '\x03') && (cVar1 == '\x01')) &&
       (iVar6 = alloc_unit(6,10,0,param_1 + 0x3d), iVar6 != 0)) {
      *(undefined1 *)(iVar6 + 0x7a) = *(undefined1 *)(param_1 + 0x7c);
      *(undefined4 *)(iVar6 + 0x74) = *(undefined4 *)(param_1 + 0x74);
      return;
    }
    break;
  case '\a':
    *(short *)(param_1 + 0x57) = (short)*(undefined4 *)(param_2 + 7);
    *(short *)(param_1 + 0x59) = (short)*(undefined4 *)(param_2 + 0xb);
  }
  return;
}
