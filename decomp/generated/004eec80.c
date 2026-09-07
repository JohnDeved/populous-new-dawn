/* Ghidra 12.1.3 pseudocode; entry 004eec80; FUN_004eec80.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


/* WARNING: Removing unreachable block (ram,0x004eee01) */
/* WARNING: Removing unreachable block (ram,0x004eed28) */
/* WARNING: Removing unreachable block (ram,0x004eee0b) */
/* WARNING: Removing unreachable block (ram,0x004eed1e) */

void FUN_004eec80(int param_1)

{
  char cVar1;
  tribe_struct *ptVar2;
  ushort uVar3;
  uint uVar4;
  uint uVar5;
  undefined4 local_8;
  undefined2 local_4;

  if ((((byte)land_flags_1 & 8) == 0) && (((byte)opened_files_flags & 0x10) == 0)) {
    uVar3 = *(ushort *)(param_1 + 0x26);
    cVar1 = *(char *)(param_1 + 0x2f);
    if (cVar1 != -1) {
      ptVar2 = game_state.tribes_array + cVar1;
      local_8._0_2_ = ptVar2->x;
      local_8._2_2_ = ptVar2->y;
      local_4 = *(undefined2 *)&game_state.tribes_array[cVar1].field_0x28;
      move_pos_angle_length
                (&local_8,CONCAT22((short)((uint)&ptVar2->x >> 0x10),
                                   game_state.tribes_array[cVar1].angle_1 + 0x400) & 0xffff07ff,
                 0x4000);
      uVar5 = (uint)(ushort)((short)local_8 - *(short *)(param_1 + 0x3d));
      uVar4 = (uint)(ushort)(local_8._2_2_ - *(short *)(param_1 + 0x3f));
      if (0x7fff < uVar5) {
        uVar5 = uVar5 - 0x10000;
      }
      if (0x7fff < uVar4) {
        uVar4 = uVar4 - 0x10000;
      }
      uVar3 = calc_angle_quadrant(uVar5,-uVar4);
      uVar3 = uVar3 & 0x7ff;
    }
    update_gs_unit_related_array_item(param_1);
    *(ushort *)(param_1 + 0x57) = uVar3;
    uVar5 = *(uint *)(param_1 + 0xc);
    *(uint *)(param_1 + 0xc) = uVar5 | 0x80;
    *(uint *)(param_1 + 0xc) = uVar5 | 0x1080;
    return;
  }
  uVar3 = *(ushort *)(param_1 + 0x26);
  cVar1 = *(char *)(param_1 + 0x2f);
  if (cVar1 != -1) {
    local_8._0_2_ = game_state.tribes_array[cVar1].x;
    local_8._2_2_ = game_state.tribes_array[cVar1].y;
    local_4 = *(undefined2 *)&game_state.tribes_array[cVar1].field_0x28;
    uVar5 = CONCAT22(local_8._2_2_,game_state.tribes_array[cVar1].angle_1 + 0x400);
    move_pos_angle_length(&local_8,uVar5 & 0xffff07ff,0x4000);
    uVar5 = (uint)(ushort)((short)local_8 - *(short *)(param_1 + 0x3d));
    uVar4 = (uint)(ushort)(local_8._2_2_ - *(short *)(param_1 + 0x3f));
    if (0x7fff < uVar5) {
      uVar5 = uVar5 - 0x10000;
    }
    if (0x7fff < uVar4) {
      uVar4 = uVar4 - 0x10000;
    }
    uVar3 = calc_angle_quadrant(uVar5,-uVar4);
    uVar3 = uVar3 & 0x7ff;
  }
  *(ushort *)(param_1 + 0x26) = uVar3;
  return;
}
