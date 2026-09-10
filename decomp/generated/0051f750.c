/* Ghidra 12.1.3 pseudocode; entry 0051f750; FUN_0051f750.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


/* WARNING: Removing unreachable block (ram,0x0051f7a2) */
/* WARNING: Removing unreachable block (ram,0x0051f7ac) */

void FUN_0051f750(int param_1,unit_struct *param_2,short *param_3)

{
  unit_struct *puVar1;
  bool bVar2;
  bool bVar3;
  char cVar4;
  ushort uVar5;
  uint uVar6;
  uint uVar7;
  int iVar8;
  int iVar9;
  undefined2 local_1a;
  int local_18;
  uint local_10;
  short local_8;
  short sStack_6;
  undefined2 local_4;

  local_18 = 0;
  bVar3 = false;
  do {
    if (bVar3) goto LAB_0051f964;
    if (local_18 == 0) {
      uVar7 = (uint)(ushort)((param_2->pos).x - *(short *)(param_1 + 0x3d));
      uVar6 = (uint)(ushort)((param_2->pos).y - *(short *)(param_1 + 0x3f));
      if (0x7fff < uVar7) {
        uVar7 = uVar7 - 0x10000;
      }
      if (0x7fff < uVar6) {
        uVar6 = uVar6 - 0x10000;
      }
      uVar5 = calc_angle_quadrant(uVar7,-uVar6);
      local_10 = uVar5 & 0x7ff;
    }
    else if (local_18 == 1) {
      uVar6 = game_state.pseudo_random_val * 0x24a1 + 0x24df;
      uVar7 = uVar6 >> 0xd;
      game_state.pseudo_random_val = uVar7 | uVar6 * 0x80000;
      local_10 = (uVar7 & 0x1f) << 6;
    }
    iVar9 = 0;
    iVar8 = -1;
    local_10 = local_10 & 0xffffffc0;
    do {
      iVar9 = iVar9 + 1;
      local_8 = (short)*(undefined4 *)(param_1 + 0x3d);
      sStack_6 = (short)((uint)*(undefined4 *)(param_1 + 0x3d) >> 0x10);
      local_4 = *(undefined2 *)(param_1 + 0x41);
      move_pos_angle_length(&local_8,(iVar9 / 2) * iVar8 * 0x40 + local_10 & 0x7ff,0x1c0);
      local_4 = calc_point_height(CONCAT22(sStack_6,local_8),CONCAT22(local_4,sStack_6));
      cVar4 = FUN_005178d0(param_2,&local_8);
      if (cVar4 == '\0') {
        bVar2 = false;
        if (local_18 == 0) {
          local_1a = CONCAT11((char)((ushort)sStack_6 >> 8),(char)((ushort)local_8 >> 8));
          for (puVar1 = unit_land_array
                        [(short)(&game_state.level_data[0].unit_index)
                                [((local_1a & 0xfe) * 2 | local_1a & 0xfe00) * 2]];
              puVar1 != (unit_struct *)0x0; puVar1 = unit_land_array[puVar1->next_unit_index]) {
            if (((param_2 != puVar1) && ((puVar1->pos).x == local_8)) &&
               ((puVar1->pos).y == sStack_6)) {
              bVar2 = true;
              break;
            }
          }
        }
        if (!bVar2) {
          bVar3 = true;
          break;
        }
      }
      iVar8 = -iVar8;
    } while (iVar9 < 0x20);
    local_18 = local_18 + 1;
  } while (local_18 < 2);
  if (!bVar3) {
    local_8 = (short)*(undefined4 *)(param_1 + 0x3d);
    sStack_6 = (short)((uint)*(undefined4 *)(param_1 + 0x3d) >> 0x10);
  }
LAB_0051f964:
  *param_3 = local_8;
  param_3[1] = sStack_6;
  return;
}
