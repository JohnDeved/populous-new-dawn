/* Ghidra 12.1.3 pseudocode; entry 004c7370; FUN_004c7370.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_004c7370(int param_1,int param_2)

{
  undefined2 *puVar1;
  byte bVar2;
  bool bVar3;
  undefined4 uVar4;
  undefined2 uVar5;
  short sVar6;
  int iVar7;
  int iVar8;
  int iVar9;
  uint uVar10;
  undefined2 extraout_var;
  undefined1 uVar11;
  undefined2 local_8;
  undefined2 local_6;
  undefined4 local_4;

  puVar1 = (undefined2 *)(param_2 * 0x52 + 0x36 + param_1);
  iVar7 = FUN_004f25a0(param_1);
  if ((iVar7 == 0) || (iVar8 = FUN_004f2430(iVar7), iVar8 != 0)) {
    puVar1[0x21] = 3;
  }
  switch(puVar1[0x21]) {
  case 0:
    if (*(char *)(param_1 + 0x5b4) == '\0') {
      uVar5 = *(undefined2 *)(param_1 + 0x5a2);
    }
    else {
      uVar5 = *(undefined2 *)(param_1 + 0x36a);
    }
    *puVar1 = uVar5;
    if ((*(byte *)(param_1 + 0x596) & 0x40) == 0) {
      iVar7 = FUN_004f87f0(param_1,puVar1,0,
                           *(undefined1 *)(&DAT_009607ea + *(char *)(param_1 + 0xc22) * 0xc));
    }
    else {
      *puVar1 = *(undefined2 *)(param_1 + 0x5a6);
      iVar7 = 1;
      *(uint *)(param_1 + 0x596) = *(uint *)(param_1 + 0x596) & 0xffffffbf;
    }
    if (iVar7 != 0) {
      puVar1[0x21] = 2;
      puVar1[1] = 0;
      puVar1[2] = 0x168;
      *(undefined1 *)(puVar1 + 5) = 0x14;
      return;
    }
    puVar1[0x21] = 3;
    return;
  default:
    return;
  case 2:
    local_8 = *puVar1;
    iVar8 = FUN_004f5d30(&local_8);
    if (iVar8 == 0) {
      puVar1[0x21] = 3;
      return;
    }
    *puVar1 = local_8;
    iVar8 = FUN_004f6af0(param_1,3);
    iVar9 = FUN_004f6af0(param_1,1);
    if (iVar8 + iVar9 != 0) {
      puVar1[0x21] = 4;
      return;
    }
    iVar7 = FUN_004f3a70(iVar7,*puVar1);
    if (iVar7 != 0) {
      puVar1[0x21] = 4;
      return;
    }
    puVar1[0x21] = 3;
    return;
  case 3:
    FUN_004f6840(param_1,puVar1);
    FUN_00462770(puVar1);
    return;
  case 4:
    FUN_004f5c80(param_1,puVar1,5);
    return;
  case 5:
    iVar8 = FUN_004f25b0(iVar7);
    if (iVar8 != 0) {
      puVar1[0x21] = 6;
      if ((*(byte *)(iVar7 + 0xe) & 0x10) == 0) {
        *(undefined1 *)(iVar7 + 0x7d) = *(undefined1 *)(iVar7 + 0x2c);
        FUN_004ed6f0(iVar7);
        *(undefined1 *)(iVar7 + 0x2c) = 0xe;
        FUN_004ed640(iVar7);
      }
      *(undefined1 *)(param_1 + 0x5b1) = 0x14;
      return;
    }
    puVar1[0x21] = 3;
    return;
  case 6:
    FUN_004f5d10(param_1,puVar1,7);
    return;
  case 7:
    FUN_00435730(param_1,3,0,*puVar1);
    FUN_004f6440(param_1,puVar1);
    FUN_004359b0(param_1,0xffffffff,0xffffffff,0xffffffff);
    FUN_00418ce0(param_1,0xe);
    puVar1[4] = 0;
    puVar1[0x21] = 8;
    return;
  case 8:
    break;
  }
  iVar8 = FUN_004f79d0(*puVar1,3);
  sVar6 = FUN_00462750(param_1);
  puVar1[4] = puVar1[4] + sVar6;
  if ((ushort)puVar1[4] < 0x259) {
    local_4 = CONCAT22(local_4._2_2_,*puVar1);
    uVar4 = local_4;
    local_4._0_1_ = (char)*puVar1;
    local_4._1_3_ = SUB43(uVar4,1);
    local_4 = CONCAT31(local_4._1_3_,(char)local_4 + '\x06');
    iVar9 = FUN_004f79d0(local_4,3);
    if (iVar8 < iVar9) {
      *puVar1 = (undefined2)local_4;
      iVar8 = iVar9;
    }
    local_4 = CONCAT31(local_4._1_3_,(char)local_4 + -0xc);
    iVar9 = FUN_004f79d0(local_4,3);
    if (iVar8 < iVar9) {
      *puVar1 = (undefined2)local_4;
      iVar8 = iVar9;
    }
    local_4._0_2_ = CONCAT11(local_4._1_1_ + '\x06',(char)local_4 + '\x06');
    iVar9 = FUN_004f79d0(local_4,3);
    if (iVar8 < iVar9) {
      *puVar1 = (undefined2)local_4;
      iVar8 = iVar9;
    }
    local_4._0_2_ = CONCAT11(local_4._1_1_ + -0xc,(char)local_4);
    iVar9 = FUN_004f79d0(local_4,3);
    if (iVar8 < iVar9) {
      *puVar1 = (undefined2)local_4;
      iVar8 = iVar9;
    }
    if ((((&DAT_005a6f79)[(uint)*(byte *)(iVar7 + 0x2c) * 5] & 8) == 0) && (iVar8 < 4)) {
      local_4 = CONCAT31(local_4._1_3_,(char)((ushort)*(undefined2 *)(iVar7 + 0x3d) >> 8)) &
                0xfffffffe;
      local_4 = CONCAT22(local_4._2_2_,
                         CONCAT11((char)((ushort)*(undefined2 *)(iVar7 + 0x3f) >> 8),(char)local_4))
                & 0xfffffeff;
      iVar8 = FUN_004f79d0(local_4,3);
      if (iVar8 < 5) {
        return;
      }
      iVar8 = FUN_004c2d80(iVar7);
      if (iVar8 == 0) {
        return;
      }
      if (*(int *)(param_1 + 0x94d) < DAT_005a84f2) {
        return;
      }
      iVar8 = FUN_004f2100(iVar7,0x11);
      if (iVar8 == 0) {
        return;
      }
      FUN_004f4de0(param_1,0x11,*puVar1);
      FUN_0043b2a0(iVar7,(undefined2 *)(iVar7 + 0x3d));
      puVar1[0x21] = 3;
      return;
    }
    if (iVar8 != 0) {
      local_4 = CONCAT31(local_4._1_3_,(char)((ushort)*(undefined2 *)(iVar7 + 0x3d) >> 8)) &
                0xfffffffe;
      local_4 = CONCAT22(local_4._2_2_,
                         CONCAT11((char)((ushort)*(undefined2 *)(iVar7 + 0x3f) >> 8),(char)local_4))
                & 0xfffffeff;
      local_4 = FUN_0049c720(CONCAT22(extraout_var,*puVar1),local_4);
      iVar8 = FUN_004c2e00(iVar7,0x11);
      iVar9 = FUN_004c2d80(iVar7);
      if (iVar9 == 0) {
        return;
      }
      if (*(int *)(param_1 + 0x94d) < DAT_005a84f2) {
        return;
      }
      if (iVar8 * iVar8 < (int)local_4) {
        return;
      }
      iVar8 = FUN_004f2100(iVar7,0x11);
      if (iVar8 != 0) {
        FUN_004f4de0(param_1,0x11,*puVar1);
        FUN_0043b2a0(iVar7,iVar7 + 0x3d);
        puVar1[0x21] = 3;
        return;
      }
      return;
    }
    bVar3 = false;
    if (((*(ushort *)(iVar7 + 0x9f) != 0) && ((&DAT_00890390)[*(ushort *)(iVar7 + 0x9f)] != 0)) &&
       (*(short *)(iVar7 + 0x24) == *(short *)((&DAT_00890390)[*(ushort *)(iVar7 + 0x9f)] + 0x7a)))
    {
      bVar3 = true;
    }
    if (bVar3) goto LAB_004c7993;
    FUN_00436ca0(iVar7);
    FUN_004e9b40(iVar7);
    if ((*(byte *)(iVar7 + 0xe) & 0x10) == 0) {
      *(undefined1 *)(iVar7 + 0x7d) = *(undefined1 *)(iVar7 + 0x2c);
      if (((byte)DAT_0089d17c & 2) == 0) {
        bVar2 = *(byte *)(iVar7 + 0x2b);
LAB_004c78e0:
        uVar11 = (&DAT_005a7064)[(uint)bVar2 * 0x32];
      }
      else {
        bVar2 = *(byte *)(iVar7 + 0x2b);
        if (bVar2 != 7) goto LAB_004c78e0;
        uVar11 = 0x27;
      }
      FUN_004ed6f0(iVar7);
      *(undefined1 *)(iVar7 + 0x2c) = uVar11;
      FUN_004ed640(iVar7);
    }
    local_4 = *(undefined4 *)(iVar7 + 0x3d);
    local_6 = CONCAT11((char)(local_4 >> 0x18),(char)(local_4 >> 8));
    uVar10 = (local_6 & 0xfe) * 2 | local_6 & 0xfe00;
    if ((*(byte *)((int)&DAT_008a03e4 + uVar10 * 4 + 1) & 2) != 0) {
      FUN_004044b0((&DAT_00890390)[(ushort)(&DAT_008a03ec)[uVar10 * 2] & 0x3ff],&local_4);
    }
    *(uint *)(iVar7 + 0x68) = local_4;
    *(ushort *)(iVar7 + 0x68) = ((ushort)local_4 & 0xfe00) + 0x100;
    *(ushort *)(iVar7 + 0x6a) = (*(ushort *)(iVar7 + 0x6a) & 0xfe00) + 0x100;
    *(byte *)(iVar7 + 0x82) = *(byte *)(iVar7 + 0x82) & 0xf0;
    *(undefined1 *)(iVar7 + 0x82) = 0;
LAB_004c7993:
    puVar1[0x21] = 3;
    return;
  }
  bVar3 = false;
  if (((*(ushort *)(iVar7 + 0x9f) != 0) && ((&DAT_00890390)[*(ushort *)(iVar7 + 0x9f)] != 0)) &&
     (*(short *)(iVar7 + 0x24) == *(short *)((&DAT_00890390)[*(ushort *)(iVar7 + 0x9f)] + 0x7a))) {
    bVar3 = true;
  }
  if (bVar3) goto LAB_004c770d;
  FUN_00436ca0(iVar7);
  FUN_004e9b40(iVar7);
  if ((*(byte *)(iVar7 + 0xe) & 0x10) == 0) {
    *(undefined1 *)(iVar7 + 0x7d) = *(undefined1 *)(iVar7 + 0x2c);
    if (((byte)DAT_0089d17c & 2) == 0) {
      bVar2 = *(byte *)(iVar7 + 0x2b);
LAB_004c7656:
      uVar11 = (&DAT_005a7064)[(uint)bVar2 * 0x32];
    }
    else {
      bVar2 = *(byte *)(iVar7 + 0x2b);
      if (bVar2 != 7) goto LAB_004c7656;
      uVar11 = 0x27;
    }
    FUN_004ed6f0(iVar7);
    *(undefined1 *)(iVar7 + 0x2c) = uVar11;
    FUN_004ed640(iVar7);
  }
  local_4 = *(undefined4 *)(iVar7 + 0x3d);
  local_6 = CONCAT11((char)(local_4 >> 0x18),(char)(local_4 >> 8));
  uVar10 = (local_6 & 0xfe) * 2 | local_6 & 0xfe00;
  if ((*(byte *)((int)&DAT_008a03e4 + uVar10 * 4 + 1) & 2) != 0) {
    FUN_004044b0((&DAT_00890390)[(ushort)(&DAT_008a03ec)[uVar10 * 2] & 0x3ff],&local_4);
  }
  *(uint *)(iVar7 + 0x68) = local_4;
  *(ushort *)(iVar7 + 0x68) = ((ushort)local_4 & 0xfe00) + 0x100;
  *(ushort *)(iVar7 + 0x6a) = (*(ushort *)(iVar7 + 0x6a) & 0xfe00) + 0x100;
  *(byte *)(iVar7 + 0x82) = *(byte *)(iVar7 + 0x82) & 0xf0;
  *(undefined1 *)(iVar7 + 0x82) = 0;
LAB_004c770d:
  puVar1[0x21] = 3;
  return;
}
