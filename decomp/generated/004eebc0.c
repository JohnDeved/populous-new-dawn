/* Ghidra 12.1.3 pseudocode; entry 004eebc0; FUN_004eebc0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


/* WARNING: Removing unreachable block (ram,0x004eec35) */
/* WARNING: Removing unreachable block (ram,0x004eec3f) */

uint FUN_004eebc0(char param_1,short *param_2)

{
  tribe_struct *ptVar1;
  int iVar2;
  uint uVar3;
  uint uVar4;
  undefined4 local_8;
  undefined2 local_4;

  iVar2 = (int)param_1;
  ptVar1 = game_state.tribes_array + iVar2;
  local_8._0_2_ = ptVar1->x;
  local_8._2_2_ = ptVar1->y;
  local_4 = *(undefined2 *)&game_state.tribes_array[iVar2].field_0x28;
  move_pos_angle_length
            (&local_8,CONCAT22((short)((uint)&ptVar1->x >> 0x10),
                               game_state.tribes_array[iVar2].angle_1 + 0x400) & 0xffff07ff,0x4000);
  uVar4 = (uint)(ushort)((short)local_8 - *param_2);
  uVar3 = (uint)(ushort)(local_8._2_2_ - param_2[1]);
  if (0x7fff < uVar4) {
    uVar4 = uVar4 - 0x10000;
  }
  if (0x7fff < uVar3) {
    uVar3 = uVar3 - 0x10000;
  }
  uVar4 = calc_angle_quadrant(uVar4,-uVar3);
  return uVar4 & 0xffff07ff;
}
