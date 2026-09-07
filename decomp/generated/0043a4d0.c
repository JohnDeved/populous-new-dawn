/* Ghidra 12.1.3 pseudocode; entry 0043a4d0; FUN_0043a4d0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


undefined1 FUN_0043a4d0(int param_1,int param_2)

{
  undefined4 *puVar1;
  bool bVar2;
  bool bVar3;
  bool bVar4;
  char cVar5;
  char cVar6;
  short sVar7;
  int iVar8;
  uint uVar9;
  uint uVar10;
  ushort *puVar11;
  undefined1 local_26;
  char local_20;
  char cStack_1f;
  ushort local_1e;
  undefined4 local_10;
  undefined2 local_c [2];
  undefined1 local_8 [4];
  undefined1 local_4 [4];

  bVar2 = false;
  local_26 = 0;
  bVar3 = false;
  if (*(char *)(param_1 + 0x2d) == '\0') {
    *(undefined1 *)(param_1 + 0x2d) = 5;
    if (*(char *)(param_1 + 0xa7) != ' ') {
      *(undefined1 *)(param_1 + 0x2d) = 1;
    }
    *(byte *)(param_1 + 0xb2) = *(byte *)(param_1 + 0xb2) & 0xfd;
    *(undefined1 *)(param_1 + 0xa9) = 3;
    uVar10 = *(uint *)(param_1 + 0xc);
    *(uint *)(param_1 + 0xc) = uVar10 | 0x200000;
    if (((uVar10 & 0x800000) != 0) && (iVar8 = get_adjacent_unit(param_1,0), iVar8 != 0)) {
      uVar10 = *(uint *)(param_1 + 0x10) & 0xfffefff8;
      *(uint *)(param_1 + 0x10) = uVar10;
      *(uint *)(param_1 + 0x10) = uVar10 | 2;
      *(char *)(param_1 + 0xa9) = *(char *)(param_1 + 0xa9) + '\x02';
      *(undefined2 *)(param_1 + 0x89) = *(undefined2 *)(iVar8 + 0x24);
    }
  }
  switch(*(byte *)(param_1 + 0x2d) - 1) {
  case 0:
    if ((*(byte *)(param_1 + 0x2e) & 1) == 0) {
      if (((((*(byte *)(param_1 + 0x2e) & 3) == 0) &&
           (uVar10 = (int)*(short *)(param_1 + 0x4f) - (int)*(short *)(param_1 + 0x3d),
           uVar9 = (int)uVar10 >> 0x1f, (int)((uVar10 ^ uVar9) - uVar9) < 0x538)) &&
          (uVar10 = (int)*(short *)(param_1 + 0x51) - (int)*(short *)(param_1 + 0x3f),
          uVar9 = (int)uVar10 >> 0x1f, (int)((uVar10 ^ uVar9) - uVar9) < 0x538)) &&
         (cVar6 = FUN_0043a310(param_1,(short *)(param_1 + 0x4f),0), cVar6 == '\0')) {
        bVar2 = true;
      }
      if (!bVar2) {
        uVar10 = (int)*(short *)(param_1 + 0x4f) - (int)*(short *)(param_1 + 0x3d);
        uVar9 = (int)uVar10 >> 0x1f;
        if ((0xb < (int)((uVar10 ^ uVar9) - uVar9)) ||
           (uVar10 = (int)*(short *)(param_1 + 0x51) - (int)*(short *)(param_1 + 0x3f),
           uVar9 = (int)uVar10 >> 0x1f, bVar4 = true, 0xb < (int)((uVar10 ^ uVar9) - uVar9))) {
          bVar4 = false;
        }
        if (bVar4) {
          cVar6 = FUN_0043a310(param_1,(short *)(param_1 + 0x4f),0);
          if (cVar6 == '\0') {
            bVar2 = true;
          }
          else {
            *(undefined1 *)(param_1 + 0x2d) = 2;
            *(uint *)(param_1 + 0xc) = *(uint *)(param_1 + 0xc) | 0x40000000;
          }
        }
        if (!bVar2) goto switchD_0043a55d_caseD_5;
      }
      puVar1 = (undefined4 *)(param_1 + 0x4f);
      bVar2 = false;
      *puVar1 = *(undefined4 *)(param_2 + 6);
      cVar6 = get_empty_indexed_xy(2,0,0,0x10);
      if (cVar6 != '\0') {
        local_1e = CONCAT11((char)((ushort)*(undefined2 *)(param_2 + 8) >> 8),
                            (char)((ushort)*(undefined2 *)(param_2 + 6) >> 8)) & 0xfefe;
        do {
          cVar5 = get_indexed_xy(cVar6,local_4,local_8);
          if (cVar5 == '\0') goto LAB_0043a6ed;
          local_20 = (char)local_1e;
          cStack_1f = (char)(local_1e >> 8);
          local_10 = CONCAT22(((byte)(local_8[0] * '\x02' + cStack_1f) + 1) * 0x100,
                              ((byte)(local_4[0] * '\x02' + local_20) + 1) * 0x100);
          cVar5 = FUN_0043a310(param_1,&local_10,0);
        } while (cVar5 == '\0');
        bVar2 = true;
        *puVar1 = local_10;
LAB_0043a6ed:
        clear_indexed_xy(cVar6);
      }
      if (bVar2) {
        FUN_004e9d80(param_1,puVar1);
      }
    }
    goto switchD_0043a55d_caseD_5;
  case 1:
    bVar3 = true;
    if ((*(uint *)(param_1 + 0xc) & 0x40000000) != 0) {
      *(uint *)(param_1 + 0xc) = *(uint *)(param_1 + 0xc) & 0xbfffffff;
      FUN_004d4ee0(param_1);
      unit_set_object_upper(param_1,0x5f);
      *(undefined2 *)(param_1 + 0x37) = 1;
      *(undefined1 *)(param_1 + 0x39) = 0;
      *(ushort *)(param_1 + 0x70) =
           ((char)obj_related_array[*(byte *)(param_1 + 0x3a) + 3]._f2 + 1) *
           (ushort)(byte)vstart_related[*(short *)(param_1 + 0x33)].frame_counter;
    }
    sVar7 = *(short *)(param_1 + 0x70) + -1;
    *(short *)(param_1 + 0x70) = sVar7;
    if (0 < sVar7) goto switchD_0043a55d_caseD_5;
    *(undefined1 *)(param_1 + 0x2d) = 3;
    break;
  case 2:
    uVar10 = *(uint *)(param_1 + 0xc);
    bVar3 = true;
    if (((uVar10 & 0x2004) != 0) || (*(short *)(param_1 + 0x5f) != 0)) {
      *(undefined1 *)(param_1 + 0xa8) = 1;
      *(byte *)(param_1 + 0x76) = *(byte *)(param_1 + 0x76) | 0x10;
      goto switchD_0043a55d_caseD_5;
    }
    if ((uVar10 & 0x40000000) != 0) {
      *(uint *)(param_1 + 0xc) = uVar10 & 0xbfffffff;
      *(undefined2 *)(param_1 + 0x70) = 0;
      unit_set_object_upper(param_1,0x61);
      *(byte *)(param_1 + 0xb2) = *(byte *)(param_1 + 0xb2) & 0xfe;
      *(undefined2 *)(param_1 + 0x37) = 1;
      *(undefined1 *)(param_1 + 0x39) = 0;
      *(undefined1 *)(param_1 + 0xa8) = 0;
      *(byte *)(param_1 + 0x76) = *(byte *)(param_1 + 0x76) | 0x10;
    }
    sVar7 = *(short *)(param_1 + 0x70) + 1;
    *(short *)(param_1 + 0x70) = sVar7;
    if (sVar7 < 0x348) {
      if ((*(byte *)(param_1 + 0xb2) & 1) == 0) {
        if ((*(byte *)(param_1 + 0x2e) & 0xf) == 0) {
          uVar9 = pseudo_random * 0x24a1 + 0x24df;
          uVar10 = uVar9 >> 0xd;
          pseudo_random = uVar10 | uVar9 * 0x80000;
          if ((uVar10 & 3) < 2) {
            *(byte *)(param_1 + 0xb2) = *(byte *)(param_1 + 0xb2) | 1;
            unit_set_object_upper(param_1,((uVar10 & 1) == 0) + 'b');
            *(undefined1 *)(param_1 + 0x39) = 0;
            *(undefined2 *)(param_1 + 0x37) = 1;
            if ((*(byte *)(param_1 + 0x76) & 0x40) != 0) {
              if (*(char *)(param_1 + 0x2f) == player_tribe_num) {
                FUN_0048a050(param_1,0x33,0);
              }
              else {
                FUN_0048a050(param_1,0xbd,0);
              }
            }
          }
        }
      }
      else if ((*(short *)(param_1 + 0x37) == 0) &&
              ((int)((byte)vstart_related[*(short *)(param_1 + 0x33)].frame_counter - 1) <=
               (int)(uint)*(byte *)(param_1 + 0x39))) {
        *(byte *)(param_1 + 0xb2) = *(byte *)(param_1 + 0xb2) & 0xfe;
        unit_set_object_upper(param_1,0x61);
      }
      if ((*(byte *)(param_1 + 0xb2) & 2) == 0) {
        cVar6 = *(char *)(param_1 + 0xa8);
        if (cVar6 == '\0') {
          if ((*(byte *)(param_1 + 0x2e) & 0xf) == 0) {
            uVar9 = game_state.pseudo_random_val * 0x24a1 + 0x24df;
            uVar10 = uVar9 >> 0xd;
            game_state.pseudo_random_val = uVar10 | uVar9 * 0x80000;
            uVar10 = uVar10 & 3;
            if (uVar10 == 1) {
              *(undefined1 *)(param_1 + 0xa8) = 1;
              *(byte *)(param_1 + 0x76) = *(byte *)(param_1 + 0x76) | 0x10;
            }
            else if (uVar10 == 2) {
              *(undefined1 *)(param_1 + 0xa8) = 2;
              *(byte *)(param_1 + 0x76) = *(byte *)(param_1 + 0x76) | 0x10;
            }
          }
        }
        else if (cVar6 == '\x01') {
          if ((*(ushort *)(param_1 + 0x76) & 0x10) != 0) {
            *(undefined1 *)(param_1 + 0xaa) = 0x28;
            *(ushort *)(param_1 + 0x76) = *(ushort *)(param_1 + 0x76) & 0xffef;
          }
          cVar6 = *(char *)(param_1 + 0xaa) + -1;
          *(char *)(param_1 + 0xaa) = cVar6;
          if (cVar6 < '\x01') {
            *(undefined1 *)(param_1 + 0xa8) = 0;
            *(byte *)(param_1 + 0x76) = *(byte *)(param_1 + 0x76) | 0x10;
          }
          else if ((*(byte *)(param_1 + 0x2e) & 7) == 0) {
            sVar7 = *(short *)(param_1 + 0x5d);
            update_gs_unit_related_array_item(param_1);
            *(ushort *)(param_1 + 0x57) = sVar7 + 0x18U & 0x7ff;
            uVar10 = *(uint *)(param_1 + 0xc);
            *(uint *)(param_1 + 0xc) = uVar10 | 0x80;
            *(uint *)(param_1 + 0xc) = uVar10 | 0x1080;
          }
        }
        else if (cVar6 == '\x02') {
          uVar10 = game_state.pseudo_random_val * 0x24a1 + 0x24df;
          uVar9 = uVar10 >> 0xd;
          game_state.pseudo_random_val = uVar9 | uVar10 * 0x80000;
          update_gs_unit_related_array_item(param_1);
          uVar10 = *(uint *)(param_1 + 0xc);
          *(undefined1 *)(param_1 + 0xa8) = 0;
          *(uint *)(param_1 + 0xc) = uVar10 | 0x80;
          *(uint *)(param_1 + 0xc) = uVar10 | 0x1080;
          *(byte *)(param_1 + 0x76) = *(byte *)(param_1 + 0x76) | 0x10;
          *(ushort *)(param_1 + 0x57) = (ushort)uVar9 & 0x7ff;
        }
      }
      goto switchD_0043a55d_caseD_5;
    }
    *(undefined1 *)(param_1 + 0x2d) = 4;
    break;
  case 3:
    bVar2 = false;
    iVar8 = 0;
    uVar10 = (uint)*(byte *)(param_1 + 0xa6);
    puVar11 = (ushort *)(param_1 + 0x8d + uVar10 * 2);
    do {
      uVar10 = uVar10 + 1;
      if (7 < (int)uVar10) break;
      if ((*puVar11 != 0) &&
         ((*(byte *)((int)(game_state.sunlight_array + 0x32) + (uint)*puVar11 * 10 + 1) & 1) == 0))
      {
        bVar2 = true;
        break;
      }
      iVar8 = iVar8 + 1;
      puVar11 = puVar11 + 1;
    } while (iVar8 < 8);
    if (bVar2) {
      local_26 = 1;
      *(ushort *)(param_1 + 0x76) = *(ushort *)(param_1 + 0x76) & 0xffbf;
      FUN_0043aec0(param_1,*(undefined1 *)(param_1 + 0xa9));
    }
    else {
      *(undefined1 *)(param_1 + 0x2d) = 2;
      *(uint *)(param_1 + 0xc) = *(uint *)(param_1 + 0xc) | 0x40000000;
      FUN_004d4ee0(param_1);
    }
    goto switchD_0043a55d_caseD_5;
  case 4:
    cVar6 = FUN_0043a310(param_1,param_1 + 0x3d,1);
    if (cVar6 == '\0') {
      *(undefined1 *)(param_1 + 0x2d) = 1;
    }
    else {
      bVar3 = true;
      FUN_004d4ee0(param_1);
      *(undefined1 *)(param_1 + 0x2d) = 2;
    }
    break;
  default:
    goto switchD_0043a55d_caseD_5;
  }
  *(uint *)(param_1 + 0xc) = *(uint *)(param_1 + 0xc) | 0x40000000;
switchD_0043a55d_caseD_5:
  if ((bVar3) && ((*(byte *)(param_1 + 0x2e) & 1) == 0)) {
    puVar11 = (ushort *)(param_1 + 0x76);
    iVar8 = FUN_0043abf0(param_1,*(undefined1 *)(param_1 + 0xa9),local_c);
    if (iVar8 == 0) {
      *puVar11 = *puVar11 & 0xffbf;
    }
    else {
      *(byte *)puVar11 = *(byte *)puVar11 | 0x40;
      FUN_004da170(param_1);
      if ((*(byte *)(param_1 + 0xb2) & 2) != 0) {
        update_gs_unit_related_array_item(param_1);
        *(undefined2 *)(param_1 + 0x57) = local_c[0];
        uVar10 = *(uint *)(param_1 + 0xc);
        *(uint *)(param_1 + 0xc) = uVar10 | 0x80;
        *(uint *)(param_1 + 0xc) = uVar10 | 0x1080;
      }
    }
    if (((*(char *)(param_1 + 0xa7) == ' ') && (0x20 < *(short *)(param_1 + 0x70))) &&
       ((*(byte *)puVar11 & 0x40) == 0)) {
      local_26 = 1;
      FUN_0043aec0(param_1,*(undefined1 *)(param_1 + 0xa9));
    }
  }
  return local_26;
}
