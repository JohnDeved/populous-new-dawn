/* Ghidra 12.1.3 pseudocode; entry 00422fc0; FUN_00422fc0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


/* WARNING: Removing unreachable block (ram,0x00423074) */
/* WARNING: Removing unreachable block (ram,0x0042307e) */

void FUN_00422fc0(void)

{
  short *psVar1;
  short sVar2;
  int iVar3;
  tribe_struct *ptVar4;
  char cVar5;
  ushort uVar6;
  int iVar7;
  undefined4 uVar8;
  int iVar9;
  short sVar10;
  uint uVar11;
  pnts_related_struct *ppVar12;
  temp_4_2B *ptVar13;
  temp_struct_57b *ptVar14;
  uint uVar15;
  undefined1 local_a0 [48];
  undefined1 local_70 [4];
  undefined1 local_6c [4];
  undefined1 local_68 [4];
  undefined1 local_64 [4];
  undefined1 local_60 [16];
  int local_50;
  uint local_4c;
  undefined4 local_48;
  int local_34;
  int local_30;
  int local_2c;
  int local_28;
  undefined4 local_24;
  undefined4 local_20;
  undefined4 local_1c;
  undefined4 local_18;
  undefined4 local_14;
  undefined4 local_10;
  undefined4 local_c;
  undefined4 local_8;
  undefined1 local_4;
  undefined1 local_3;

  if (DAT_0089c6e7 == '\t') {
    iVar7 = (int)player_tribe_num;
    ptVar4 = game_state.tribes_array + iVar7;
    psVar1 = &ptVar4->possible_coord_0;
    iVar9._0_2_ = ptVar4->possible_coord_0;
    iVar9._2_2_ = ptVar4->possible_coord_1;
    if ((iVar9 != -1) &&
       (iVar3._0_2_ = game_state.tribes_array[iVar7].possible_coord_2,
       iVar3._2_2_ = game_state.tribes_array[iVar7].possible_coord_3, iVar3 != -1)) {
      temp_pnts_related_counter_1 = 0;
      temp_4_2B_size_1 = 0;
      ptVar13 = temp_4_2B_ARRAY_006513f0;
      for (iVar9 = 0x20d0; iVar9 != 0; iVar9 = iVar9 + -1) {
        ptVar13->a = 0;
        ptVar13->b = 0;
        ptVar13 = (temp_4_2B *)&ptVar13->c;
      }
      INT_006513e8 = 0;
      ptVar14 = temp_struct_57b_ARRAY_00659730;
      for (iVar9 = 0x57b; iVar9 != 0; iVar9 = iVar9 + -1) {
        *(undefined4 *)ptVar14 = 0;
        ptVar14 = (temp_struct_57b *)&ptVar14->field_0x4;
      }
      *(undefined2 *)ptVar14 = 0;
      local_50 = (int)(short)game_state.tribes_array[iVar7].angle_1;
      local_3 = 1;
      uVar15 = (uint)(ushort)(game_state.tribes_array[iVar7].possible_coord_2 - *psVar1);
      uVar11 = (uint)(ushort)(game_state.tribes_array[iVar7].possible_coord_3 -
                             game_state.tribes_array[iVar7].possible_coord_1);
      if (0x7fff < uVar15) {
        uVar15 = uVar15 - 0x10000;
      }
      if (0x7fff < uVar11) {
        uVar11 = uVar11 - 0x10000;
      }
      uVar6 = calc_angle_quadrant(uVar15,-uVar11);
      local_4c = uVar6 & 0x7ff;
      local_48 = calc_distance_toroidal(psVar1,iVar7 * 0xc65 + 0x89da7f);
      uVar15 = local_4c;
      iVar9 = local_50;
      sVar10 = (short)local_50;
      uVar8 = angle_is_within_angle
                        (local_4c,CONCAT22((short)((uint)local_48 >> 0x10),sVar10) & 0xffff07ff);
      if ((char)uVar8 == '\0') {
        cVar5 = angle_is_within_angle
                          (uVar15,CONCAT22((short)((uint)uVar8 >> 0x10),sVar10 + 0x200) & 0xffff07ff
                          );
        if (cVar5 == '\0') {
          cVar5 = angle_is_within_angle
                            (uVar15,CONCAT22((short)((uint)iVar9 >> 0x10),sVar10 + 0x400) &
                                    0xffff07ff);
          local_4 = 2;
          if (cVar5 == '\0') {
            local_4 = 3;
          }
        }
        else {
          local_4 = 1;
        }
      }
      else {
        local_4 = 0;
      }
      create_line_wide(local_70,psVar1,local_50,local_4c,local_48);
      rotate_line(local_70,local_60,local_50);
      FUN_00423390(local_a0);
      FUN_00425060(local_a0);
      iVar9 = temp_pnts_related_counter_1;
      FUN_00423e80(local_a0,local_70,0,local_14);
      FUN_00423e80(local_a0,local_6c,0,local_10);
      FUN_00423e80(local_a0,local_68,0,local_c);
      FUN_00423e80(local_a0,local_64,0,local_8);
      local_34 = iVar9 + 1;
      local_30 = iVar9 + 2;
      local_2c = iVar9 + 3;
      local_28 = iVar9 + 4;
      FUN_00424320(local_a0,local_70,local_6c,local_24);
      FUN_00424320(local_a0,local_6c,local_68,local_20);
      FUN_00424320(local_a0,local_68,local_64,local_1c);
      FUN_00424320(local_a0,local_64,local_70,local_18);
      iVar9 = calc_squared_distance_toroidal(local_70,local_6c);
      if ((iVar9 < 0x401) ||
         (iVar9 = calc_squared_distance_toroidal(local_6c,local_68), iVar9 < 0x401)) {
        local_3 = 0;
      }
      FUN_00424ab0();
      ppVar12 = temp_pnts_related_array;
      FUN_00424eb0(local_a0);
      sVar10 = tribe_ptr->x;
      sVar2 = tribe_ptr->y;
      iVar9 = temp_pnts_related_counter_1;
      if (0 < temp_pnts_related_counter_1) {
        do {
          ppVar12 = ppVar12 + 1;
          iVar7 = calc_distance_1d_wraparound(ppVar12->x,(int)sVar10);
          ppVar12->x = iVar7 >> 1;
          iVar7 = calc_distance_1d_wraparound(ppVar12->z,(int)sVar2);
          ppVar12->z = iVar7 >> 1;
          coord_pnts_global_convert(ppVar12);
          iVar9 = iVar9 + -1;
        } while (iVar9 != 0);
      }
      FUN_00423900(local_a0,DAT_006513e0);
      FUN_00424900();
      FUN_00423900(local_a0,temp_4_2B_size_1);
      FUN_00424d30(local_a0);
    }
  }
  return;
}
