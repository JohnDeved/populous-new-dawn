/* Ghidra 12.1.3 pseudocode; entry 004d7330; FUN_004d7330.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_004d7330(int param_1)

{
  uint uVar1;
  undefined1 uVar2;
  ushort uVar3;

  if (1 < game_state.offset_counter_2) {
    *(undefined2 *)(param_1 + 0x87) = 0;
  }
  uVar1 = *(uint *)(param_1 + 0xc);
  *(uint *)(param_1 + 0xc) = uVar1 | 0x40000000;
  *(undefined1 *)(param_1 + 0x2d) = 0;
  if ((unit_type_array_person[*(byte *)(param_1 + 0x2b)].field_0x31 & 4) == 0) {
    uVar2 = 0;
  }
  else {
    *(undefined2 *)(param_1 + 0x5f) = 0;
    uVar3 = (*(short *)(param_1 + 0x78) == 0) - 1 & 4;
    if (((uVar1 & 0x80000) != 0) && (uVar3 = 0xc, (*(byte *)(param_1 + 0x11) & 4) == 0)) {
      uVar3 = 2;
      *(uint *)(param_1 + 0xc) = uVar1 & 0xffff7fff | 0x40000000;
    }
    unit_set_object_upper
              (param_1,unit_type_to_obj_indexes_map
                       [(short)uVar3 * 9 + (uint)*(byte *)(param_1 + 0x2b)]);
    uVar2 = 8;
  }
  *(undefined1 *)(param_1 + 0x2d) = uVar2;
  *(uint *)(param_1 + 0xc) = *(uint *)(param_1 + 0xc) | 0x40000000;
  *(byte *)(param_1 + 0x76) = *(byte *)(param_1 + 0x76) | 1;
  update_gs_unit_related_array_item(param_1);
  return;
}
