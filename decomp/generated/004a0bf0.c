/* Ghidra 12.1.3 pseudocode; entry 004a0bf0; FUN_004a0bf0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_004a0bf0(int param_1,int param_2,int param_3)

{
  int iVar1;
  int iVar2;
  int iVar3;
  int iVar4;
  int iVar5;
  uint uVar6;
  uint uVar7;
  wchar_t *_Format;
  wchar_t local_40 [32];

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
    if (param_3 < 100) {
      _Format = u__02d_005cd2c8;
    }
    else {
      _Format = u__03d_005cd2d4;
    }
    _swprintf(local_40,_Format);
    iVar5 = FUN_00493210();
    if (iVar5 == 0) {
      FUN_00516d30();
    }
    else {
      FUN_00451b40();
    }
    uVar7 = (uint)*(ushort *)(param_2 + 6);
    uVar6 = (uint)*(ushort *)(param_2 + 4);
    if (DAT_0089c6cf != 0x280) {
      if (DAT_005ca944 != DAT_0089c6cf) {
        DAT_005ca944 = DAT_0089c6cf;
        DAT_005ca948 = ((int)DAT_0089c6cf << 0x10) / 0x280;
      }
      uVar7 = (int)(uVar7 * DAT_005ca948) >> 0x10;
      uVar6 = (int)(uVar6 * DAT_005ca948) >> 0x10;
    }
    FUN_00516430((iVar3 + iVar1) / 2 - (int)uVar6 / 2,(iVar2 + iVar4) / 2 - (int)(uVar7 + 8) / 2,
                 param_2);
    if (param_3 != 0) {
      iVar4 = iVar4 + -10;
      DAT_0098489c = 0;
      iVar2 = FUN_00493210();
      if (iVar2 == 0) {
        iVar2 = FUN_0049a630();
        iVar1 = iVar1 + ((iVar3 - iVar2) - iVar1) / 2;
        iVar2 = FUN_00493210();
        if (iVar2 == 0) {
          FUN_00415f70(DAT_0098489c);
          FUN_00527960((int)(short)iVar1,iVar4,local_40);
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
    DAT_005da074 = DAT_005da074 & 0xfffffff7;
  }
  return;
}
