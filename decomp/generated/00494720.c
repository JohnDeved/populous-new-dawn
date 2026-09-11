/* Ghidra 12.1.3 pseudocode; entry 00494720; FUN_00494720.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_00494720(short *param_1,ushort param_2,short param_3)

{
  undefined4 uVar1;
  bool bVar2;
  byte bVar3;
  byte bVar4;
  uint uVar5;
  int iVar6;
  uint uVar7;
  int iVar8;
  uint uVar9;
  uint uVar10;
  int iVar11;
  short *psVar12;
  int iVar13;
  undefined2 local_e;
  int local_c;
  undefined4 local_4;

  local_4 = (uint)param_2;
  bVar4 = (byte)param_3;
  uVar7 = (uint)bVar4;
  param_1[1] = param_3;
  uVar10 = local_4 & 0xff;
  iVar11 = uVar7 - uVar10;
  local_c = iVar11;
  if (iVar11 < 0) {
    local_c = uVar10 - uVar7;
  }
  if (0x80 < local_c) {
    local_c = 0x100 - local_c;
  }
  local_e._1_1_ = (byte)((ushort)param_3 >> 8);
  bVar3 = local_e._1_1_;
  local_4._1_1_ = (byte)(param_2 >> 8);
  uVar5 = (uint)local_4._1_1_;
  iVar6 = local_e._1_1_ - uVar5;
  if (iVar6 < 0) {
    iVar6 = uVar5 - local_e._1_1_;
  }
  if (0x80 < iVar6) {
    iVar6 = 0x100 - iVar6;
  }
  iVar13 = iVar6;
  if (local_c < iVar6) {
    iVar13 = local_c;
    local_c = iVar6;
  }
  local_e._1_1_ = local_e._1_1_ + 2;
  local_e = CONCAT11(local_e._1_1_,bVar4);
  *param_1 = (short)local_c + (short)(iVar13 / 2);
  param_1[3] = local_e;
  if (iVar11 < 0) {
    iVar11 = uVar10 - uVar7;
  }
  if (0x80 < iVar11) {
    iVar11 = 0x100 - iVar11;
  }
  uVar7 = (uint)local_e._1_1_;
  iVar13 = uVar7 - uVar5;
  iVar6 = iVar13;
  if (iVar13 < 0) {
    iVar6 = uVar5 - uVar7;
  }
  if (0x80 < iVar6) {
    iVar6 = 0x100 - iVar6;
  }
  iVar8 = iVar6;
  local_c = iVar11;
  if (iVar11 < iVar6) {
    iVar8 = iVar11;
    local_c = iVar6;
  }
  bVar4 = bVar4 + 2;
  local_e = CONCAT11(local_e._1_1_,bVar4);
  param_1[2] = (short)local_c + (short)(iVar8 / 2);
  param_1[5] = local_e;
  uVar9 = (uint)bVar4;
  iVar11 = uVar9 - uVar10;
  local_c = iVar11;
  if (iVar11 < 0) {
    local_c = uVar10 - uVar9;
  }
  if (0x80 < local_c) {
    local_c = 0x100 - local_c;
  }
  if (iVar13 < 0) {
    iVar13 = uVar5 - uVar7;
  }
  if (0x80 < iVar13) {
    iVar13 = 0x100 - iVar13;
  }
  iVar6 = iVar13;
  if (local_c < iVar13) {
    iVar6 = local_c;
    local_c = iVar13;
  }
  local_e = CONCAT11(bVar3,bVar4);
  param_1[4] = (short)local_c + (short)(iVar6 / 2);
  param_1[7] = local_e;
  if (iVar11 < 0) {
    iVar11 = uVar10 - uVar9;
  }
  if (0x80 < iVar11) {
    iVar11 = 0x100 - iVar11;
  }
  iVar6 = bVar3 - uVar5;
  if (iVar6 < 0) {
    iVar6 = uVar5 - bVar3;
  }
  if (0x80 < iVar6) {
    iVar6 = 0x100 - iVar6;
  }
  iVar13 = iVar6;
  if (iVar11 < iVar6) {
    iVar13 = iVar11;
    iVar11 = iVar6;
  }
  param_1[6] = (short)(iVar13 / 2) + (short)iVar11;
  do {
    bVar2 = true;
    iVar11 = 3;
    psVar12 = param_1;
    do {
      if (psVar12[2] < *psVar12) {
        bVar2 = false;
        uVar1 = *(undefined4 *)psVar12;
        *(undefined4 *)psVar12 = *(undefined4 *)(psVar12 + 2);
        *(undefined4 *)(psVar12 + 2) = uVar1;
      }
      psVar12 = psVar12 + 2;
      iVar11 = iVar11 + -1;
    } while (iVar11 != 0);
  } while (!bVar2);
  return;
}
