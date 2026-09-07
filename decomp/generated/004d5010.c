/* Ghidra 12.1.3 pseudocode; entry 004d5010; FUN_004d5010.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_004d5010(int param_1)

{
  uint uVar1;
  short sVar2;
  uint uVar3;

  uVar3 = (int)*(short *)&unit_related_struct_26B_ARRAY_005a7b90[*(byte *)(param_1 + 0x30)].
                          field_0x6 >> 2;
  if (uVar3 == 0) {
    uVar3 = 1;
  }
  uVar1 = game_state.pseudo_random_val * 0x24a1 + 0x24df;
  game_state.pseudo_random_val = uVar1 >> 0xd | uVar1 * 0x80000;
  *(short *)(param_1 + 0x5f) =
       *(short *)&unit_related_struct_26B_ARRAY_005a7b90[*(byte *)(param_1 + 0x30)].field_0x6 +
       (short)(game_state.pseudo_random_val % uVar3);
  sVar2 = (-(ushort)(*(short *)(param_1 + 0x78) == 0) & 0xfffc) + 5;
  if (((*(uint *)(param_1 + 0xc) & 0x80000) != 0) &&
     (sVar2 = 0xc, (*(byte *)(param_1 + 0x11) & 4) == 0)) {
    sVar2 = 2;
    *(uint *)(param_1 + 0xc) = *(uint *)(param_1 + 0xc) & 0xffff7fff;
  }
  unit_set_object_upper
            (param_1,CONCAT22(sVar2 >> 0xf,
                              unit_type_to_obj_indexes_map
                              [(uint)*(byte *)(param_1 + 0x2b) + sVar2 * 9]));
  return;
}
