/* Ghidra 12.1.3 pseudocode; entry 004d4f40; FUN_004d4f40.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_004d4f40(int param_1)

{
  short sVar1;
  uint uVar2;
  uint uVar3;

  uVar3 = (int)*(short *)&unit_related_struct_26B_ARRAY_005a7b90[*(byte *)(param_1 + 0x30)].
                          field_0x4 >> 2;
  if (uVar3 == 0) {
    uVar3 = 1;
  }
  uVar2 = game_state.pseudo_random_val * 0x24a1 + 0x24df;
  game_state.pseudo_random_val = uVar2 >> 0xd | uVar2 * 0x80000;
  sVar1 = *(short *)&unit_related_struct_26B_ARRAY_005a7b90[*(byte *)(param_1 + 0x30)].field_0x4 +
          (short)(game_state.pseudo_random_val % uVar3);
  *(short *)(param_1 + 0x5f) = sVar1;
  if ((*(byte *)(param_1 + 0x16) & 8) != 0) {
    *(short *)(param_1 + 0x5f) = sVar1 * 2;
  }
  sVar1 = (-(ushort)(*(short *)(param_1 + 0x78) == 0) & 0xfffc) + 5;
  if (((*(uint *)(param_1 + 0xc) & 0x80000) != 0) &&
     (sVar1 = 0xc, (*(byte *)(param_1 + 0x11) & 4) == 0)) {
    sVar1 = 2;
    *(uint *)(param_1 + 0xc) = *(uint *)(param_1 + 0xc) & 0xffff7fff;
  }
  unit_set_object_upper
            (param_1,CONCAT22(sVar1 >> 0xf,
                              unit_type_to_obj_indexes_map
                              [(uint)*(byte *)(param_1 + 0x2b) + sVar1 * 9]));
  return;
}
