/* Ghidra 12.1.3 pseudocode; entry 004e2fe0; FUN_004e2fe0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


undefined4 FUN_004e2fe0(int param_1)

{
  byte bVar1;
  short sVar2;
  undefined4 in_EAX;
  undefined2 uVar5;
  uint uVar3;
  uint uVar4;
  undefined2 extraout_var;
  undefined1 uVar6;
  undefined2 local_e;
  undefined4 local_c;
  uint local_8;
  uint local_4;

  uVar6 = 0;
  uVar5 = (undefined2)((uint)in_EAX >> 0x10);
  if (*(char *)(param_1 + 0x2d) == '\0') {
    *(undefined1 *)(param_1 + 0x2d) = 1;
    uVar3 = game_state.pseudo_random_val * 0x24a1 + 0x24df;
    local_4 = uVar3 >> 0xd | uVar3 * 0x80000;
    game_state.pseudo_random_val = local_4;
    *(uint *)(param_1 + 0xc) = *(uint *)(param_1 + 0xc) | 0x200000;
    *(undefined2 *)(param_1 + 0x70) = 0xc;
    update_gs_unit_related_array_item(param_1);
    uVar3 = *(uint *)(param_1 + 0xc);
    *(uint *)(param_1 + 0xc) = uVar3 | 0x80;
    *(uint *)(param_1 + 0xc) = uVar3 | 0x1080;
    *(ushort *)(param_1 + 0x57) = (ushort)local_4 & 0x7ff;
    uVar3 = (int)*(short *)&unit_related_struct_26B_ARRAY_005a7b90[*(byte *)(param_1 + 0x30)].
                            field_0x4 >> 2;
    if (uVar3 == 0) {
      uVar3 = 1;
    }
    uVar4 = game_state.pseudo_random_val * 0x24a1 + 0x24df;
    local_8 = uVar4 >> 0xd | uVar4 * 0x80000;
    sVar2 = (short)((int)*(short *)&unit_related_struct_26B_ARRAY_005a7b90
                                    [*(byte *)(param_1 + 0x30)].field_0x4 + local_8 % uVar3);
    game_state.pseudo_random_val = local_8;
    *(short *)(param_1 + 0x5f) = sVar2;
    if ((*(byte *)(param_1 + 0x16) & 8) != 0) {
      *(short *)(param_1 + 0x5f) = sVar2 * 2;
    }
    unit_set_object_upper(param_1,unit_type_to_obj_indexes_map[*(byte *)(param_1 + 0x2b) + 0xe1]);
    uVar5 = extraout_var;
  }
  sVar2 = *(short *)(param_1 + 0x70) + -1;
  uVar3 = CONCAT22(uVar5,sVar2);
  *(short *)(param_1 + 0x70) = sVar2;
  if ((sVar2 < 1) || ((*(byte *)(param_1 + 0xd) & 8) != 0)) {
    if (*(char *)(param_1 + 0xa7) == '\0') {
      local_c = *(undefined4 *)(param_1 + 0x3d);
      local_e = CONCAT11((char)((uint)local_c >> 0x18),(char)((uint)local_c >> 8));
      uVar3 = (local_e & 0xfe) * 2 | local_e & 0xfe00;
      if ((*(byte *)((int)&game_state.level_data[0].flags + uVar3 * 4 + 1) & 2) != 0) {
        FUN_004044b0(unit_land_array
                     [(ushort)(&game_state.level_data[0].unit_index_2)[uVar3 * 2] & 0x3ff],&local_c)
        ;
      }
      *(undefined4 *)(param_1 + 0x68) = local_c;
      uVar3 = FUN_00405090((undefined4 *)(param_1 + 0x68));
      *(byte *)(param_1 + 0x82) = *(byte *)(param_1 + 0x82) & 0xf0;
      uVar3 = uVar3 & 0xffffff00;
      *(undefined1 *)(param_1 + 0x82) = 0;
    }
    if ((game_state.level_flags & 2) != 0) {
      bVar1 = *(byte *)(param_1 + 0x2b);
      if (bVar1 == 7) {
        return CONCAT31((int3)(uVar3 >> 8),0x27);
      }
      return CONCAT31((int3)((uint)bVar1 * 5 >> 8),unit_type_array_person[bVar1].next_state);
    }
    uVar3 = (uint)*(byte *)(param_1 + 0x2b);
    uVar6 = unit_type_array_person[uVar3].next_state;
  }
  return CONCAT31((int3)(uVar3 >> 8),uVar6);
}
