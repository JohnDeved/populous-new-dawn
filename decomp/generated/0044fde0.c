/* Ghidra 12.1.3 pseudocode; entry 0044fde0; FUN_0044fde0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


undefined1 FUN_0044fde0(int param_1,short param_2,short param_3,char param_4)

{
  short sVar1;
  short sVar3;
  uint uVar2;
  ushort uVar4;
  int iVar5;
  undefined1 uVar6;
  int iVar7;

  uVar6 = 1;
  sVar1 = *(short *)(param_1 + 4);
  iVar7 = (int)sVar1 - (int)param_2;
  if (iVar7 == 0) {
    return 1;
  }
  iVar5 = iVar7;
  if ((int)sVar1 < (int)param_2) {
    iVar5 = -iVar7;
  }
  sVar3 = param_2 >> 0xf;
  if (param_3 < iVar5) {
    uVar6 = 0;
    if (0 < iVar7) {
      *(short *)(param_1 + 4) = sVar1 - param_3;
      goto LAB_0044fe2b;
    }
    param_2 = param_3 + sVar1;
    uVar6 = 0;
  }
  *(short *)(param_1 + 4) = param_2;
LAB_0044fe2b:
  if (param_4 != '\0') {
    uVar4 = (ushort)(param_1 + -0x8a03e4 >> 4);
    uVar2 = CONCAT22(sVar3,uVar4) & 0xffffff80;
    iVar7 = CONCAT22((short)(uVar2 >> 0x10),(short)uVar2 * 2 | uVar4 & 0x7f) * 2;
    land_level_processing_1(iVar7,2,1);
    level_land_processing_2();
    FUN_0044f2f0(1,iVar7,1,0xffffffff);
  }
  return uVar6;
}
