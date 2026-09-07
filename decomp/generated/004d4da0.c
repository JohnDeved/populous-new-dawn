/* Ghidra 12.1.3 pseudocode; entry 004d4da0; FUN_004d4da0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


uint FUN_004d4da0(int param_1,uint param_2)

{
  short sVar1;
  ushort uVar2;
  uint uVar3;

  sVar1 = *(short *)(param_1 + 0x33);
  if (((sVar1 != 0x30) && (sVar1 != 0x50)) && (sVar1 != 0xd0)) {
    uVar2 = (*(short *)(param_1 + 0x78) == 0) - 1 & 4;
    if (((*(uint *)(param_1 + 0xc) & 0x80000) != 0) &&
       (uVar2 = 0xc, (*(byte *)(param_1 + 0x11) & 4) == 0)) {
      uVar2 = 2;
      *(uint *)(param_1 + 0xc) = *(uint *)(param_1 + 0xc) & 0xffff7fff;
    }
    uVar3 = unit_set_object_upper
                      (param_1,unit_type_to_obj_indexes_map
                               [(uint)*(byte *)(param_1 + 0x2b) + (short)uVar2 * 9]);
    return uVar3;
  }
  uVar3 = game_state.pseudo_random_val * 0x24a1 + 0x24df;
  game_state.pseudo_random_val = uVar3 >> 0xd | uVar3 * 0x80000;
  uVar3 = game_state.pseudo_random_val / param_2;
  if (game_state.pseudo_random_val % param_2 == 0) {
    uVar3 = game_state.pseudo_random_val * 0x24a1 + 0x24df;
    game_state.pseudo_random_val = uVar3 >> 0xd | uVar3 * 0x80000;
    sVar1 = unit_type_to_obj_indexes_map
            [(uint)*(byte *)(param_1 + 0x2b) + (game_state.pseudo_random_val % 3) * 9 + 0xbd];
    unit_set_object_upper(param_1,(int)sVar1);
    uVar2 = (short)(char)vstart_related[(short)obj_indexes_table[sVar1 * 2]].frame_counter *
            (short)(char)(obj_related_array[*(byte *)(param_1 + 0x3a) + 3]._f2 + '\x01');
    uVar3 = (uint)uVar2;
    *(char *)(param_1 + 0x7e) = (char)uVar2;
  }
  return uVar3;
}
