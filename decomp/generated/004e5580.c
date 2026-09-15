/* Ghidra 12.1.3 pseudocode; entry 004e5580; FUN_004e5580.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


undefined4 FUN_004e5580(int param_1,undefined4 param_2)

{
  short *psVar1;
  byte bVar2;
  bool bVar3;
  undefined2 uVar4;
  int iVar5;
  int iVar6;
  byte *pbVar7;

  uVar4 = FUN_004f6020(param_1);
  bVar2 = *(byte *)((int)game_state.start_n1 + *(char *)(param_1 + 0xc22) * 0x30 + -0x27);
  iVar5 = FUN_00462d40(param_1,0);
  if ((int)(uint)bVar2 <= iVar5) {
    return 0;
  }
  iVar5 = FUN_004f2e00(param_1);
  if (iVar5 != 0) {
    if (*(short *)(param_1 + 0xb85) == 0) {
      iVar5 = FUN_004f6480(param_1,4);
      if (iVar5 == 0) {
        iVar5 = FUN_004f5e80(param_1,4,param_2,uVar4);
        if (iVar5 != 0) {
          return 1;
        }
        goto LAB_004e565c;
      }
    }
    bVar3 = false;
    if (*(char *)(param_1 + 0x5b4) == '\0') {
      pbVar7 = (byte *)(param_1 + 0x74);
      iVar5 = 10;
      do {
        if ((((*pbVar7 & 1) != 0) && (pbVar7[0x11] == 0)) && (*(int *)(pbVar7 + -0xc) == 4)) {
          bVar3 = true;
        }
        pbVar7 = pbVar7 + 0x52;
        iVar5 = iVar5 + -1;
      } while (iVar5 != 0);
      if (!bVar3) {
        iVar5 = FUN_004f5e80(param_1,4,param_2,uVar4);
        if (iVar5 != 0) {
          return 1;
        }
      }
    }
  }
LAB_004e565c:
  if (DAT_005d54e8 != -1) {
    iVar5 = 0;
    do {
      iVar6 = FUN_00408dd0((int)*(short *)((int)&DAT_005d54e8 + iVar5),
                           (int)*(char *)(param_1 + 0xc22));
      if (iVar6 != 0) {
        bVar2 = *(byte *)(*(char *)(param_1 + 0xc22) * 0x30 + 0x9607ea +
                         (int)*(short *)((int)&DAT_005d54f8 + iVar5));
        iVar6 = FUN_004f6480(param_1,(int)*(short *)((int)&DAT_005d54e8 + iVar5));
        if (iVar6 < (int)(uint)bVar2) {
          iVar6 = FUN_004f5e80(param_1,(int)*(short *)((int)&DAT_005d54e8 + iVar5),param_2,uVar4);
          if (iVar6 != 0) {
            return 1;
          }
        }
      }
      psVar1 = (short *)((int)&DAT_005d54ea + iVar5);
      iVar5 = iVar5 + 2;
    } while (*psVar1 != -1);
  }
  iVar5 = FUN_00408dd0(0xd,(int)*(char *)(param_1 + 0xc22));
  if (iVar5 == 0) {
    iVar5 = FUN_00408dd0(0xe,(int)*(char *)(param_1 + 0xc22));
    if (iVar5 != 0) goto LAB_004e570a;
  }
  else {
LAB_004e570a:
    bVar2 = *(byte *)((int)game_state.start_n1 + *(char *)(param_1 + 0xc22) * 0x30 + -0xd);
    iVar5 = FUN_004f6480(param_1,0xd);
    if (iVar5 < (int)(uint)bVar2) {
      iVar5 = FUN_004f5e80(param_1,0xd,param_2,uVar4);
      if (iVar5 != 0) {
        return 1;
      }
    }
  }
  iVar5 = FUN_00408dd0(0xf,(int)*(char *)(param_1 + 0xc22));
  if (iVar5 == 0) {
    iVar5 = FUN_00408dd0(0x10,(int)*(char *)(param_1 + 0xc22));
    if (iVar5 == 0) goto LAB_004e57c2;
  }
  bVar2 = *(byte *)(game_state.start_n1 + *(char *)(param_1 + 0xc22) * 0xc + -3);
  iVar5 = FUN_004f6480(param_1,0xf);
  if (iVar5 < (int)(uint)bVar2) {
    iVar5 = FUN_004f5e80(param_1,0xf,param_2,uVar4);
    if (iVar5 != 0) {
      return 1;
    }
  }
LAB_004e57c2:
  bVar2 = *(byte *)((int)game_state.start_n1 + *(char *)(param_1 + 0xc22) * 0x30 + -0x26);
  if (bVar2 != 0) {
    iVar5 = FUN_004f6520(param_1);
    if (iVar5 < (int)(uint)bVar2) {
      iVar5 = FUN_004f5ed0(param_1,param_2,uVar4);
      if (iVar5 != 0) {
        return 1;
      }
    }
  }
  return 0;
}
