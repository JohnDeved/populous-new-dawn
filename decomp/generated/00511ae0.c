/* Ghidra 12.1.3 pseudocode; entry 00511ae0; FUN_00511ae0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


/* WARNING: Removing unreachable block (ram,0x00511ca7) */
/* WARNING: Removing unreachable block (ram,0x00511cb1) */

void FUN_00511ae0(int param_1)

{
  byte bVar1;
  unit_struct *puVar2;
  bool bVar3;
  short sVar4;
  ushort uVar5;
  short sVar6;
  uint uVar7;
  uint uVar8;
  int iVar9;
  int iVar10;
  int iVar11;
  undefined4 extraout_ECX;
  undefined4 uVar12;
  short *psVar13;
  uint uVar14;
  ushort local_42;
  int local_40;
  uint local_3c;
  int local_30;
  int local_28;
  undefined4 local_10;
  undefined2 local_c;
  short local_8;
  short local_6;
  short local_4;

  sVar4 = *(short *)(param_1 + 0x6c) + 1;
  uVar14 = *(uint *)(param_1 + 0x72);
  *(short *)(param_1 + 0x6c) = sVar4;
  bVar3 = false;
  if (sVar4 == 1) {
    local_10 = *(undefined4 *)(param_1 + 0x57);
    local_c = *(undefined2 *)(param_1 + 0x5b);
    local_42 = CONCAT11((char)((uint)local_10 >> 0x18),(char)((uint)local_10 >> 8)) & 0xfefe;
    uVar7 = (local_42 & 0xfe) * 2 | local_42 & 0xfe00;
    uVar8 = (ushort)(&game_state.level_data[0].unit_index_2)[uVar7 * 2] & 0x3ff;
    puVar2 = unit_land_array[uVar8];
    if ((puVar2 != (unit_struct *)0x0) && (puVar2->unit_class == '\x02')) {
      FUN_00408cb0(puVar2,CONCAT31((int3)(uVar8 >> 8),*(undefined1 *)(param_1 + 0x2f)));
    }
    for (puVar2 = unit_land_array[(short)(&game_state.level_data[0].unit_index)[uVar7 * 2]];
        puVar2 != (unit_struct *)0x0; puVar2 = unit_land_array[puVar2->next_unit_index]) {
      if (((puVar2->unit_class == '\x05') && ((*(byte *)&puVar2->loc_4_z & 4) == 0)) &&
         ((unit_type_array_scenery[(byte)puVar2->unit_type].flags_1 & 0x20) != 0)) {
        bVar3 = true;
        FUN_004a7b60(puVar2,0,0);
      }
    }
    if ((!bVar3) && (iVar9 = alloc_unit(5,10,*(undefined1 *)(param_1 + 0x2f),&local_10), iVar9 != 0)
       ) {
      FUN_004a8c60(iVar9,0x18);
    }
    iVar9 = alloc_unit(7,1,*(undefined1 *)(param_1 + 0x2f),&local_10);
    if (iVar9 != 0) {
      *(undefined4 *)(iVar9 + 0x68) = 3;
      *(undefined2 *)(iVar9 + 0x70) = 2;
      *(undefined2 *)(iVar9 + 0x72) = 5;
      *(undefined2 *)(iVar9 + 0x78) = 0x62;
      *(undefined2 *)(iVar9 + 0x74) = 0x8c;
      *(undefined1 *)(iVar9 + 0x7b) = 1;
      *(undefined1 *)(iVar9 + 0x7d) = 1;
      *(undefined2 *)(iVar9 + 0x76) = 2;
      *(int *)(iVar9 + 0x6c) = (int)*(short *)(iVar9 + 0x72) << 8;
    }
  }
  sVar4 = calc_point_height(*(undefined2 *)(param_1 + 0x3d),*(undefined2 *)(param_1 + 0x3f));
  local_30 = 0;
  iVar9 = (int)(0x400 / (longlong)(int)(*(byte *)(param_1 + 0x76) - 1));
  uVar7 = (uint)(ushort)(*(short *)(param_1 + 0x57) - *(short *)(param_1 + 0x3d));
  uVar8 = (uint)(ushort)(*(short *)(param_1 + 0x59) - *(short *)(param_1 + 0x3f));
  if (0x7fff < uVar7) {
    uVar7 = uVar7 - 0x10000;
  }
  if (0x7fff < uVar8) {
    uVar8 = uVar8 - 0x10000;
  }
  uVar5 = calc_angle_quadrant(uVar7,-uVar8);
  iVar10 = calc_distance_toroidal(param_1 + 0x3d,(short *)(param_1 + 0x57));
  bVar1 = *(byte *)(param_1 + 0x76);
  local_40 = 0;
  if (*(char *)(param_1 + 0x76) != '\0') {
    local_3c = local_3c & 0xffff0000;
    local_28 = 0;
    psVar13 = (short *)(param_1 + 0x78);
    do {
      iVar11 = ((int)(local_28 + (local_28 >> 0x1f & 0x3ffU)) >> 10) + 200;
      if (local_40 == 0) {
        uVar14 = uVar14 * 0x24a1 + 0x24df;
        uVar7 = uVar14 >> 0xd | uVar14 * 0x80000;
        uVar14 = uVar7;
      }
      else {
        uVar7 = game_state.pseudo_random_val * 0x24a1 + 0x24df;
        uVar7 = uVar7 >> 0xd | uVar7 * 0x80000;
        game_state.pseudo_random_val = uVar7;
      }
      *psVar13 = *(short *)(param_1 + 0x3d);
      psVar13[1] = *(short *)(param_1 + 0x3f);
      move_pos_angle_length(psVar13,uVar5 & 0x7ff,local_3c);
      local_40 = local_40 + 1;
      *psVar13 = *psVar13 + (short)((uint)(maybe_cos[uVar7 & 0x7ff] * iVar11) >> 0x10);
      local_28 = local_28 + iVar9 * -200;
      psVar13[1] = psVar13[1] + (short)((uint)(maybe_sin[uVar7 & 0x7ff] * iVar11) >> 0x10);
      sVar6 = sVar4 - (short)local_30;
      local_30 = local_30 + iVar9;
      psVar13[2] = sVar6 + 0x400;
      local_3c = CONCAT22(local_3c._2_2_,(short)local_3c + (short)(iVar10 / (int)(bVar1 - 1)));
      psVar13 = psVar13 + 3;
    } while (local_40 < (int)(uint)*(byte *)(param_1 + 0x76));
  }
  psVar13 = (short *)(param_1 + 0x78);
  iVar9 = 0;
  uVar12 = *(undefined4 *)(param_1 + 0x3d);
  *(undefined4 *)psVar13 = uVar12;
  *(undefined2 *)(param_1 + 0x7c) = *(undefined2 *)(param_1 + 0x41);
  if (*(byte *)(param_1 + 0x76) != 1 && -1 < (int)(*(byte *)(param_1 + 0x76) - 1)) {
    do {
      local_8 = *psVar13;
      local_4 = psVar13[2];
      local_6 = psVar13[1];
      iVar10 = alloc_unit(7,0x2a,CONCAT31((int3)(CONCAT22((short)((uint)uVar12 >> 0x10),local_4) >>
                                                8),*(undefined1 *)(param_1 + 0x2f)),&local_8);
      uVar12 = extraout_ECX;
      if (iVar10 != 0) {
        *(short *)(iVar10 + 0x49) = psVar13[3] - *psVar13;
        *(short *)(iVar10 + 0x4d) = psVar13[4] - psVar13[1];
        uVar12 = CONCAT22((short)((uint)extraout_ECX >> 0x10),psVar13[5] - psVar13[2]);
        *(short *)(iVar10 + 0x4b) = psVar13[5] - psVar13[2];
      }
      psVar13 = psVar13 + 3;
      iVar9 = iVar9 + 1;
    } while (iVar9 < (int)(*(byte *)(param_1 + 0x76) - 1));
  }
  if (2 < *(short *)(param_1 + 0x6c)) {
    update_after_unit_alloc(param_1);
  }
  return;
}
