/* Ghidra 12.1.3 pseudocode; entry 004c5f70; FUN_004c5f70.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_004c5f70(int param_1,int param_2)

{
  int *piVar1;
  byte bVar2;
  undefined2 uVar3;
  uint uVar4;
  undefined2 extraout_var;
  int iVar5;
  int iVar6;
  byte bVar7;
  int iVar8;
  ushort uVar9;
  undefined1 uVar10;
  undefined4 uVar11;
  ushort *puVar12;
  int *piVar13;
  undefined2 local_64;
  byte local_62;
  byte bStack_61;
  byte bStack_60;
  byte bStack_5f;
  undefined2 uStack_5e;
  undefined4 local_5c;
  short local_58;
  short local_56;
  undefined4 local_54;
  int local_50 [10];
  int local_28 [10];

  piVar1 = (int *)(param_2 * 0x52 + 0x36 + param_1);
  if (*(ushort *)((int)piVar1 + 0x42) < 3) {
    iVar8 = 0;
    if (((*(ushort *)((int)piVar1 + 0x32) != 0) &&
        (iVar5 = (&DAT_00890390)[*(ushort *)((int)piVar1 + 0x32)], (*(byte *)(iVar5 + 0xc) & 1) == 0
        )) && (*(char *)(iVar5 + 0x2a) != '\0')) {
      iVar8 = iVar5;
    }
    if (iVar8 != 0) goto LAB_004c5fc8;
  }
  else if ((*(byte *)((int)piVar1 + 0x3e) & 2) == 0) goto LAB_004c5fc8;
  *(undefined2 *)((int)piVar1 + 0x42) = 7;
LAB_004c5fc8:
  uVar4 = (uint)*(ushort *)((int)piVar1 + 0x42);
  switch(uVar4) {
  case 0:
    *(short *)(piVar1 + 4) = (short)*(undefined4 *)((int)piVar1 + 0x36);
    piVar1[3] = 1;
    *(undefined1 *)((int)piVar1 + 0x25) = 1;
    *(undefined2 *)((int)piVar1 + 0x42) = 2;
  case 2:
    iVar8 = FUN_004f63a0(param_1,piVar1);
    if (iVar8 != 0) {
      *piVar1 = 0;
      piVar1[2] = -1;
      if ((((((&DAT_0096080a)[*(char *)(param_1 + 0xc22) * 0x30] != '\0') &&
            (DAT_005a8150 + 50000 < *(int *)(param_1 + 0x94d))) &&
           (iVar8 = FUN_004f25a0(param_1), iVar8 != 0)) &&
          ((iVar5 = FUN_004c2d80(iVar8), iVar5 != 0 &&
           (iVar5 = FUN_004f3040(iVar8,(short)piVar1[4],2), iVar5 != 0)))) &&
         (iVar8 = FUN_004f2100(iVar8,2), iVar8 != 0)) {
        FUN_004f4de0(param_1,2,(short)piVar1[4]);
      }
      *(undefined1 *)(piVar1 + 9) = 0;
      *(undefined2 *)((int)piVar1 + 0x42) = 3;
    }
    break;
  case 3:
    uVar9 = 0;
    uVar11 = 0xffffffff;
    do {
      if (4 < *(byte *)(piVar1 + 9)) break;
      bVar7 = *(byte *)(piVar1 + 9) + 1;
      *(byte *)(piVar1 + 9) = bVar7;
      uVar4 = bVar7 - 1;
      switch(uVar4) {
      case 0:
        uVar11 = 2;
        uVar9 = *(ushort *)((int)piVar1 + 0x1a);
        break;
      case 1:
        uVar11 = 3;
        uVar9 = *(ushort *)(piVar1 + 7);
        break;
      case 2:
        uVar11 = 6;
        uVar9 = *(ushort *)((int)piVar1 + 0x1e);
        break;
      case 3:
        uVar11 = 4;
        uVar9 = *(ushort *)(piVar1 + 8);
      }
    } while (uVar9 == 0);
    if (99 < uVar9) {
      uVar9 = 100;
    }
    if (uVar9 != 0) {
      uVar4 = FUN_004f8490(param_1,uVar11,uVar11,0xffffffff,1,
                           CONCAT22((short)(uVar4 >> 0x10),(short)piVar1[4]),0x47,uVar9,
                           &DAT_00a0d108);
      bStack_60 = (byte)uVar4;
      bStack_5f = (byte)(uVar4 >> 8);
      uStack_5e = (undefined2)(uVar4 >> 0x10);
      if (uVar4 != 0) {
        *piVar1 = *piVar1 + uVar4;
        if (0 < (int)uVar4) {
          puVar12 = &DAT_00a0d10a;
          local_5c = param_2 + 1;
          local_54 = uVar4;
          do {
            iVar8 = (&DAT_00890390)[*puVar12];
            if ((*(byte *)(iVar8 + 0xe) & 0x10) == 0) {
              *(undefined1 *)(iVar8 + 0x7d) = *(undefined1 *)(iVar8 + 0x2c);
              FUN_004ed6f0(iVar8);
              *(undefined1 *)(iVar8 + 0x2c) = 0xe;
              FUN_004ed640(iVar8);
            }
            puVar12 = puVar12 + 2;
            FUN_004f2440(iVar8,local_5c);
            local_54 = local_54 - 1;
          } while (local_54 != 0);
        }
        switch(uVar11) {
        case 2:
          *(short *)((int)piVar1 + 0x1a) =
               *(short *)((int)piVar1 + 0x1a) - CONCAT11(bStack_5f,bStack_60);
          break;
        case 3:
          *(short *)(piVar1 + 7) = (short)piVar1[7] - CONCAT11(bStack_5f,bStack_60);
          break;
        case 4:
          *(short *)(piVar1 + 8) = (short)piVar1[8] - CONCAT11(bStack_5f,bStack_60);
          break;
        case 6:
          *(short *)((int)piVar1 + 0x1e) =
               *(short *)((int)piVar1 + 0x1e) + CONCAT11(bStack_5f,bStack_60);
        }
      }
    }
    if ((char)piVar1[9] == '\x05') {
      if (*(char *)((int)piVar1 + 0x25) != '\0') {
        iVar8 = (uint)*(ushort *)(piVar1 + 8) +
                (uint)*(ushort *)((int)piVar1 + 0x1a) + (uint)*(ushort *)(piVar1 + 7) +
                (uint)*(ushort *)((int)piVar1 + 0x1e);
        if (iVar8 != 0) {
          *(undefined1 *)(piVar1 + 9) = 0;
          *(undefined2 *)((int)piVar1 + 0x1a) = 0;
          *(undefined2 *)(piVar1 + 8) = 0;
          uVar3 = (undefined2)iVar8;
          if (*(short *)((int)piVar1 + 0x1e) == 0) {
            *(undefined2 *)((int)piVar1 + 0x1e) = uVar3;
            return;
          }
          if ((short)piVar1[7] == 0) {
            *(undefined2 *)(piVar1 + 7) = uVar3;
            return;
          }
        }
        *(undefined1 *)((int)piVar1 + 0x25) = 0;
      }
      if (*piVar1 == 0) {
        FUN_004f6440(param_1,piVar1);
        *(undefined2 *)((int)piVar1 + 0x42) = 7;
        return;
      }
      *(undefined2 *)((int)piVar1 + 0x42) = 4;
      *(undefined1 *)(param_1 + 0x5b1) = 0x14;
      return;
    }
    break;
  case 4:
    FUN_004f5d10(param_1,piVar1,5);
    return;
  case 5:
    local_64 = (undefined2)piVar1[4];
    iVar8 = FUN_004f5d30(&local_64);
    uVar3 = 0;
    if (iVar8 != 0) {
      FUN_00435730(param_1,3,0,(short)piVar1[4]);
      FUN_004359b0(param_1,4,0xffffffff,0xffffffff);
      FUN_0041b180(param_1,0xe,4,0xffffffff,0xffffffff);
      uVar3 = extraout_var;
    }
    FUN_00435730(param_1,0x13,0x808,CONCAT22(uVar3,(short)piVar1[4]));
    FUN_004f6440(param_1,piVar1);
    FUN_004359b0(param_1,0xffffffff,0xffffffff,0xffffffff);
    FUN_00418ce0(param_1,0xe);
    *(undefined2 *)((int)piVar1 + 0x42) = 6;
    return;
  case 6:
    local_5c = 0;
    piVar13 = local_50;
    for (iVar8 = 10; iVar8 != 0; iVar8 = iVar8 + -1) {
      *piVar13 = 0;
      piVar13 = piVar13 + 1;
    }
    piVar13 = local_28;
    for (iVar8 = 10; iVar8 != 0; iVar8 = iVar8 + -1) {
      *piVar13 = 0;
      piVar13 = piVar13 + 1;
    }
    FUN_004f5950(param_1,(short)piVar1[4],local_50,local_28,10,7);
    iVar8 = *(int *)(param_1 + 0x881);
    if (iVar8 != 0) {
      do {
        iVar5 = FUN_004f2460(iVar8,param_2 + 1);
        if ((iVar5 != 0) && ((*(byte *)(iVar8 + 0xc) & 1) == 0)) {
          if ((piVar1[3] != 0) &&
             ((*(char *)(iVar8 + 0x2c) == '\x19' || (*(char *)(iVar8 + 0x2c) == '\x1d')))) {
            piVar1[3] = 0;
            local_54 = CONCAT31(local_54._1_3_,(char)((ushort)*(undefined2 *)(iVar8 + 0x3d) >> 8)) &
                       0xfffffffe;
            local_54 = CONCAT22(local_54._2_2_,
                                CONCAT11((char)((ushort)*(undefined2 *)(iVar8 + 0x3f) >> 8),
                                         (undefined1)local_54)) & 0xfffffeff;
            *(undefined2 *)(piVar1 + 4) = (undefined2)local_54;
            for (iVar5 = *(int *)(param_1 + 0x881); iVar5 != 0; iVar5 = *(int *)(iVar5 + 8)) {
              iVar6 = FUN_004f2460(iVar5,param_2 + 1);
              if (iVar6 != 0) {
                FUN_0043b540(iVar5,(short)piVar1[4]);
              }
            }
          }
          iVar5 = FUN_004f39f0(iVar8);
          if (iVar5 != 0) {
            FUN_004f2440(iVar8,0);
            FUN_00436ca0(iVar8);
            FUN_004e9b40(iVar8);
            if ((*(byte *)(iVar8 + 0xe) & 0x10) == 0) {
              *(undefined1 *)(iVar8 + 0x7d) = *(undefined1 *)(iVar8 + 0x2c);
              if (((byte)DAT_0089d17c & 2) == 0) {
                bVar7 = *(byte *)(iVar8 + 0x2b);
LAB_004c649b:
                uVar10 = (&DAT_005a7064)[(uint)bVar7 * 0x32];
              }
              else {
                bVar7 = *(byte *)(iVar8 + 0x2b);
                if (bVar7 != 7) goto LAB_004c649b;
                uVar10 = 0x27;
              }
              FUN_004ed6f0(iVar8);
              *(undefined1 *)(iVar8 + 0x2c) = uVar10;
              FUN_004ed640(iVar8);
            }
          }
          local_5c = local_5c + 1;
          if (((&DAT_005a6f79)[(uint)*(byte *)(iVar8 + 0x2c) * 5] & 8) != 0) {
            if (local_28[0] == 0) {
              if (local_50[0] == 0) goto LAB_004c6554;
              FUN_00404420((&DAT_00890390)[local_50[0]],&local_58);
              bVar7 = (byte)((ushort)local_58 >> 8);
              local_62 = bVar7 & 0xfe;
              bVar2 = (byte)((ushort)local_56 >> 8);
              bStack_61 = bVar2 & 0xfe;
              uVar4 = CONCAT13(bStack_5f,CONCAT12(bStack_60,CONCAT11(bVar2,bVar7)));
            }
            else {
              bVar7 = (byte)((ushort)*(undefined2 *)((&DAT_00890390)[local_28[0]] + 0x3d) >> 8);
              bStack_60 = bVar7 & 0xfe;
              bVar2 = (byte)((ushort)*(undefined2 *)((&DAT_00890390)[local_28[0]] + 0x3f) >> 8);
              bStack_5f = bVar2 & 0xfe;
              uVar4 = CONCAT22(uStack_5e,CONCAT11(bVar2,bVar7));
            }
            FUN_0043b540(iVar8,uVar4 & 0xfffffefe);
          }
        }
LAB_004c6554:
        iVar8 = *(int *)(iVar8 + 8);
      } while (iVar8 != 0);
    }
    if (local_5c == 0) {
      *(undefined2 *)((int)piVar1 + 0x42) = 7;
    }
    if ((local_50[0] == 0) && (local_28[0] == 0)) {
      uVar3 = FUN_004f6020(param_1);
      local_5c = CONCAT22(local_5c._2_2_,uVar3);
      uVar11 = local_5c;
      local_5c._0_1_ = (byte)uVar3;
      local_5c._1_3_ = SUB43(uVar11,1);
      local_5c = CONCAT31(local_5c._1_3_,(byte)local_5c) & 0xfffffefe;
      local_58 = (ushort)(byte)local_5c << 8;
      local_56 = (ushort)local_5c._1_1_ << 8;
      iVar8 = *(int *)(param_1 + 0x881);
      if (iVar8 != 0) {
        do {
          iVar5 = FUN_004f2460(iVar8,param_2 + 1);
          if (iVar5 != 0) {
            FUN_0043b2a0(iVar8,&local_58);
          }
          iVar8 = *(int *)(iVar8 + 8);
        } while (iVar8 != 0);
      }
      *(undefined2 *)((int)piVar1 + 0x42) = 7;
      return;
    }
    break;
  case 7:
    FUN_004f2520(param_1,param_2 + 1);
    FUN_004f6840(param_1,piVar1);
    FUN_00462770(piVar1);
    return;
  }
  return;
}
