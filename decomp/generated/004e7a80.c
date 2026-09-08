/* Ghidra 12.1.3 pseudocode; entry 004e7a80; FUN_004e7a80.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_004e7a80(int param_1)

{
  short *psVar1;
  byte bVar2;
  bool bVar3;
  short sVar4;
  int iVar5;
  int iVar6;
  ushort uVar7;
  int iVar8;
  ushort local_1c;
  ushort local_1a;
  short local_18;
  short sStack_16;
  short local_14;
  undefined2 local_10;
  short local_e;
  short local_c;
  undefined4 local_8;
  short local_4;

  if ((*(uint *)(param_1 + 0xc) & 0x4000) != 0) {
    return;
  }
  local_18 = (short)*(undefined4 *)(param_1 + 0x3d);
  sStack_16 = (short)((uint)*(undefined4 *)(param_1 + 0x3d) >> 0x10);
  local_14 = *(short *)(param_1 + 0x41);
  bVar2 = *(byte *)(param_1 + 0x30);
  bVar3 = false;
  if ((*(uint *)(param_1 + 0xc) & 0x2000) != 0) {
    bVar3 = true;
    FUN_004e7980(param_1,param_1 + 0x49);
    FUN_00401ac0(param_1 + 0x49,&local_18);
    *(short *)(param_1 + 0x4b) =
         *(short *)(param_1 + 0x4b) - unit_related_struct_26B_ARRAY_005a7b90[bVar2].field13_0x12;
    if ((unit_related_struct_26B_ARRAY_005a7b90[bVar2].field_0x18 & 4) == 0) {
      FUN_004e9be0(param_1,&local_18,0);
    }
  }
  if (bVar3) {
    if ((*(byte *)(param_1 + 0xc) & 2) == 0) {
      FUN_00463750(&local_18);
    }
    add_unit_to_cell(param_1,&local_18);
  }
  if ((*(byte *)(param_1 + 0xe) & 8) == 0) {
    *(undefined2 *)(param_1 + 0x49) = 0;
    *(undefined2 *)(param_1 + 0x4d) = 0;
    if ((*(byte *)(param_1 + 0xe) & 4) != 0) {
      *(undefined2 *)(param_1 + 0x4b) = 0;
    }
    if (-1 < *(short *)(param_1 + 0x5f)) {
      if ((*(byte *)(param_1 + 0xc) & 0x80) == 0) {
        FUN_004e7f00(&local_1a,&local_1c,&local_18,param_1 + 0x57);
      }
      else {
        local_1a = *(ushort *)(param_1 + 0x57);
        local_1c = *(ushort *)(param_1 + 0x59);
      }
      local_8 = 0;
      local_4 = 0;
      iVar8 = (int)*(short *)(param_1 + 0x5f);
      if (iVar8 != 0) {
        local_4 = (short)((uint)(maybe_cos[local_1c & 0x7ff] * (iVar8 >> 1)) >> 0x10);
        iVar8 = maybe_sin[local_1c & 0x7ff] * iVar8 >> 0x10;
        if (iVar8 != 0) {
          local_8 = CONCAT22((short)((uint)(maybe_cos[local_1a & 0x7ff] * iVar8) >> 0x10),
                             (short)((uint)(maybe_sin[local_1a & 0x7ff] * iVar8) >> 0x10));
        }
      }
      psVar1 = (short *)(param_1 + 0x4b);
      *(short *)(param_1 + 0x49) = *(short *)(param_1 + 0x49) + (short)local_8;
      *psVar1 = *psVar1 + local_4;
      *(short *)(param_1 + 0x4d) = *(short *)(param_1 + 0x4d) + local_8._2_2_;
      if ((*(byte *)(param_1 + 0xe) & 4) == 0) {
        *psVar1 = *psVar1 - unit_related_struct_26B_ARRAY_005a7b90[bVar2].field13_0x12;
      }
      sVar4 = *(short *)(param_1 + 0x49);
      iVar6 = (int)*(short *)(param_1 + 0x4d);
      iVar5 = (int)sVar4;
      iVar8 = iVar5;
      if (iVar5 < 0) {
        iVar8 = -iVar5;
      }
      if (iVar8 < 2) {
        sVar4 = 0;
      }
      else if (iVar5 < 1) {
        sVar4 = sVar4 + 2;
      }
      else {
        sVar4 = sVar4 + -2;
      }
      *(short *)(param_1 + 0x49) = sVar4;
      iVar8 = iVar6;
      if (iVar6 < 0) {
        iVar8 = -iVar6;
      }
      if (iVar8 < 2) {
        *(short *)(param_1 + 0x4d) = *(short *)(param_1 + 0x4d) - *(short *)(param_1 + 0x4d);
      }
      else if (iVar6 < 1) {
        *(short *)(param_1 + 0x4d) = *(short *)(param_1 + 0x4d) + 2;
      }
      else {
        *(short *)(param_1 + 0x4d) = *(short *)(param_1 + 0x4d) + -2;
      }
      FUN_004e78f0(param_1,param_1 + 0x49);
      local_18 = local_18 + *(short *)(param_1 + 0x49);
      local_14 = local_14 + *psVar1;
      sStack_16 = sStack_16 + *(short *)(param_1 + 0x4d);
    }
    *(uint *)(param_1 + 0x10) = *(uint *)(param_1 + 0x10) | 0x400;
    sVar4 = calc_point_height(CONCAT22(sStack_16,local_18),CONCAT22(local_14,sStack_16));
    if (local_14 <= sVar4) {
      *(uint *)(param_1 + 0x10) = *(uint *)(param_1 + 0x10) & 0xfffffbff;
      *(undefined2 *)(param_1 + 0x4b) = 0;
    }
    goto LAB_004e7eb2;
  }
  sVar4 = calc_point_height(CONCAT22(sStack_16,local_18),CONCAT22(local_14,sStack_16));
  if (sVar4 < local_14) {
    *(uint *)(param_1 + 0x10) = *(uint *)(param_1 + 0x10) | 0x400;
    if ((*(byte *)(param_1 + 0xe) & 4) == 0) {
      *(short *)(param_1 + 0x4b) =
           *(short *)(param_1 + 0x4b) - unit_related_struct_26B_ARRAY_005a7b90[bVar2].field13_0x12;
    }
    sVar4 = *(short *)(param_1 + 0x49);
    uVar7 = *(ushort *)(param_1 + 0x4d);
    iVar6 = (int)(short)uVar7;
    iVar5 = (int)sVar4;
    iVar8 = iVar5;
    if (iVar5 < 0) {
      iVar8 = -iVar5;
    }
    if (iVar8 < 2) {
      sVar4 = 0;
    }
    else if (iVar5 < 1) {
      sVar4 = sVar4 + 2;
    }
    else {
      sVar4 = sVar4 + -2;
    }
    *(short *)(param_1 + 0x49) = sVar4;
    iVar8 = iVar6;
    if (iVar6 < 0) {
      iVar8 = -iVar6;
    }
    if (iVar8 < 2) {
LAB_004e7e68:
      *(short *)(param_1 + 0x4d) = *(short *)(param_1 + 0x4d) - uVar7;
    }
    else if (iVar6 < 1) {
      *(short *)(param_1 + 0x4d) = *(short *)(param_1 + 0x4d) + 2;
    }
    else {
      *(short *)(param_1 + 0x4d) = *(short *)(param_1 + 0x4d) + -2;
    }
  }
  else {
    if ((*(byte *)(param_1 + 0x11) & 4) != 0) {
      sVar4 = *(short *)(param_1 + 0x4b);
      if ((sVar4 < 0) && (iVar8 = -(int)sVar4, sVar4 != -0x40 && 0x3f < iVar8)) {
        *(short *)(param_1 + 0x4b) = (short)(iVar8 >> 2);
      }
    }
    *(uint *)(param_1 + 0x10) = *(uint *)(param_1 + 0x10) & 0xfffffbff;
    FUN_004ebc20(&local_18,&local_10);
    *(short *)(param_1 + 0x49) = *(short *)(param_1 + 0x49) + local_10;
    *(short *)(param_1 + 0x4b) = *(short *)(param_1 + 0x4b) + local_e;
    local_c = *(short *)(param_1 + 0x4d) + local_c;
    *(short *)(param_1 + 0x4d) = local_c;
    local_10 = CONCAT11((char)((ushort)sStack_16 >> 8),(char)((ushort)local_18 >> 8));
    if ((*(byte *)(landscape_height_array +
                  ((&game_state.level_data[0].c_3)[((local_10 & 0xfe) * 2 | local_10 & 0xfe00) * 4]
                  & 0xf)) & 0x3e) == 0) {
      uVar7 = *(ushort *)&unit_related_struct_26B_ARRAY_005a7b90[bVar2].field_0x14;
    }
    else {
      uVar7 = *(ushort *)&unit_related_struct_26B_ARRAY_005a7b90[bVar2].field_0x16;
    }
    sVar4 = *(short *)(param_1 + 0x49);
    iVar6 = (int)local_c;
    iVar5 = (int)sVar4;
    iVar8 = iVar5;
    if (iVar5 < 0) {
      iVar8 = -iVar5;
    }
    if (iVar8 < (int)(uint)uVar7) {
      sVar4 = 0;
    }
    else if (iVar5 < 1) {
      sVar4 = sVar4 + uVar7;
    }
    else {
      sVar4 = sVar4 - uVar7;
    }
    *(short *)(param_1 + 0x49) = sVar4;
    iVar8 = iVar6;
    if (iVar6 < 0) {
      iVar8 = -iVar6;
    }
    if (iVar8 < (int)(uint)uVar7) {
      *(short *)(param_1 + 0x4d) = *(short *)(param_1 + 0x4d) - local_c;
    }
    else {
      if (0 < iVar6) goto LAB_004e7e68;
      *(short *)(param_1 + 0x4d) = *(short *)(param_1 + 0x4d) + uVar7;
    }
  }
  FUN_004e78f0(param_1,param_1 + 0x49);
  local_18 = local_18 + *(short *)(param_1 + 0x49);
  local_14 = local_14 + *(short *)(param_1 + 0x4b);
  sStack_16 = sStack_16 + *(short *)(param_1 + 0x4d);
  FUN_004e9be0(param_1,&local_18,1);
  FUN_004e9160(param_1,&local_18);
LAB_004e7eb2:
  if (((*(byte *)(param_1 + 0xc) & 2) == 0) &&
     (sVar4 = calc_point_height(CONCAT22(sStack_16,local_18),CONCAT22(local_14,sStack_16)),
     local_14 < sVar4)) {
    local_14 = sVar4;
  }
  add_unit_to_cell(param_1,&local_18);
  return;
}
