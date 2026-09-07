/* Ghidra 12.1.3 pseudocode; entry 0048a050; FUN_0048a050.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


int FUN_0048a050(unit_struct *param_1,ushort param_2,ushort param_3)

{
  int iVar1;
  bool bVar2;
  undefined4 *puVar3;
  short sVar4;
  int iVar5;
  uint uVar6;
  DWORD DVar7;
  uint uVar8;
  short sVar9;
  int iVar10;
  undefined2 local_1c;
  undefined2 local_1a;
  undefined2 local_18;
  undefined2 local_16;
  int local_14;
  undefined4 local_10;
  undefined2 local_c;
  undefined4 local_8;
  undefined2 local_4;

  iVar10 = -1;
  uVar6 = (uint)param_2;
  iVar1 = uVar6 * 0xc;
  iVar5 = FUN_004b2670();
  if (iVar5 == 0) {
    return 0;
  }
  if (((interface_state != '\n') && (((byte)land_flags_1 & 2) != 0)) && ((param_3 & 0x800) == 0)) {
    return 0;
  }
  if (((DAT_00895daf == '\0') || (DAT_00895db0 == '\0')) || (DAT_00895db2 == '\0')) {
    return 0;
  }
  if ((draw_mode == 2) || (DAT_0089ce36 != '\0')) {
    switch(uVar6) {
    case 0x1c:
    case 0x50:
    case 0xc2:
    case 0xc6:
      return 0;
    }
    if (param_1 != (unit_struct *)0x0) {
      return 0;
    }
  }
  if ((param_3 & 1) != 0) goto LAB_0048a28d;
  if (param_2 == 0x19) {
    iVar10 = (int)player_tribe_num;
    if ((game_state.tribes_array[iVar10].shaman != param_1) || (param_1 == (unit_struct *)0x0))
    goto LAB_0048a1fb;
    local_8._0_2_ = game_state.tribes_array[iVar10].x;
    local_8._2_2_ = game_state.tribes_array[iVar10].y;
    local_4 = *(undefined2 *)&game_state.tribes_array[iVar10].field_0x28;
    move_pos_angle_length
              (&local_8,CONCAT22((short)((uint)(iVar10 * 0xc65 + 0x89d1c8) >> 0x10),
                                 game_state.tribes_array[iVar10].angle_1),0xfffff000);
    local_18 = (undefined2)local_8;
    local_16 = local_8._2_2_;
    iVar5 = calc_squared_distance_toroidal(&param_1->pos,&local_18);
    iVar10 = -1;
    if (iVar5 < 0x9000001) {
      iVar10 = iVar5;
    }
    if (iVar10 == -1) {
      iVar10 = 0x6c00000;
    }
  }
  else {
LAB_0048a1fb:
    iVar10 = 0;
    if (param_1 != (unit_struct *)0x0) {
      iVar10 = (int)player_tribe_num;
      local_10._0_2_ = game_state.tribes_array[iVar10].x;
      local_10._2_2_ = game_state.tribes_array[iVar10].y;
      local_c = *(undefined2 *)&game_state.tribes_array[iVar10].field_0x28;
      move_pos_angle_length
                (&local_10,
                 CONCAT22((short)((uint)(iVar10 * 0xc65 + 0x89d1c8) >> 0x10),
                          game_state.tribes_array[iVar10].angle_1),0xfffff000);
      local_1c = (undefined2)local_10;
      local_1a = local_10._2_2_;
      iVar5 = calc_squared_distance_toroidal(&param_1->pos,&local_1c);
      iVar10 = -1;
      if (iVar5 < 0x9000001) {
        iVar10 = iVar5;
      }
      if (iVar10 == -1) {
        return 0;
      }
    }
  }
  if ((((0x9000000U - iVar10) / 0x900) * (uint)(byte)(&DAT_005acf6a)[iVar1] & 0xffff0000) == 0) {
    return 0;
  }
LAB_0048a28d:
  bVar2 = false;
  if (((0x73 < param_2) && (param_2 < 0x87)) &&
     (puVar3 = DAT_0089ce6d, param_1 != (unit_struct *)0x0)) {
    for (; puVar3 != (undefined4 *)0x0; puVar3 = (undefined4 *)*puVar3) {
      if (((0x73 < *(ushort *)(puVar3 + 4)) && (param_2 < 0x87)) &&
         (param_1->unit_index == *(short *)(puVar3 + 3))) {
        bVar2 = true;
        break;
      }
    }
    if (bVar2) {
      return local_14;
    }
  }
  iVar10 = FUN_0048abb0((&DAT_005acf67)[iVar1],iVar10,(&DAT_005acf6a)[iVar1],param_2);
  if (iVar10 == 0) {
    return 0;
  }
  *(undefined2 *)(iVar10 + 0xc) = 0;
  if (param_1 != (unit_struct *)0x0) {
    param_1->flags_4 = param_1->flags_4 | 0x10;
    *(undefined2 *)(iVar10 + 0xc) = param_1->unit_index;
  }
  *(undefined4 *)(iVar10 + 0x1c) = 0;
  if (((&DAT_005acf6b)[iVar1] == '\0') || (DAT_00895db6 == '\0')) {
    uVar8 = pseudo_random * 0x24a1 + 0x24df;
    pseudo_random = uVar8 >> 0xd | uVar8 * 0x80000;
    sVar9 = (short)(pseudo_random % (uint)(byte)(&DAT_005acf65)[iVar1]);
    sVar4 = *(short *)(&DAT_005acf60 + iVar1);
  }
  else {
    uVar8 = pseudo_random * 0x24a1 + 0x24df;
    pseudo_random = uVar8 >> 0xd | uVar8 * 0x80000;
    sVar9 = (short)(pseudo_random % (uint)(byte)(&DAT_005acf66)[iVar1]);
    sVar4 = *(short *)(&DAT_005acf62 + iVar1);
  }
  *(short *)(iVar10 + 0xe) = sVar4 + sVar9;
  *(undefined *)(iVar10 + 0x14) = (&DAT_005acf6a)[iVar1];
  *(undefined4 *)(iVar10 + 8) = 0;
  *(undefined2 *)(iVar10 + 0x1a) = 0;
  *(undefined4 *)(iVar10 + 0x20) = 0;
  if ((param_3 & 4) == 0) {
    if ((param_3 & 1) == 0) {
      FUN_0048b100(iVar10,0);
    }
    else {
      *(undefined1 *)(iVar10 + 0x28) = 0x78;
      if ((((param_2 == 0x1c) || (param_2 == 0x50)) || (param_2 == 0xc2)) || (param_2 == 0xc6)) {
        uVar6 = pseudo_random * 0x24a1 + 0x24df;
        pseudo_random = uVar6 >> 0xd | uVar6 * 0x80000;
        *(char *)(iVar10 + 0x16) = (char)(pseudo_random % (uint)*(byte *)(iVar10 + 0x14));
        uVar8 = pseudo_random * 0x24a1 + 0x24df;
        uVar6 = uVar8 >> 0xd;
        pseudo_random = uVar6 | uVar8 * 0x80000;
        *(byte *)(iVar10 + 0x15) = (byte)uVar6 & 0x7f;
      }
      else if (param_2 == 0x54) {
        uVar6 = pseudo_random * 0x24a1 + 0x24df;
        pseudo_random = uVar6 >> 0xd | uVar6 * 0x80000;
        *(char *)(iVar10 + 0x16) = (char)(pseudo_random % (uint)*(byte *)(iVar10 + 0x14));
        *(undefined1 *)(iVar10 + 0x15) = 0x40;
      }
      else {
        *(undefined *)(iVar10 + 0x16) = (&DAT_005acf6a)[iVar1];
        *(undefined1 *)(iVar10 + 0x15) = 0x40;
      }
    }
  }
  else {
    switch(uVar6) {
    case 0x1e:
    case 200:
      *(undefined1 *)(iVar10 + 0x1a) = 1;
      break;
    case 0x1f:
    case 0xc9:
      *(undefined1 *)(iVar10 + 0x1a) = 2;
      break;
    case 0x20:
    case 0xca:
    case 0xd5:
      *(undefined1 *)(iVar10 + 0x1a) = 4;
      break;
    case 0x21:
      *(undefined1 *)(iVar10 + 0x1a) = 3;
      break;
    default:
      *(undefined1 *)(iVar10 + 0x1a) = 0;
    }
    FUN_004895c0(iVar10,0);
  }
  *(undefined2 *)(iVar10 + 0x12) = 100;
  if ((&DAT_005acf68)[iVar1] != '\0') {
    uVar6 = pseudo_random * 0x24a1 + 0x24df;
    pseudo_random = uVar6 >> 0xd | uVar6 * 0x80000;
    *(short *)(iVar10 + 0x12) =
         *(short *)(iVar10 + 0x12) +
         ((short)(pseudo_random % ((uint)(ushort)(byte)(&DAT_005acf68)[iVar1] * 2)) -
         (ushort)(byte)(&DAT_005acf68)[iVar1]);
  }
  *(ushort *)(iVar10 + 0x18) = param_3 | 0x108;
  *(undefined *)(iVar10 + 0x17) = (&DAT_005acf67)[iVar1];
  *(ushort *)(iVar10 + 0x10) = param_2;
  (&DAT_005acf69)[iVar1] = (&DAT_005acf69)[iVar1] + '\x01';
  if ((param_3 & 0x10) != 0) {
    *(undefined2 *)(iVar10 + 0x1a) = (param_1->object).obj_index;
  }
  DVar7 = GetTickCount();
  *(DWORD *)(iVar10 + 0x24) = DVar7;
  return iVar10;
}
