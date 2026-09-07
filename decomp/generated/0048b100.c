/* Ghidra 12.1.3 pseudocode; entry 0048b100; FUN_0048b100.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


/* WARNING: Removing unreachable block (ram,0x0048b23c) */
/* WARNING: Removing unreachable block (ram,0x0048b246) */

undefined4 FUN_0048b100(int param_1,char param_2)

{
  unit_struct *puVar1;
  tribe_struct *ptVar2;
  ushort uVar3;
  int iVar4;
  uint uVar5;
  unit_struct *puVar6;
  uint uVar7;
  short local_c;
  short local_a;
  undefined4 local_8;
  undefined2 local_4;

  ptVar2 = tribe_ptr;
  puVar6 = (unit_struct *)0x0;
  if (((*(ushort *)(param_1 + 0xc) != 0) &&
      (puVar1 = unit_land_array[*(ushort *)(param_1 + 0xc)], (*(byte *)&puVar1->flags_2 & 1) == 0))
     && (puVar1->unit_class != '\0')) {
    puVar6 = puVar1;
  }
  if (puVar6 == (unit_struct *)0x0) {
    *(undefined1 *)(param_1 + 0x16) = 0;
    return 0;
  }
  local_8._0_2_ = tribe_ptr->x;
  local_8._2_2_ = tribe_ptr->y;
  local_4 = *(undefined2 *)&tribe_ptr->field_0x28;
  move_pos_angle_length
            (&local_8,CONCAT22((short)((uint)&local_8 >> 0x10),tribe_ptr->angle_1),0xfffff000);
  local_c = (short)local_8;
  local_a = local_8._2_2_;
  iVar4 = calc_squared_distance_toroidal(&puVar6->pos,&local_c);
  if ((*(short *)(param_1 + 0x10) == 0x19) &&
     (game_state.tribes_array[player_tribe_num].shaman == puVar6)) {
    if (iVar4 < 0x9000001) goto LAB_0048b1f1;
    iVar4 = 0x6c00000;
  }
  if (0x9000000 < iVar4) {
    *(undefined1 *)(param_1 + 0x16) = 0;
    *(undefined1 *)(param_1 + 0x15) = 0x40;
    if (param_2 != '\0') {
      FUN_0048b010(param_1,0);
    }
    return 0;
  }
LAB_0048b1f1:
  uVar5 = (0x9000000U - iVar4) / 0x900;
  *(char *)(param_1 + 0x16) = (char)(*(byte *)(param_1 + 0x14) * uVar5 >> 0x10);
  *(char *)(param_1 + 0x28) = (char)(uVar5 * 0x7f >> 0x10);
  uVar5 = (uint)(ushort)(local_c - (puVar6->pos).x);
  uVar7 = (uint)(ushort)(local_a - (puVar6->pos).y);
  if (0x7fff < uVar5) {
    uVar5 = uVar5 - 0x10000;
  }
  if (0x7fff < uVar7) {
    uVar7 = uVar7 - 0x10000;
  }
  uVar3 = calc_angle_quadrant(uVar5,-uVar7);
  uVar3 = (uVar3 & 0x7ff) - (ptVar2->angle_1 + 0x200) & 0x7ff;
  if (uVar3 < 0x400) {
    *(char *)(param_1 + 0x15) = (char)(uVar3 >> 3);
  }
  else {
    *(char *)(param_1 + 0x15) = (char)((int)(0x7ff - (uint)uVar3) >> 3);
  }
  return 1;
}
