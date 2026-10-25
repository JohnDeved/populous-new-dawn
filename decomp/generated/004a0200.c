/* Ghidra 12.1.3 pseudocode; entry 004a0200; FUN_004a0200.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_004a0200(int param_1)

{
  int iVar1;
  int iVar2;
  int iVar3;
  int iVar4;
  int iVar5;
  uint uVar6;
  int iVar7;
  short *psVar8;
  int iVar9;
  uint uVar10;
  int iVar11;
  wchar_t *_Format;
  wchar_t awStack_200 [256];

  if (*(int *)(param_1 + 0x10) != 0) {
    iVar1 = FUN_0044a1f0();
    iVar2 = FUN_0044a210();
    iVar3 = FUN_0044a1f0();
    iVar4 = FUN_0044a210();
    if (*(int *)(param_1 + 8) == 0) {
      DAT_005da074 = DAT_005da074 | 8;
    }
    else {
      DAT_005da074 = DAT_005da074 & 0xfffffff7;
    }
    FUN_004a1dd0(param_1,&DAT_005caba8);
    if ((*(int *)(param_1 + 8) != 0) && (*(int *)(param_1 + 0x4f) != 0)) {
      if ((*(int *)(param_1 + 0x18) != 0) || (iVar5 = 0, *(int *)(param_1 + 0x1c) != 0)) {
        iVar5 = 1;
      }
      iVar7 = *(int *)(param_1 + 99) + 1;
      iVar9 = (*(int *)(param_1 + 0x4f) + iVar5) * 8 + DAT_0059df14;
      iVar5 = DAT_0089c6f0 * 0xc65;
      if ((*(byte *)((int)&DAT_0089db05 + iVar5) & 0x80) == 0) {
        iVar11 = 0;
        psVar8 = (short *)(iVar5 + 0x89dc85 + iVar7 * 2);
        iVar5 = 5;
        do {
          iVar11 = iVar11 + *psVar8;
          psVar8 = psVar8 + 6;
          iVar5 = iVar5 + -1;
        } while (iVar5 != 0);
      }
      else {
        iVar11 = 0;
        psVar8 = (short *)(iVar5 + 0x89dcf1 + iVar7 * 2);
        iVar5 = 5;
        do {
          iVar11 = iVar11 + *psVar8;
          psVar8 = psVar8 + 6;
          iVar5 = iVar5 + -1;
        } while (iVar5 != 0);
      }
      iVar5 = FUN_00493210();
      if (iVar5 == 0) {
        FUN_00516d30();
      }
      else {
        FUN_00451b40();
      }
      if (iVar11 < 100) {
        _Format = u__02d_005cd2c8;
      }
      else {
        _Format = u__03d_005cd2d4;
      }
      _swprintf(awStack_200,_Format);
      uVar10 = (uint)*(ushort *)(iVar9 + 4);
      uVar6 = (uint)*(ushort *)(iVar9 + 6);
      if (DAT_0089c6cf != 0x280) {
        if (DAT_005ca944 != DAT_0089c6cf) {
          DAT_005ca944 = DAT_0089c6cf;
          DAT_005ca948 = ((int)DAT_0089c6cf << 0x10) / 0x280;
        }
        uVar6 = (int)(uVar6 * DAT_005ca948) >> 0x10;
        uVar10 = (int)(uVar10 * DAT_005ca948) >> 0x10;
      }
      FUN_00516430((iVar3 + iVar1) / 2 - (int)uVar10 / 2,(iVar2 + iVar4) / 2 - (int)(uVar6 + 8) / 2,
                   iVar9);
      if (iVar11 != 0) {
        iVar4 = iVar4 + -10;
        DAT_0098489c = 0;
        iVar2 = FUN_00493210();
        if (iVar2 == 0) {
          iVar2 = FUN_0049a630();
          iVar1 = iVar1 + ((iVar3 - iVar2) - iVar1) / 2;
          iVar2 = FUN_00493210();
          if (iVar2 == 0) {
            FUN_00415f70(DAT_0098489c);
            FUN_00527960((int)(short)iVar1,iVar4,awStack_200);
          }
          else {
            FUN_00451ba0(iVar1,iVar4);
          }
        }
        else {
          iVar2 = FUN_00452490();
          uVar6 = (iVar3 - iVar2) - iVar1;
          FUN_00452610(CONCAT22((ushort)(uVar6 >> 0x11),(short)(uVar6 >> 1) + (short)iVar1),
                       CONCAT22((short)((uint)iVar4 >> 0x10),(short)iVar4 + 1));
        }
      }
    }
    DAT_005da074 = DAT_005da074 & 0xfffffff7;
  }
  return;
}
