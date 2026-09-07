/* Ghidra 12.1.3 pseudocode; entry 0044e940; calc_point_height.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


int calc_point_height(ushort param_1,ushort param_2)

{
  short sVar1;
  short sVar2;
  short sVar3;
  byte bVar6;
  uint uVar4;
  int iVar5;
  short sVar7;
  byte bVar10;
  int iVar8;
  uint uVar9;
  uint uVar11;
  int iVar12;
  uint uVar13;
  uint uVar14;
  int iVar15;
  uint uVar16;
  uint uVar17;
  undefined2 local_6;

  uVar11 = (uint)((param_1 & 0x1fe) >> 1);
  bVar10 = (byte)(param_1 >> 8);
  bVar6 = (byte)(param_2 >> 8);
  local_6 = CONCAT11(bVar6,bVar10);
  uVar14 = (uint)((param_2 & 0x1fe) >> 1);
  uVar4 = (local_6 & 0xfe) * 2 | local_6 & 0xfe00;
  if (((bVar10 & 0xfe) == 0xfe) || ((bVar6 & 0xfe) == 0xfe)) {
    local_6 = CONCAT11(bVar6 + 2,bVar10);
    sVar2 = (&game_state.level_data[0].height)[uVar4 * 2];
    uVar9 = (uint)local_6;
    uVar16 = (uint)local_6;
    local_6 = CONCAT11(bVar6 + 2,bVar10 + 2);
    uVar13 = (uint)local_6;
    uVar17 = (uint)local_6;
    local_6 = CONCAT11(bVar6,bVar10 + 2);
    sVar7 = (&game_state.level_data[0].height)[((uVar9 & 0xfe) * 2 | uVar16 & 0xfe00) * 2];
    sVar1 = (&game_state.level_data[0].height)[((uVar17 & 0xfe) * 2 | uVar13 & 0xfe00) * 2];
    sVar3 = (&game_state.level_data[0].height)[((local_6 & 0xfe) * 2 | local_6 & 0xfe00) * 2];
  }
  else {
    sVar7 = (&game_state.level_data[0x80].height)[uVar4 * 2];
    sVar1 = (&game_state.level_data[0x81].height)[uVar4 * 2];
    sVar2 = (&game_state.level_data[0].height)[uVar4 * 2];
    sVar3 = (&game_state.level_data[1].height)[uVar4 * 2];
  }
  iVar15 = (int)sVar1;
  iVar12 = (int)sVar3;
  iVar8 = (int)sVar7;
  iVar5 = (int)sVar2;
  sVar7 = sVar2 >> 0xf;
  if ((*(byte *)(&game_state.level_data[0].flags + uVar4) & 1) == 0) {
    if (uVar14 < uVar11) {
      if ((iVar12 != iVar15) || (iVar12 != iVar5)) {
        return CONCAT22(sVar7,(short)((iVar15 - iVar12) * uVar14 >> 8) +
                              (short)((iVar12 - iVar5) * uVar11 >> 8) + sVar2);
      }
    }
    else if ((iVar8 != iVar5) || (iVar15 != iVar8)) {
      return CONCAT22(sVar7,(short)((iVar15 - iVar8) * uVar11 >> 8) +
                            (short)((iVar8 - iVar5) * uVar14 >> 8) + sVar2);
    }
  }
  else if (uVar11 + uVar14 < 0x100) {
    if ((iVar8 != iVar5) || (iVar12 != iVar8)) {
      return CONCAT22(sVar7,(short)((iVar12 - iVar5) * uVar11 >> 8) +
                            (short)((iVar8 - iVar5) * uVar14 >> 8) + sVar2);
    }
  }
  else {
    if ((iVar15 == iVar8) && (iVar12 == iVar15)) {
      return CONCAT22(sVar7,sVar1);
    }
    iVar5 = CONCAT22((short)(0x100 - uVar11 >> 0x10),
                     (short)((iVar12 - iVar15) * (0x100 - uVar14) >> 8) +
                     (short)((iVar8 - iVar15) * (0x100 - uVar11) >> 8) + sVar1);
  }
  return iVar5;
}
