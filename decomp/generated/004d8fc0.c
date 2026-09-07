/* Ghidra 12.1.3 pseudocode; entry 004d8fc0; FUN_004d8fc0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_004d8fc0(int param_1)

{
  uint uVar1;
  uint uVar2;

  if ((*(byte *)(param_1 + 0x11) & 8) != 0) {
    FUN_004ef180(param_1);
    return;
  }
  unit_set_object_upper(param_1,unit_type_to_obj_indexes_map[*(byte *)(param_1 + 0x2b) + 0xe1]);
  *(uint *)(param_1 + 0x10) = *(uint *)(param_1 + 0x10) | 0x80;
  *(undefined2 *)(param_1 + 0x5f) = 0x6e;
  FUN_00445750(param_1,0,0);
  *(undefined2 *)(param_1 + 0x70) = 0x46;
  uVar2 = game_state.pseudo_random_val * 0x24a1 + 0x24df;
  uVar1 = uVar2 >> 0xd;
  game_state.pseudo_random_val = uVar1 | uVar2 * 0x80000;
  update_gs_unit_related_array_item(param_1);
  uVar2 = *(uint *)(param_1 + 0xc);
  *(uint *)(param_1 + 0xc) = uVar2 | 0x80;
  *(uint *)(param_1 + 0xc) = uVar2 | 0x1080;
  *(ushort *)(param_1 + 0x57) = (ushort)uVar1 & 0x7ff;
  return;
}
