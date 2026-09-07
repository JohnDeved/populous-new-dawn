/* Ghidra 12.1.3 pseudocode; entry 0044f750; FUN_0044f750.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


int FUN_0044f750(ushort *param_1)

{
  short sVar1;
  short sVar2;
  short sVar3;
  short sVar4;
  int iVar5;
  ushort uVar6;
  byte bVar9;
  uint uVar7;
  int iVar8;
  byte bVar12;
  int iVar10;
  uint uVar11;
  int iVar13;
  uint uVar14;
  int iVar15;
  ushort uVar16;
  int iVar17;
  uint uVar18;
  uint uVar19;
  undefined2 local_e;

  iVar5 = 0;
  iVar15 = 0x400;
  uVar6 = (*param_1 & 0x1fe) >> 1;
  bVar12 = (byte)(*param_1 >> 8);
  bVar9 = (byte)(param_1[1] >> 8);
  local_e = CONCAT11(bVar9,bVar12);
  uVar16 = (param_1[1] & 0x1fe) >> 1;
  uVar7 = (local_e & 0xfe) * 2 | local_e & 0xfe00;
  if (((bVar12 & 0xfe) == 0xfe) || ((bVar9 & 0xfe) == 0xfe)) {
    local_e = CONCAT11(bVar9 + 2,bVar12);
    sVar3 = (&game_state.level_data[0].height)[uVar7 * 2];
    uVar11 = (uint)local_e;
    uVar18 = (uint)local_e;
    local_e = CONCAT11(bVar9 + 2,bVar12 + 2);
    uVar14 = (uint)local_e;
    uVar19 = (uint)local_e;
    local_e = CONCAT11(bVar9,bVar12 + 2);
    sVar1 = (&game_state.level_data[0].height)[((uVar11 & 0xfe) * 2 | uVar18 & 0xfe00) * 2];
    sVar2 = (&game_state.level_data[0].height)[((uVar19 & 0xfe) * 2 | uVar14 & 0xfe00) * 2];
    sVar4 = (&game_state.level_data[0].height)[((local_e & 0xfe) * 2 | local_e & 0xfe00) * 2];
  }
  else {
    sVar1 = (&game_state.level_data[0x80].height)[uVar7 * 2];
    sVar2 = (&game_state.level_data[0x81].height)[uVar7 * 2];
    sVar3 = (&game_state.level_data[0].height)[uVar7 * 2];
    sVar4 = (&game_state.level_data[1].height)[uVar7 * 2];
  }
  iVar17 = (int)sVar2;
  iVar13 = (int)sVar4;
  iVar10 = (int)sVar1;
  iVar8 = (int)sVar3;
  if ((*(byte *)(&game_state.level_data[0].flags + uVar7) & 1) == 0) {
    if (uVar16 < uVar6) {
      if (iVar8 < 0x400) {
        iVar15 = iVar8;
      }
      if (iVar17 < iVar15) {
        iVar15 = iVar17;
      }
      if (iVar13 < iVar15) {
        iVar15 = iVar13;
      }
      if (0 < iVar8) {
        iVar5 = iVar8;
      }
      if (iVar5 < iVar17) {
        iVar5 = iVar17;
      }
      if (iVar5 < iVar13) {
        return iVar13 - iVar15;
      }
    }
    else {
      if (iVar8 < 0x400) {
        iVar15 = iVar8;
      }
      if (iVar10 < iVar15) {
        iVar15 = iVar10;
      }
      if (iVar17 < iVar15) {
        iVar15 = iVar17;
      }
      if (0 < iVar8) {
        iVar5 = iVar8;
      }
      if (iVar5 < iVar10) {
        iVar5 = iVar10;
      }
      if (iVar5 < iVar17) {
        return iVar17 - iVar15;
      }
    }
  }
  else if ((ushort)(uVar16 + uVar6) < 0x100) {
    if (iVar8 < 0x400) {
      iVar15 = iVar8;
    }
    if (iVar10 < iVar15) {
      iVar15 = iVar10;
    }
    if (iVar13 < iVar15) {
      iVar15 = iVar13;
    }
    if (0 < iVar8) {
      iVar5 = iVar8;
    }
    if (iVar5 < iVar10) {
      iVar5 = iVar10;
    }
    if (iVar5 < iVar13) {
      return iVar13 - iVar15;
    }
  }
  else {
    if (iVar10 < 0x400) {
      iVar15 = iVar10;
    }
    if (iVar17 < iVar15) {
      iVar15 = iVar17;
    }
    if (iVar13 < iVar15) {
      iVar15 = iVar13;
    }
    if (0 < iVar10) {
      iVar5 = iVar10;
    }
    if (iVar5 < iVar17) {
      iVar5 = iVar17;
    }
    if (iVar5 < iVar13) {
      iVar5 = iVar13;
    }
  }
  return iVar5 - iVar15;
}
