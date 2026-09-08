/* Ghidra 12.1.3 pseudocode; entry 00514240; place_shaman.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void place_shaman(int param_1)

{
  byte bVar1;
  byte bVar2;
  undefined2 uVar3;
  unit_struct *puVar4;
  undefined2 extraout_var;
  byte bStack_9;
  undefined1 local_8;
  byte bStack_7;
  short sStack_6;
  undefined2 uStack_4;

  bVar1 = (byte)((ushort)*(undefined2 *)(param_1 + 0x3d) >> 8);
  bVar2 = (byte)((ushort)*(undefined2 *)(param_1 + 0x3f) >> 8);
  bStack_9 = bVar2 & 0xfe;
  bStack_7 = bVar1 & 0xfe;
  local_8 = 0;
  sStack_6 = (ushort)bStack_9 << 8;
  uStack_4 = calc_point_height((CONCAT21(sStack_6,bVar1) & 0xfffffe) << 8,
                               (uint)(CONCAT21(uStack_4,bVar2) & 0xfffffe) << 8);
  if (level_hdr_mem.tribe_nums < 4) {
    puVar4 = (unit_struct *)alloc_unit(1,7,*(undefined1 *)(param_1 + 0x2f),&local_8);
    if (puVar4 != (unit_struct *)0x0) {
      uVar3 = calc_point_height(CONCAT22(extraout_var,(puVar4->pos).x),(puVar4->pos).y);
      (puVar4->pos).z = uVar3;
      puVar4->flags_4 = puVar4->flags_4 & 0xfffffbff;
      puVar4->tribe_index = level_hdr_mem.tribe_nums;
      game_state.tribes_array[level_hdr_mem.tribe_nums].shaman = puVar4;
    }
    level_hdr_mem.tribe_nums = level_hdr_mem.tribe_nums + 1;
  }
  update_after_unit_alloc(param_1);
  return;
}
