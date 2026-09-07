/* Ghidra 12.1.3 pseudocode; entry 004d9580; FUN_004d9580.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */

void FUN_004d9580(int param_1)

{
  ushort uVar1;
  undefined4 uVar2;

  *(undefined2 *)(param_1 + 0x5f) = 0;
  *(undefined2 *)(param_1 + 0x70) = 0;
  uVar1 = (*(short *)(param_1 + 0x78) == 0) - 1 & 4;
  if (((*(uint *)(param_1 + 0xc) & 0x80000) != 0) &&
     (uVar1 = 0xc, (*(byte *)(param_1 + 0x11) & 4) == 0)) {
    uVar1 = 2;
    *(uint *)(param_1 + 0xc) = *(uint *)(param_1 + 0xc) & 0xffff7fff;
  }
  unit_set_object_upper
            (param_1,unit_type_to_obj_indexes_map
                     [(uint)*(byte *)(param_1 + 0x2b) + (short)uVar1 * 9]);
  *(undefined1 *)(param_1 + 0x2d) = 0;
  *(uint *)(param_1 + 0xc) = *(uint *)(param_1 + 0xc) | 0x40000000;
  update_gs_unit_related_array_item(param_1);
  if ((game_state.level_flags & 2) == 0) {
    if ((*(char *)(param_1 + 0x2f) == player_tribe_num) &&
       ((uint)(game_state.offset_counter - _DAT_0089bc22) < 3)) {
      if (*(char *)(param_1 + 0x2b) == '\a') {
        uVar2 = 0xe2;
      }
      else {
        uVar2 = 0xe1;
      }
      FUN_0048a050(0,uVar2,1);
      FUN_00499d90(0x200000,0x25b);
      return;
    }
  }
  else {
    *(undefined2 *)(param_1 + 0x6e) = 0;
  }
  return;
}
