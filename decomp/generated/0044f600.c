/* Ghidra 12.1.3 pseudocode; entry 0044f600; FUN_0044f600.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


int FUN_0044f600(ushort param_1)

{
  char cVar1;
  byte bVar2;
  uint uVar3;
  int iVar4;
  int iVar5;
  byte bVar6;
  int iVar7;
  uint uVar8;
  int iVar9;
  uint uVar10;
  int iVar11;
  int iVar12;
  int iVar13;
  undefined2 local_2;

  bVar6 = (byte)param_1;
  local_2._1_1_ = (byte)(param_1 >> 8);
  bVar2 = local_2._1_1_;
  if (((bVar6 & 0xfe) == 0xfe) || ((local_2._1_1_ & 0xfe) == 0xfe)) {
    cVar1 = local_2._1_1_ + 2;
    local_2 = CONCAT11(cVar1,bVar6);
    uVar8 = (uint)local_2;
    uVar3 = (uint)local_2;
    local_2 = CONCAT11(cVar1,bVar6 + 2);
    iVar4 = (int)(short)(&game_state.level_data[0].height)
                        [((param_1 & 0xfe) * 2 | param_1 & 0xfe00) * 2];
    uVar10 = (uint)local_2;
    iVar7 = (int)(short)(&game_state.level_data[0].height)
                        [((uVar3 & 0xfe) * 2 | uVar8 & 0xfe00) * 2];
    uVar3 = (uint)local_2;
    local_2 = CONCAT11(bVar2,bVar6 + 2);
    iVar11 = (int)(short)(&game_state.level_data[0].height)
                         [((uVar3 & 0xfe) * 2 | uVar10 & 0xfe00) * 2];
    iVar13 = (int)(short)(&game_state.level_data[0].height)
                         [((local_2 & 0xfe) * 2 | local_2 & 0xfe00) * 2];
  }
  else {
    uVar3 = (param_1 & 0xfe) * 2 | param_1 & 0xfe00;
    iVar7 = (int)(short)(&game_state.level_data[0x80].height)[uVar3 * 2];
    iVar4 = (int)(short)(&game_state.level_data[0].height)[uVar3 * 2];
    iVar11 = (int)(short)(&game_state.level_data[0x81].height)[uVar3 * 2];
    iVar13 = (int)(short)(&game_state.level_data[1].height)[uVar3 * 2];
  }
  do {
    if (iVar4 < iVar7) {
LAB_0044f71d:
      iVar5 = iVar7;
      iVar9 = iVar4;
    }
    else {
      if ((iVar11 <= iVar7) && (iVar13 <= iVar11)) {
        return iVar4 - iVar13;
      }
      iVar5 = iVar4;
      iVar9 = iVar7;
      if (iVar4 < iVar7) goto LAB_0044f71d;
    }
    iVar7 = iVar9;
    iVar12 = iVar11;
    if (iVar9 < iVar11) {
      iVar7 = iVar11;
      iVar12 = iVar9;
    }
    iVar4 = iVar5;
    iVar11 = iVar12;
    if (iVar12 < iVar13) {
      iVar11 = iVar13;
      iVar13 = iVar12;
    }
  } while( true );
}
