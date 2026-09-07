/* Ghidra 12.1.3 pseudocode; entry 00439d30; FUN_00439d30.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


/* WARNING: Removing unreachable block (ram,0x00439edb) */
/* WARNING: Removing unreachable block (ram,0x0043a05f) */
/* WARNING: Removing unreachable block (ram,0x0043a055) */
/* WARNING: Removing unreachable block (ram,0x0043a1ae) */
/* WARNING: Removing unreachable block (ram,0x00439ee5) */

uint FUN_00439d30(int param_1,int param_2)

{
  short *psVar1;
  undefined2 uVar2;
  unit_struct *puVar3;
  bool bVar4;
  short sVar5;
  uint in_EAX;
  uint uVar6;
  int iVar7;
  uint uVar8;
  ushort uVar9;
  undefined1 uVar10;
  unit_struct *puVar11;
  undefined2 local_12;
  short local_10;
  short local_e;
  uint local_c;
  undefined4 local_8;
  undefined2 local_4;

  uVar8 = in_EAX & 0xffffff00;
  local_12 = CONCAT11((char)((ushort)*(undefined2 *)(param_2 + 8) >> 8),
                      (char)((ushort)*(undefined2 *)(param_2 + 6) >> 8));
  puVar11 = (unit_struct *)0x0;
  uVar9 = (&game_state.level_data[0].unit_index_2)[((local_12 & 0xfe) * 2 | local_12 & 0xfe00) * 2]
          & 0x3ff;
  uVar10 = 0;
  if (((uVar9 != 0) && (puVar3 = unit_land_array[uVar9], (*(byte *)&puVar3->flags_2 & 1) == 0)) &&
     (puVar3->unit_class != '\0')) {
    puVar11 = puVar3;
  }
  if (puVar11 == (unit_struct *)0x0) {
    uVar10 = 1;
  }
  else {
    switch(*(undefined1 *)(param_1 + 0x2d)) {
    case 0:
      if ((*(uint *)(param_1 + 0xc) & 0x40000000) != 0) {
        *(uint *)(param_1 + 0xc) = *(uint *)(param_1 + 0xc) & 0xbfffffff;
        FUN_004d4f40(param_1);
        FUN_0040a6b0(puVar11,&local_10);
        FUN_004e9d80(param_1,&local_10);
        if ((*(uint *)(param_1 + 0x10) & 0x10000000) != 0) {
          *(uint *)(param_1 + 0x10) = *(uint *)(param_1 + 0x10) & 0xefffffff;
          FUN_004044b0(puVar11,&local_10);
          FUN_004e9d80(param_1,&local_10);
        }
      }
      uVar6 = (int)*(short *)(param_1 + 0x4f) - (int)*(short *)(param_1 + 0x3d);
      uVar8 = (int)uVar6 >> 0x1f;
      uVar8 = (uVar6 ^ uVar8) - uVar8;
      if ((0xb < (int)uVar8) ||
         (uVar8 = (int)*(short *)(param_1 + 0x51) - (int)*(short *)(param_1 + 0x3f),
         uVar6 = (int)uVar8 >> 0x1f, iVar7 = (uVar8 ^ uVar6) - uVar6,
         uVar8 = CONCAT31((int3)((uint)iVar7 >> 8),1), 0xb < iVar7)) {
        uVar8 = uVar8 & 0xffffff00;
      }
      if ((char)uVar8 != '\0') {
        *(undefined1 *)(param_1 + 0x2d) = 1;
        *(uint *)(param_1 + 0xc) = *(uint *)(param_1 + 0xc) | 0x40000000;
        return uVar8 & 0xffffff00;
      }
      break;
    case 1:
      if ((*(uint *)(param_1 + 0xc) & 0x40000000) != 0) {
        *(uint *)(param_1 + 0xc) = *(uint *)(param_1 + 0xc) & 0xbfffffff;
        FUN_004d4ee0(param_1);
        uVar8 = 1;
        *(undefined2 *)(param_1 + 0x70) = 10;
      }
      sVar5 = *(short *)(param_1 + 0x70) + -1;
      *(short *)(param_1 + 0x70) = sVar5;
      if (sVar5 < 1) {
        *(undefined1 *)(param_1 + 0x2d) = 2;
        *(uint *)(param_1 + 0xc) = *(uint *)(param_1 + 0xc) | 0x40000000;
      }
      else if (((*(byte *)(param_1 + 0x2e) & 3) == 0) || ((char)uVar8 != '\0')) {
        get_building_coords(puVar11,&local_10);
        uVar8 = (uint)(ushort)(local_10 - *(short *)(param_1 + 0x3d));
        uVar6 = (uint)(ushort)(local_e - *(short *)(param_1 + 0x3f));
        if (0x7fff < uVar8) {
          uVar8 = uVar8 - 0x10000;
        }
        if (0x7fff < uVar6) {
          uVar6 = uVar6 - 0x10000;
        }
        uVar9 = calc_angle_quadrant(uVar8,-uVar6);
        uVar9 = (uVar9 & 0x7ff) + 0x155 + (-(ushort)((*(byte *)(param_1 + 0x2e) & 4) == 0) & 0xfd56)
                & 0x7ff;
        if ((*(uint *)(param_1 + 0xc) & 0x80) != 0) {
          *(ushort *)(param_1 + 0x57) = uVar9;
        }
        *(ushort *)(param_1 + 0x5d) = uVar9;
        if ((*(uint *)(param_1 + 0xc) & 0x8000) == 0) {
          *(ushort *)(param_1 + 0x26) = uVar9;
        }
        else {
          *(ushort *)(param_1 + 0x26) = uVar9 + 0x400 & 0x7ff;
        }
        update_gs_unit_related_array_item(param_1);
        *(ushort *)(param_1 + 0x57) = uVar9;
        uVar8 = *(uint *)(param_1 + 0xc);
        *(uint *)(param_1 + 0xc) = uVar8 | 0x80;
        *(uint *)(param_1 + 0xc) = uVar8 | 0x1080;
      }
      iVar7 = FUN_00439c30(param_1);
      uVar8 = 0;
      if (iVar7 != 0) {
        uVar8 = FUN_004de7f0(param_1);
        return uVar8 & 0xffffff00;
      }
      break;
    case 2:
      if ((*(uint *)(param_1 + 0xc) & 0x40000000) != 0) {
        *(uint *)(param_1 + 0xc) = *(uint *)(param_1 + 0xc) & 0xbfffffff;
        FUN_0040a980(param_1,puVar11);
        unit_set_object_upper(param_1,0x65);
        *(undefined1 *)(param_1 + 0x39) = 0;
        *(undefined2 *)(param_1 + 0x37) = 1;
        *(ushort *)(param_1 + 0x70) =
             ((char)obj_related_array[*(byte *)(param_1 + 0x3a) + 3]._f2 + 1) *
             (ushort)(byte)vstart_related[*(short *)(param_1 + 0x33)].frame_counter;
      }
      sVar5 = *(short *)(param_1 + 0x70) + -1;
      *(short *)(param_1 + 0x70) = sVar5;
      if (sVar5 < 1) {
        get_building_coords(puVar11,&local_10);
        uVar8 = (uint)(ushort)(local_10 - *(short *)(param_1 + 0x3d));
        uVar6 = (uint)(ushort)(local_e - *(short *)(param_1 + 0x3f));
        if (0x7fff < uVar8) {
          uVar8 = uVar8 - 0x10000;
        }
        if (0x7fff < uVar6) {
          uVar6 = uVar6 - 0x10000;
        }
        uVar9 = calc_angle_quadrant(uVar8,-uVar6);
        local_4 = *(undefined2 *)(param_1 + 0x41);
        local_8 = *(undefined4 *)(param_1 + 0x3d);
        move_pos_angle_length(&local_8,uVar9 & 0x7ff,0x50);
        alloc_unit(7,0x1d,*(undefined1 *)(param_1 + 0x2f),&local_8);
        FUN_0048a050(param_1,0x36,0);
        *(undefined1 *)(param_1 + 0x2d) = 3;
        *(uint *)(param_1 + 0xc) = *(uint *)(param_1 + 0xc) | 0x40000000;
      }
      iVar7 = FUN_00439c30(param_1);
      uVar8 = 0;
      if (iVar7 != 0) {
        uVar8 = FUN_004de7f0(param_1);
        return uVar8 & 0xffffff00;
      }
      break;
    case 3:
      uVar8 = *(uint *)(param_1 + 0xc);
      if ((uVar8 & 0x40000000) != 0) {
        *(byte *)(param_1 + 0x76) = *(byte *)(param_1 + 0x76) | 0x10;
        *(undefined2 *)(param_1 + 0x70) = 8;
        *(undefined1 *)(param_1 + 0xa8) = 0;
        uVar8 = uVar8 & 0xbfffffff;
        *(uint *)(param_1 + 0xc) = uVar8;
      }
      bVar4 = false;
      uVar9 = *(ushort *)(param_1 + 0x76);
      uVar8 = CONCAT22((short)(uVar8 >> 0x10),uVar9);
      if ((uVar9 & 0x10) != 0) {
        *(ushort *)(param_1 + 0x76) = uVar9 & 0xffef;
        FUN_004d4f40(param_1);
        sVar5 = *(short *)(param_1 + 0x5d);
        update_gs_unit_related_array_item(param_1);
        *(ushort *)(param_1 + 0x57) = sVar5 + 0x400U & 0x7ff;
        uVar8 = *(uint *)(param_1 + 0xc);
        *(uint *)(param_1 + 0xc) = uVar8 | 0x80;
        uVar8 = uVar8 | 0x1080;
        *(uint *)(param_1 + 0xc) = uVar8;
      }
      *(uint *)(param_1 + 0xc) = *(uint *)(param_1 + 0xc) | 0x8000;
      psVar1 = (short *)(param_1 + 0x70);
      *psVar1 = *psVar1 + -1;
      if (*psVar1 == 0) {
        FUN_004d4ee0(param_1);
        uVar2 = *(undefined2 *)(param_1 + 0x5d);
        uVar6 = *(uint *)(param_1 + 0xc);
        uVar8 = uVar6 & 0xffff7fff;
        *(uint *)(param_1 + 0xc) = uVar8;
        if ((uVar6 & 0x80) != 0) {
          *(undefined2 *)(param_1 + 0x57) = uVar2;
        }
        *(undefined2 *)(param_1 + 0x5d) = uVar2;
        bVar4 = true;
        *(undefined2 *)(param_1 + 0x26) = uVar2;
      }
      if (bVar4) {
        FUN_0040a980(param_1,puVar11);
        uVar8 = FUN_00408cb0(puVar11,*(undefined1 *)(param_1 + 0x2f));
        *(undefined1 *)(param_1 + 0x2d) = 4;
        *(uint *)(param_1 + 0xc) = *(uint *)(param_1 + 0xc) | 0x40000000;
        return uVar8 & 0xffffff00;
      }
      break;
    case 4:
      uVar8 = *(uint *)(param_1 + 0xc);
      if ((uVar8 & 0x40000000) != 0) {
        *(undefined2 *)(param_1 + 0x70) = 0x18;
        *(uint *)(param_1 + 0xc) = uVar8 & 0xbfffffff;
        FUN_004d4ee0(param_1);
        FUN_0040a980(param_1,puVar11);
        if (((game_state.tribes_array[*(char *)(param_1 + 0x2f)].field_0xc1f != '\x01') &&
            (uVar8 = game_state.pseudo_random_val * 0x24a1 + 0x24df,
            game_state.pseudo_random_val = uVar8 >> 0xd | uVar8 * 0x80000,
            local_c = game_state.pseudo_random_val,
            game_state.pseudo_random_val % 100 <
            (uint)*(byte *)(game_state.start_n1 +
                           (char)game_state.tribes_array[(char)puVar11->tribe_index].tribe_num * 0xc
                           + -2))) && (((byte)land_flags_1 & 8) == 0)) {
          FUN_004de7f0(param_1);
        }
        uVar8 = FUN_004da170(param_1);
      }
      sVar5 = *(short *)(param_1 + 0x70) + -1;
      uVar8 = CONCAT22((short)(uVar8 >> 0x10),sVar5);
      *(short *)(param_1 + 0x70) = sVar5;
      if (sVar5 < 1) {
        return CONCAT31((int3)(uVar8 >> 8),1);
      }
    }
  }
  return CONCAT31((int3)(uVar8 >> 8),uVar10);
}
