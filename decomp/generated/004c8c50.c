/* Ghidra 12.1.3 pseudocode; entry 004c8c50; FUN_004c8c50.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


uint FUN_004c8c50(int param_1,int param_2)

{
  int *piVar1;
  ushort uVar2;
  uint uVar3;
  undefined4 uVar4;
  uint3 uVar5;
  undefined2 uVar6;
  uint uVar7;
  int iVar8;
  uint uVar9;
  uint uVar10;
  char cVar11;
  int iVar12;
  undefined4 local_1a;
  char local_16;
  char cStack_15;
  undefined2 uStack_14;
  int local_c;
  short local_8;
  short sStack_6;
  undefined2 local_4;

  piVar1 = (int *)(param_2 * 0x52 + 0x36 + param_1);
  uVar2 = *(ushort *)((int)piVar1 + 0x42);
  if ((uVar2 != 3) && (uVar2 != 2)) {
    local_c = 0;
    if ((*(ushort *)((int)piVar1 + 0x32) != 0) &&
       ((iVar12 = (&DAT_00890390)[*(ushort *)((int)piVar1 + 0x32)],
        (*(byte *)(iVar12 + 0xc) & 1) == 0 && (*(char *)(iVar12 + 0x2a) != '\0')))) {
      local_c = iVar12;
    }
    if ((local_c == 0) || ((*(byte *)((int)piVar1 + 0x3e) & 2) != 0)) {
      FUN_004f6840(param_1,piVar1);
      uVar7 = FUN_00462770(piVar1);
      return uVar7;
    }
  }
  uVar7 = (uint)uVar2;
  switch(uVar7) {
  case 0:
    *piVar1 = 0;
    *(undefined2 *)((int)piVar1 + 0x42) = 4;
  case 4:
    uVar7 = FUN_004f63a0(param_1,piVar1);
    if (uVar7 != 0) {
      *(undefined2 *)((int)piVar1 + 0x42) = 5;
      *(undefined1 *)(param_1 + 0x5b1) = 0x14;
      if ((*(byte *)(local_c + 0xe) & 0x10) == 0) {
        *(undefined1 *)(local_c + 0x7d) = *(undefined1 *)(local_c + 0x2c);
        FUN_004ed6f0(local_c);
        *(undefined1 *)(local_c + 0x2c) = 0xe;
        uVar7 = FUN_004ed640(local_c);
      }
    }
    break;
  case 2:
    *(undefined4 *)((int)piVar1 + 0x32) = 1;
    uVar6 = FUN_004f6020(param_1);
    local_16 = (char)uVar6;
    cStack_15 = (char)((ushort)uVar6 >> 8);
    iVar12 = (uint)*(byte *)(param_1 + 0x36c) -
             (uint)(byte)(&DAT_009607f8)[*(char *)(param_1 + 0xc22) * 0x30];
    if (iVar12 == 0) {
      uVar9 = 0x18;
    }
    else {
      uVar9 = iVar12 * 4;
    }
    uVar7 = DAT_0089d178 * 0x24a1 + 0x24df;
    uVar3 = uVar7 >> 0xd | uVar7 * 0x80000;
    cVar11 = (char)((int)uVar9 >> 1);
    uVar10 = uVar3 * 0x24a1 + 0x24df;
    uVar7 = uVar10 >> 0xd;
    DAT_0089d178 = uVar7 | uVar10 * 0x80000;
    uStack_14 = (undefined2)uVar7;
    iVar12 = 0;
    uVar7 = DAT_0089d178 / uVar9;
    uVar10 = DAT_0089d178 % uVar9;
    while (*(short *)((int)piVar1 + 0x42) != 3) {
      uVar6 = FUN_0049c890(CONCAT22(uStack_14,
                                    CONCAT11(cStack_15 + ((char)uVar10 - cVar11),
                                             local_16 + ((char)(uVar3 % uVar9) - cVar11))),iVar12,0)
      ;
      local_1a._2_1_ = (byte)uVar6;
      local_1a._3_1_ = (byte)((ushort)uVar6 >> 8);
      uVar5 = CONCAT12(local_1a._2_1_,uVar6);
      local_1a = CONCAT13(local_1a._3_1_,uVar5) & 0xfefeffff;
      local_8 = (local_1a._2_1_ + 1) * 0x100;
      uVar4 = CONCAT22(sStack_6,local_8);
      sStack_6 = (local_1a._3_1_ + 1) * 0x100;
      local_4 = FUN_0044e940(uVar4,CONCAT22(local_4,sStack_6));
      uVar7 = FUN_00518200(&local_8,0);
      if ((char)uVar7 == '\0') {
        iVar8 = FUN_004f3ef0(param_1,&DAT_008a03e4 + ((uVar5 & 0xfe) * 2 | uVar5 & 0xfe00));
        uVar7 = 0;
        if (iVar8 != 0) {
          *(uint *)((int)piVar1 + 0x36) = uVar5 & 0xffff;
          *(undefined2 *)((int)piVar1 + 0x42) = 3;
          return uVar5 & 0xffff;
        }
      }
      iVar12 = iVar12 + 1;
      if (0x16 < iVar12) {
        return uVar7;
      }
    }
    break;
  case 3:
    *piVar1 = 1;
    if (*(int *)((int)piVar1 + 0x32) != 0) {
      *piVar1 = 0;
    }
    uVar7 = FUN_004f7dc0(param_1,4,4,0xffffffff,1,*(undefined4 *)((int)piVar1 + 0x36),
                         (-(*(int *)((int)piVar1 + 0x3a) == 0) & 3U) + 0x44);
    if (uVar7 != 0) {
      *(undefined2 *)((int)piVar1 + 0x42) = 4;
      *(uint *)((int)piVar1 + 0x32) = (uint)*(ushort *)(uVar7 + 0x24);
      return uVar7;
    }
    *(undefined2 *)((int)piVar1 + 0x42) = 7;
    return 0;
  case 5:
    uVar7 = FUN_004f5d10(param_1,piVar1,6);
    return uVar7;
  case 6:
    if (*piVar1 == 0) {
      iVar12 = 1;
      do {
        FUN_00435730(param_1,0x11,0,*(undefined4 *)((int)piVar1 + 0x36));
        iVar12 = iVar12 + -1;
      } while (iVar12 != 0);
    }
    else {
      FUN_00435730(param_1,0x13,0x202,*(undefined4 *)((int)piVar1 + 0x36));
      FUN_00435730(param_1,0x11,0,*(undefined4 *)((int)piVar1 + 0x36));
    }
    FUN_004f6440(param_1,piVar1);
    FUN_004359b0(param_1,0xffffffff,0xffffffff,0xffffffff);
    uVar7 = FUN_00418ce0(param_1,0xe);
    *(undefined2 *)((int)piVar1 + 0x42) = 7;
    return uVar7;
  case 7:
    FUN_004f6840(param_1,piVar1);
    uVar7 = FUN_00462770(piVar1);
    return uVar7;
  }
  return uVar7;
}
