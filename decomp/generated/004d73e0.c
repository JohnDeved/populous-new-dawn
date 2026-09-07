/* Ghidra 12.1.3 pseudocode; entry 004d73e0; FUN_004d73e0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


/* WARNING: Removing unreachable block (ram,0x004d7c2c) */
/* WARNING: Removing unreachable block (ram,0x004d7c36) */

undefined1 FUN_004d73e0(int param_1)

{
  byte bVar1;
  unit_struct *puVar2;
  bool bVar3;
  bool bVar4;
  char cVar5;
  short sVar6;
  int iVar7;
  uint uVar8;
  short *psVar9;
  undefined2 extraout_var;
  int iVar10;
  ushort uVar11;
  uint uVar12;
  undefined4 uVar13;
  undefined1 local_2d;
  ushort local_2c;
  ushort local_2a;
  ushort local_28;
  ushort local_26;
  short local_20;
  short local_1e;
  uint local_1c;
  short local_10;
  short local_e;
  short local_c;
  short local_a;
  short local_8;
  short sStack_6;
  undefined2 local_4;

  bVar4 = false;
  local_2d = 0;
  iVar7 = FUN_004f2480(param_1);
  if ((iVar7 == 0) && ((*(byte *)(param_1 + 0x11) & 8) == 0)) {
    *(short *)(param_1 + 0x87) = *(short *)(param_1 + 0x87) + 1;
  }
  if ((*(uint *)(param_1 + 0xc) & 0x2004) != 0) {
    cVar5 = FUN_00432da0(param_1 + 0x3d,0x38,param_1 + 0x4f,0x200);
    if (cVar5 != '\0') {
      return 0;
    }
    return *(undefined1 *)(param_1 + 0x7d);
  }
  if (*(char *)(param_1 + 0x2d) == '\0') {
    if (((*(byte *)(param_1 + 0x82) & 0xf) == 0) ||
       (cVar5 = FUN_004d5420(param_1,param_1 + 0x80), cVar5 == '\0')) {
      cVar5 = FUN_004d5120(param_1);
      if (cVar5 == '\0') {
        local_2d = 1;
      }
      else {
        FUN_004d5650(param_1 + 0x80,&local_c);
        uVar8 = (int)local_c - (int)*(short *)(param_1 + 0x3d);
        uVar12 = (int)uVar8 >> 0x1f;
        if ((0x2f < (int)((uVar8 ^ uVar12) - uVar12)) ||
           (uVar8 = (int)local_a - (int)*(short *)(param_1 + 0x3f), uVar12 = (int)uVar8 >> 0x1f,
           bVar3 = true, 0x2f < (int)((uVar8 ^ uVar12) - uVar12))) {
          bVar3 = false;
        }
        if (bVar3) {
          *(undefined1 *)(param_1 + 0x2d) = 3;
        }
        else {
          *(undefined1 *)(param_1 + 0x2d) = 1;
        }
      }
    }
    else {
      *(undefined1 *)(param_1 + 0x2d) = 1;
    }
  }
  if (*(char *)(param_1 + 0x2d) == '\x01') {
    uVar8 = *(uint *)(param_1 + 0xc);
    *(undefined1 *)(param_1 + 0x2d) = 2;
    *(uint *)(param_1 + 0xc) = uVar8 | 0x200000;
    *(uint *)(param_1 + 0xc) = uVar8 | 0x200200;
    FUN_004d6660(param_1);
    FUN_004d3ff0(param_1,(-(uint)(*(short *)(param_1 + 0x78) == 0) & 0xfffffffc) + 5);
    local_26 = *(ushort *)(param_1 + 0x80) & 0xfefe;
    bVar1 = *(byte *)(param_1 + 0x82);
    psVar9 = DAT_00895ef1;
    if ((bVar1 & 0xf0) != 0) {
      psVar9 = *(short **)(&DAT_00895ed9 + (uint)(bVar1 >> 4) * 4);
    }
    local_20 = ((*(ushort *)(param_1 + 0x80) & 0xfe) + 1) * 0x100 + psVar9[(uint)(bVar1 & 0xf) * 2];
    local_1e = ((local_26 >> 8) + 1) * 0x100 + (psVar9 + (uint)(bVar1 & 0xf) * 2)[1];
    uVar8 = (int)local_20 - (int)*(short *)(param_1 + 0x3d);
    uVar12 = (int)uVar8 >> 0x1f;
    if (((int)((uVar8 ^ uVar12) - uVar12) < 0xd8) &&
       (uVar8 = (int)local_1e - (int)*(short *)(param_1 + 0x3f), uVar12 = (int)uVar8 >> 0x1f,
       (int)((uVar8 ^ uVar12) - uVar12) < 0xd8)) {
      *(uint *)(param_1 + 0xc) = *(uint *)(param_1 + 0xc) | 0x20;
    }
    else {
      *(uint *)(param_1 + 0xc) = *(uint *)(param_1 + 0xc) & 0xffffffdf;
    }
    FUN_004e9dd0(param_1,&local_20);
LAB_004d75b9:
    bVar4 = true;
    cVar5 = FUN_004d5420(param_1,param_1 + 0x80);
    if (cVar5 == '\0') {
      *(undefined1 *)(param_1 + 0x2d) = 0;
    }
    else {
      FUN_004d5650(param_1 + 0x80,&local_10);
      uVar8 = (int)local_10 - (int)*(short *)(param_1 + 0x3d);
      uVar12 = (int)uVar8 >> 0x1f;
      if ((0x2f < (int)((uVar8 ^ uVar12) - uVar12)) ||
         (uVar8 = (int)local_e - (int)*(short *)(param_1 + 0x3f), uVar12 = (int)uVar8 >> 0x1f,
         bVar3 = true, 0x2f < (int)((uVar8 ^ uVar12) - uVar12))) {
        bVar3 = false;
      }
      if (bVar3) {
        *(undefined1 *)(param_1 + 0x2d) = 3;
      }
    }
    if (*(char *)(param_1 + 0x2d) != '\x02') {
      uVar11 = *(ushort *)(param_1 + 0x5d);
      uVar8 = *(uint *)(param_1 + 0xc);
      if ((uVar8 & 0x80) != 0) {
        *(ushort *)(param_1 + 0x57) = uVar11;
      }
      *(ushort *)(param_1 + 0x5d) = uVar11;
      if ((uVar8 & 0x8000) != 0) {
        uVar11 = uVar11 + 0x400 & 0x7ff;
      }
      *(ushort *)(param_1 + 0x26) = uVar11;
      *(uint *)(param_1 + 0xc) = uVar8 & 0xffffffdf;
      *(uint *)(param_1 + 0xc) = uVar8 & 0xffdfffdf;
      *(uint *)(param_1 + 0xc) = uVar8 & 0xffdffddf;
    }
  }
  else if (*(char *)(param_1 + 0x2d) == '\x02') goto LAB_004d75b9;
  switch(*(byte *)(param_1 + 0x2d) - 3) {
  case 0:
    bVar1 = *(byte *)(param_1 + 0x82);
    uVar11 = *(ushort *)(param_1 + 0x80);
    *(undefined1 *)(param_1 + 0x2d) = 4;
    *(undefined2 *)(param_1 + 0x70) = 10;
    local_28 = uVar11 & 0xfefe;
    psVar9 = DAT_00895ef1;
    if ((bVar1 & 0xf0) != 0) {
      psVar9 = *(short **)(&DAT_00895ed9 + (uint)(bVar1 >> 4) * 4);
    }
    local_20 = ((uVar11 & 0xfe) + 1) * 0x100 + psVar9[(uint)(bVar1 & 0xf) * 2];
    local_1e = ((local_28 >> 8) + 1) * 0x100 + (psVar9 + (uint)(bVar1 & 0xf) * 2)[1];
    uVar13 = CONCAT22(sStack_6,local_20);
    local_8 = local_20;
    sStack_6 = local_1e;
    local_4 = calc_point_height(uVar13,CONCAT22(local_4,local_1e));
    add_unit_to_cell(param_1,&local_8);
    *(undefined2 *)(param_1 + 0x5f) = 0;
    *(uint *)(param_1 + 0x10) = *(uint *)(param_1 + 0x10) & 0xfffffbff;
    FUN_004d3ff0(param_1,(*(short *)(param_1 + 0x78) == 0) - 1U & 4);
    if (0x10 < (*(byte *)(param_1 + 0x82) & 0xf0)) {
      uVar11 = *(ushort *)(param_1 + 0x80);
      local_2a = uVar11 & 0xfefe;
      psVar9 = DAT_00895ef1;
      if ((*(byte *)(param_1 + 0x82) & 0xf0) != 0) {
        psVar9 = *(short **)(&DAT_00895ed9 + (uint)(*(byte *)(param_1 + 0x82) >> 4) * 4);
      }
      local_20 = ((uVar11 & 0xfe) + 1) * 0x100 + *psVar9;
      local_1e = ((local_2a >> 8) + 1) * 0x100 + psVar9[1];
      FUN_004e9dd0(param_1,&local_20);
      uVar11 = *(ushort *)(param_1 + 0x5d);
      if ((*(uint *)(param_1 + 0xc) & 0x80) != 0) {
        *(ushort *)(param_1 + 0x57) = uVar11;
      }
      *(ushort *)(param_1 + 0x5d) = uVar11;
      if ((*(uint *)(param_1 + 0xc) & 0x8000) != 0) {
        uVar11 = uVar11 + 0x400 & 0x7ff;
      }
      *(ushort *)(param_1 + 0x26) = uVar11;
    }
  case 1:
    sVar6 = *(short *)(param_1 + 0x70) + -1;
    *(short *)(param_1 + 0x70) = sVar6;
    bVar4 = true;
    if (sVar6 == 0) {
      *(uint *)(param_1 + 0xc) = *(uint *)(param_1 + 0xc) | 0x40000000;
      iVar7 = (int)*(short *)(param_1 + 0x78);
      *(undefined1 *)(param_1 + 0x2d) = 5;
      if (iVar7 != 0) {
        if (0 < iVar7) {
          do {
            iVar10 = alloc_unit(5,0xb,0xff,param_1 + 0x3d);
            if (iVar10 == 0) break;
            iVar7 = iVar7 + -100;
            FUN_0048a050(param_1,0xb,0);
          } while (0 < iVar7);
        }
        if (iVar7 < 0) {
          iVar7 = 0;
        }
        *(short *)(param_1 + 0x78) = (short)iVar7;
      }
      FUN_004d3ea0(param_1);
      FUN_004d56f0(CONCAT22(extraout_var,*(undefined2 *)(param_1 + 0x80)));
      bVar4 = true;
    }
    break;
  case 2:
    bVar4 = true;
    uVar8 = *(uint *)(param_1 + 0xc);
    if ((uVar8 & 0x40000000) != 0) {
      *(uint *)(param_1 + 0xc) = uVar8 & 0xbfffffff;
      uVar11 = (*(short *)(param_1 + 0x78) == 0) - 1 & 4;
      if (((uVar8 & 0x80000) != 0) && (uVar11 = 0xc, (*(byte *)(param_1 + 0x11) & 4) == 0)) {
        uVar11 = 2;
        *(uint *)(param_1 + 0xc) = uVar8 & 0xbfff7fff;
      }
      unit_set_object_upper
                (param_1,unit_type_to_obj_indexes_map
                         [(uint)*(byte *)(param_1 + 0x2b) + (short)uVar11 * 9]);
    }
    if ((*(byte *)(param_1 + 0x2e) & 0x1f) == 0) {
      uVar12 = game_state.pseudo_random_val * 0x24a1 + 0x24df;
      uVar8 = uVar12 >> 0xd;
      game_state.pseudo_random_val = uVar8 | uVar12 * 0x80000;
      if (0x12 < ((byte)uVar8 & 0x1f)) {
        *(undefined1 *)(param_1 + 0x2d) = 6;
        *(uint *)(param_1 + 0xc) = *(uint *)(param_1 + 0xc) | 0x40000000;
      }
      uVar12 = game_state.pseudo_random_val * 0x24a1 + 0x24df;
      uVar8 = uVar12 >> 0xd;
      game_state.pseudo_random_val = uVar8 | uVar12 * 0x80000;
      if (0x3c < ((byte)uVar8 & 0x3f)) {
        *(undefined1 *)(param_1 + 0x2d) = 10;
        *(uint *)(param_1 + 0xc) = *(uint *)(param_1 + 0xc) | 0x40000000;
      }
    }
    break;
  case 3:
    *(undefined1 *)(param_1 + 0x2d) = 7;
    uVar8 = game_state.pseudo_random_val * 0x24a1 + 0x24df;
    local_1c = uVar8 >> 0xd | uVar8 * 0x80000;
    uVar11 = (short)((ulonglong)local_1c % 0x1c) + 4;
    game_state.pseudo_random_val = local_1c;
    *(ushort *)(param_1 + 0x70) = uVar11;
    sVar6 = *(short *)(param_1 + 0x5d);
    update_gs_unit_related_array_item(param_1);
    *(ushort *)(param_1 + 0x57) = sVar6 + (-(ushort)((uVar11 & 1) == 0) & 64000) + 0x300 & 0x7ff;
    uVar8 = *(uint *)(param_1 + 0xc);
    *(uint *)(param_1 + 0xc) = uVar8 | 0x80;
    *(uint *)(param_1 + 0xc) = uVar8 | 0x1080;
    *(uint *)(param_1 + 0xc) = uVar8 | 0x201080;
  case 4:
    sVar6 = *(short *)(param_1 + 0x70) + -1;
    *(short *)(param_1 + 0x70) = sVar6;
    bVar4 = true;
    if (sVar6 == 0) {
      *(undefined1 *)(param_1 + 0x2d) = 5;
      *(uint *)(param_1 + 0xc) = *(uint *)(param_1 + 0xc) | 0x40000000;
      local_2c = *(ushort *)(param_1 + 0x80) & 0xfefe;
      psVar9 = DAT_00895ef1;
      if ((*(byte *)(param_1 + 0x82) & 0xf0) != 0) {
        psVar9 = *(short **)(&DAT_00895ed9 + (uint)(*(byte *)(param_1 + 0x82) >> 4) * 4);
      }
      local_20 = ((*(ushort *)(param_1 + 0x80) & 0xfe) + 1) * 0x100 + *psVar9;
      local_1e = ((local_2c >> 8) + 1) * 0x100 + psVar9[1];
      FUN_004e9dd0(param_1,&local_20);
      *(uint *)(param_1 + 0xc) = *(uint *)(param_1 + 0xc) & 0xffdfffff;
    }
    break;
  case 5:
    uVar8 = *(uint *)(param_1 + 0xc);
    if ((uVar8 & 0x40000000) != 0) {
      *(undefined2 *)(param_1 + 0x5f) = 0;
      *(uint *)(param_1 + 0xc) = uVar8 & 0xbfffffff;
      uVar11 = (*(short *)(param_1 + 0x78) == 0) - 1 & 4;
      if (((uVar8 & 0x80000) != 0) && (uVar11 = 0xc, (*(byte *)(param_1 + 0x11) & 4) == 0)) {
        uVar11 = 2;
        *(uint *)(param_1 + 0xc) = uVar8 & 0xbfff7fff;
      }
      unit_set_object_upper
                (param_1,unit_type_to_obj_indexes_map
                         [(uint)*(byte *)(param_1 + 0x2b) + (short)uVar11 * 9]);
      iVar7 = (int)*(short *)(param_1 + 0x78);
      if (iVar7 != 0) {
        if (0 < iVar7) {
          do {
            iVar10 = alloc_unit(5,0xb,0xff,param_1 + 0x3d);
            if (iVar10 == 0) break;
            iVar7 = iVar7 + -100;
            FUN_0048a050(param_1,0xb,0);
          } while (0 < iVar7);
        }
        if (iVar7 < 0) {
          iVar7 = 0;
        }
        *(short *)(param_1 + 0x78) = (short)iVar7;
      }
    }
    break;
  case 6:
    if ((*(uint *)(param_1 + 0xc) & 0x40000000) != 0) {
      *(undefined2 *)(param_1 + 0x70) = 0x20;
      *(undefined1 *)(param_1 + 0xa8) = 1;
      *(uint *)(param_1 + 0xc) = *(uint *)(param_1 + 0xc) & 0xbfffffff;
      *(byte *)(param_1 + 0x76) = *(byte *)(param_1 + 0x76) | 0x10;
      unit_set_object_upper(param_1,unit_type_to_obj_indexes_map[*(byte *)(param_1 + 0x2b) + 0x1b]);
    }
    FUN_004d6b10(param_1);
    if (((*(byte *)(param_1 + 0x2e) & 3) == 0) &&
       (puVar2 = game_state.tribes_array[*(char *)(param_1 + 0x2f)].shaman,
       puVar2 != (unit_struct *)0x0)) {
      uVar8 = (uint)(ushort)((puVar2->pos).x - *(short *)(param_1 + 0x3d));
      uVar12 = (uint)(ushort)((puVar2->pos).y - *(short *)(param_1 + 0x3f));
      if (0x7fff < uVar8) {
        uVar8 = uVar8 - 0x10000;
      }
      if (0x7fff < uVar12) {
        uVar12 = uVar12 - 0x10000;
      }
      uVar11 = calc_angle_quadrant(uVar8,-uVar12);
      update_gs_unit_related_array_item(param_1);
      *(ushort *)(param_1 + 0x57) = uVar11 & 0x7ff;
      uVar8 = *(uint *)(param_1 + 0xc);
      *(uint *)(param_1 + 0xc) = uVar8 | 0x80;
      *(uint *)(param_1 + 0xc) = uVar8 | 0x1080;
    }
    psVar9 = (short *)(param_1 + 0x70);
    *psVar9 = *psVar9 + -1;
    if (*psVar9 == 0) {
      bVar3 = true;
      puVar2 = game_state.tribes_array[*(char *)(param_1 + 0x2f)].shaman;
      if (((puVar2 != (unit_struct *)0x0) &&
          (uVar8 = (int)(short)(puVar2->pos).x - (int)*(short *)(param_1 + 0x3d),
          uVar12 = (int)uVar8 >> 0x1f, (int)((uVar8 ^ uVar12) - uVar12) < 0x938)) &&
         (uVar8 = (int)(short)(puVar2->pos).y - (int)*(short *)(param_1 + 0x3f),
         uVar12 = (int)uVar8 >> 0x1f, (int)((uVar8 ^ uVar12) - uVar12) < 0x938)) {
        bVar3 = false;
      }
      if (bVar3) {
        *(undefined1 *)(param_1 + 0x2d) = 5;
        *(uint *)(param_1 + 0xc) = *(uint *)(param_1 + 0xc) | 0x40000000;
        FUN_004d3ea0(param_1);
      }
      else {
        *(undefined2 *)(param_1 + 0x70) = 0x20;
      }
    }
    break;
  case 7:
    if ((*(uint *)(param_1 + 0xc) & 0x40000000) != 0) {
      *(uint *)(param_1 + 0xc) = *(uint *)(param_1 + 0xc) & 0xbfffffff;
      cVar5 = *(char *)(param_1 + 0x2b);
      if (cVar5 == '\x02') {
        uVar13 = 0xa1;
LAB_004d7d63:
        unit_set_object_upper(param_1,uVar13);
        *(undefined2 *)(param_1 + 0x70) = 1;
      }
      else if (cVar5 == '\x03') {
        if ((*(byte *)(param_1 + 0x82) & 0xf0) < 0x11) {
          uVar13 = 0xa2;
          goto LAB_004d7d63;
        }
      }
      else if (cVar5 == '\x06') {
        if ((*(byte *)(param_1 + 0x82) & 0xf0) < 0x11) {
          uVar13 = 0xa3;
          goto LAB_004d7d63;
        }
      }
      else {
        *(undefined2 *)(param_1 + 0x70) = 0;
      }
      if (*(short *)(param_1 + 0x70) != 0) {
        *(ushort *)(param_1 + 0x70) =
             ((char)obj_related_array[*(byte *)(param_1 + 0x3a) + 3]._f2 + 1) *
             (ushort)(byte)vstart_related[(short)obj_related_array[0]._5_2_].frame_counter + 1;
      }
    }
    sVar6 = *(short *)(param_1 + 0x70) + -1;
    *(short *)(param_1 + 0x70) = sVar6;
    if (sVar6 < 1) {
      *(uint *)(param_1 + 0xc) = *(uint *)(param_1 + 0xc) | 0x40000000;
      *(undefined2 *)(param_1 + 0x70) = 0;
      *(undefined1 *)(param_1 + 0x2d) = 5;
    }
    else if ((*(short *)(param_1 + 0x37) == 0) &&
            ((int)((byte)vstart_related[*(short *)(param_1 + 0x33)].frame_counter - 1) <=
             (int)(uint)*(byte *)(param_1 + 0x39))) {
      uVar11 = (*(short *)(param_1 + 0x78) == 0) - 1 & 4;
      if (((*(uint *)(param_1 + 0xc) & 0x80000) != 0) &&
         (uVar11 = 0xc, (*(byte *)(param_1 + 0x11) & 4) == 0)) {
        uVar11 = 2;
        *(uint *)(param_1 + 0xc) = *(uint *)(param_1 + 0xc) & 0xffff7fff;
      }
      unit_set_object_upper
                (param_1,unit_type_to_obj_indexes_map
                         [(uint)*(byte *)(param_1 + 0x2b) + (short)uVar11 * 9]);
    }
  }
  if (((bVar4) && ((*(byte *)(param_1 + 0x2e) & 3) == 0)) &&
     ((*(ushort *)(param_1 + 0x76) & 2) != 0)) {
    *(undefined1 *)(param_1 + 0x2d) = 1;
    *(ushort *)(param_1 + 0x76) = *(ushort *)(param_1 + 0x76) & 0xfffd;
  }
  return local_2d;
}
