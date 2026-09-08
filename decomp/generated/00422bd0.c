/* Ghidra 12.1.3 pseudocode; entry 00422bd0; FUN_00422bd0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


bool FUN_00422bd0(ushort param_1,int param_2)

{
  byte bVar1;
  short sVar2;
  short sVar3;
  short sVar4;
  short sVar5;
  uint uVar6;
  bool bVar7;
  uint uVar8;
  byte bVar9;
  byte bVar10;
  uint uVar11;
  int iVar12;
  int iVar13;
  int iVar14;
  uint uVar15;
  int iVar16;
  int iVar17;
  int iVar18;
  int iVar19;
  int local_10;
  undefined4 local_c;
  int local_8;
  int local_4;

  bVar7 = false;
  local_10 = 0x400;
  uVar11 = (param_1 & 0xfe) * 2 | param_1 & 0xfe00;
  local_c._0_1_ = (byte)param_1;
  local_c._1_1_ = (byte)(param_1 >> 8);
  bVar9 = local_c._1_1_;
  if ((param_1 & 1) == 0) {
    bVar10 = local_c._1_1_ & 1;
  }
  else {
    bVar10 = ((param_1 & 0x100) == 0) + 2;
  }
  if ((((byte)local_c & 0xfe) == 0xfe) || ((local_c._1_1_ & 0xfe) == 0xfe)) {
    local_c._0_2_ = CONCAT11(local_c._1_1_ + 2,(byte)local_c);
    sVar4 = (&game_state.level_data[0].height)[uVar11 * 2];
    uVar6 = (uint)(ushort)local_c;
    uVar15 = (uint)(ushort)local_c;
    bVar1 = (byte)local_c + 2;
    uVar8 = (uint)(ushort)local_c;
    local_c._0_2_ = CONCAT11(bVar9,bVar1);
    sVar2 = (&game_state.level_data[0].height)[((uVar6 & 0xfe) * 2 | uVar15 & 0xfe00) * 2];
    sVar3 = (&game_state.level_data[0].height)[((bVar1 & 0xfe) * 2 | uVar8 & 0xfe00) * 2];
    sVar5 = (&game_state.level_data[0].height)
            [(((ushort)local_c & 0xfe) * 2 | (ushort)local_c & 0xfe00) * 2];
    param_1 = (ushort)local_c;
  }
  else {
    sVar2 = (&game_state.level_data[0x80].height)[uVar11 * 2];
    sVar3 = (&game_state.level_data[0x81].height)[uVar11 * 2];
    sVar4 = (&game_state.level_data[0].height)[uVar11 * 2];
    sVar5 = (&game_state.level_data[1].height)[uVar11 * 2];
  }
  local_c = CONCAT22(local_c._2_2_,param_1);
  iVar19 = (int)sVar5;
  iVar18 = (int)sVar4;
  iVar14 = (int)sVar3;
  iVar12 = (int)sVar2;
  iVar16 = iVar18;
  iVar17 = iVar12;
  iVar13 = iVar19;
  if ((*(byte *)(&game_state.level_data[0].flags + uVar11) & 1) == 0) {
    iVar13 = iVar14;
    if ((bVar10 != 1) && (iVar17 = iVar14, iVar13 = iVar19, bVar10 != 3)) {
      bVar7 = true;
      iVar16 = local_c;
      iVar17 = local_8;
      iVar13 = local_4;
    }
  }
  else if ((bVar10 != 0) && (iVar16 = iVar12, iVar17 = iVar14, bVar10 != 2)) {
    bVar7 = true;
    iVar16 = local_c;
    iVar17 = local_8;
    iVar13 = local_4;
  }
  local_4 = iVar13;
  iVar13 = 0;
  if (bVar7) {
    if (iVar18 < 0x400) {
      local_10 = iVar18;
    }
    if (iVar12 < local_10) {
      local_10 = iVar12;
    }
    if (iVar14 < local_10) {
      local_10 = iVar14;
    }
    if (iVar19 < local_10) {
      local_10 = iVar19;
    }
    if (0 < iVar18) {
      iVar13 = iVar18;
    }
    if (iVar13 < iVar12) {
      iVar13 = iVar12;
    }
    if (iVar13 < iVar14) {
      iVar13 = iVar14;
    }
    if (iVar13 < iVar19) {
      iVar13 = iVar19;
    }
  }
  else {
    if (iVar16 < 0x400) {
      local_10 = iVar16;
    }
    if (iVar17 < local_10) {
      local_10 = iVar17;
    }
    if (local_4 < local_10) {
      local_10 = local_4;
    }
    if (0 < iVar16) {
      iVar13 = iVar16;
    }
    if (iVar13 < iVar17) {
      iVar13 = iVar17;
    }
    if (iVar13 < local_4) {
      iVar13 = local_4;
    }
  }
  return iVar13 - local_10 <= param_2;
}
