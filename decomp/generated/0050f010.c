/* Ghidra 12.1.3 pseudocode; entry 0050f010; FUN_0050f010.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_0050f010(int param_1,undefined2 param_2,undefined2 param_3,char param_4,int param_5)

{
  char cVar1;
  char cVar2;
  bool bVar3;
  byte bVar4;
  char cVar5;
  short sVar6;
  ushort uVar7;
  undefined4 unaff_EBP;
  uint uVar8;
  undefined4 unaff_ESI;
  uint uVar9;
  int iVar10;
  ushort local_16;
  ushort local_14;
  byte local_12;
  byte bStack_11;
  byte local_10;
  byte bStack_f;
  byte bStack_e;
  byte bStack_d;

  local_10 = (byte)param_2;
  bStack_f = (byte)((ushort)param_2 >> 8);
  bVar4 = bStack_f;
  uVar9 = (uint)(CONCAT21((short)((uint)unaff_ESI >> 0x10),local_10) & 0xfffffe) << 8;
  uVar8 = (uint)(CONCAT21((short)((uint)unaff_EBP >> 0x10),bStack_f) & 0xfffffe) << 8;
  sVar6 = calc_point_height(uVar9,uVar8);
  bVar3 = false;
  iVar10 = (int)sVar6;
  cVar5 = param_4 * '\x03';
  do {
    FUN_0050ecc0(param_1,CONCAT13(bStack_d,CONCAT12(bStack_e,CONCAT11(bStack_f,local_10))),
                 (int)*(char *)(param_1 + 0x2f),(int)*(short *)(param_1 + 0x6c),iVar10);
    FUN_0050ecc0(param_1,CONCAT13(bVar4,CONCAT12(cVar5,CONCAT11(bStack_f + (char)param_5,
                                                                local_10 + param_4))) & 0xfeffffff,
                 (int)*(char *)(param_1 + 0x2f),(int)*(short *)(param_1 + 0x6c),iVar10);
    cVar1 = local_10 + param_4 + param_4;
    cVar2 = bStack_f + (char)param_5 + (char)param_5;
    FUN_0050ecc0(param_1,CONCAT13(bVar4,CONCAT12(cVar5,CONCAT11(cVar2,cVar1))) & 0xfeffffff,
                 (int)*(char *)(param_1 + 0x2f),(int)*(short *)(param_1 + 0x6c),iVar10);
    FUN_0050ecc0(param_1,CONCAT13(bVar4,CONCAT12(cVar5,CONCAT11(cVar2 + (char)param_5 * -3,
                                                                cVar1 + param_4 * -3))) & 0xfeffffff
                 ,(int)*(char *)(param_1 + 0x2f),(int)*(short *)(param_1 + 0x6c),iVar10);
    iVar10 = iVar10 + *(int *)(param_1 + 0x7e);
    if (param_5 == 0) {
      uVar7 = (short)uVar9 + *(short *)(param_1 + 0x82);
      uVar9 = (uint)uVar7;
      local_14 = CONCAT11((char)(uVar8 >> 8),(char)(uVar7 >> 8)) & 0xfefe;
      bStack_f = bStack_f + *(char *)(param_1 + 0x7a);
      bStack_e = (byte)local_14;
      bStack_d = (byte)(local_14 >> 8);
      bStack_11 = (byte)((ushort)param_3 >> 8);
      local_12 = bStack_11 ^ bStack_f;
      local_10 = bStack_e;
    }
    else {
      uVar7 = (short)uVar8 + *(short *)(param_1 + 0x82);
      uVar8 = (uint)uVar7;
      local_16 = CONCAT11((char)(uVar7 >> 8),(char)(uVar9 >> 8)) & 0xfefe;
      local_10 = local_10 + *(char *)(param_1 + 0x7a);
      bStack_e = (byte)local_16;
      bStack_d = (byte)(local_16 >> 8);
      local_12 = (byte)param_3;
      local_12 = local_12 ^ local_10;
      bStack_f = bStack_d;
    }
    if ((local_12 & 0xfe) == 0) {
      bVar3 = true;
    }
  } while (!bVar3);
  FUN_0050ecc0(param_1,CONCAT13(bStack_d,CONCAT12(bStack_e,CONCAT11(bStack_f,local_10))),
               (int)*(char *)(param_1 + 0x2f),(int)*(short *)(param_1 + 0x6c),iVar10);
  FUN_0050ecc0(param_1,CONCAT13(bVar4,CONCAT12(cVar5,CONCAT11(bStack_f + (char)param_5,
                                                              local_10 + param_4))) & 0xfeffffff,
               (int)*(char *)(param_1 + 0x2f),(int)*(short *)(param_1 + 0x6c),iVar10);
  cVar1 = local_10 + param_4 + param_4;
  cVar2 = bStack_f + (char)param_5 + (char)param_5;
  FUN_0050ecc0(param_1,CONCAT13(bVar4,CONCAT12(cVar5,CONCAT11(cVar2,cVar1))) & 0xfeffffff,
               (int)*(char *)(param_1 + 0x2f),(int)*(short *)(param_1 + 0x6c),iVar10);
  FUN_0050ecc0(param_1,CONCAT13(bVar4,CONCAT12(cVar5,CONCAT11(cVar2 + (char)param_5 * -3,
                                                              cVar1 + param_4 * -3))) & 0xfeffffff,
               (int)*(char *)(param_1 + 0x2f),(int)*(short *)(param_1 + 0x6c),iVar10);
  return;
}
