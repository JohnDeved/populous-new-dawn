/* Ghidra 12.1.3 pseudocode; entry 004ebd10; FUN_004ebd10.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_004ebd10(ushort *param_1,short *param_2)

{
  ushort uVar1;
  ushort uVar2;
  short sVar3;
  uint uVar4;
  uint uVar5;
  byte bVar7;
  short sVar6;
  short sVar8;
  byte bVar10;
  uint uVar9;
  short sVar11;
  undefined2 local_6;

  uVar1 = (*param_1 & 0x1fe) >> 1;
  bVar7 = (byte)(*param_1 >> 8);
  bVar10 = (byte)(param_1[1] >> 8);
  local_6 = CONCAT11(bVar10,bVar7);
  uVar2 = (param_1[1] & 0x1fe) >> 1;
  uVar4 = (local_6 & 0xfe) * 2 | local_6 & 0xfe00;
  if (((bVar7 & 0xfe) == 0xfe) || ((bVar10 & 0xfe) == 0xfe)) {
    local_6 = CONCAT11(bVar10 + 2,bVar7);
    sVar6 = (&game_state.level_data[0].height)[uVar4 * 2];
    uVar5 = (uint)local_6;
    uVar9 = (uint)local_6;
    local_6 = CONCAT11(bVar10 + 2,bVar7 + 2);
    sVar11 = (&game_state.level_data[0].height)[((uVar5 & 0xfe) * 2 | uVar9 & 0xfe00) * 2];
    uVar9 = (uint)local_6;
    uVar5 = (uint)local_6;
    local_6 = CONCAT11(bVar10,bVar7 + 2);
    sVar8 = (&game_state.level_data[0].height)[((uVar5 & 0xfe) * 2 | uVar9 & 0xfe00) * 2];
    sVar3 = (&game_state.level_data[0].height)[((local_6 & 0xfe) * 2 | local_6 & 0xfe00) * 2];
  }
  else {
    sVar11 = (&game_state.level_data[0x80].height)[uVar4 * 2];
    sVar8 = (&game_state.level_data[0x81].height)[uVar4 * 2];
    sVar6 = (&game_state.level_data[0].height)[uVar4 * 2];
    sVar3 = (&game_state.level_data[1].height)[uVar4 * 2];
  }
  if ((*(byte *)(&game_state.level_data[0].flags + uVar4) & 1) == 0) {
    if (uVar1 <= uVar2) {
      *param_2 = sVar11 - sVar8;
      param_2[2] = sVar6 - sVar11;
      goto LAB_004ebe89;
    }
    *param_2 = sVar6 - sVar3;
  }
  else {
    if ((ushort)(uVar2 + uVar1) < 0x100) {
      *param_2 = sVar6 - sVar3;
      param_2[2] = sVar6 - sVar11;
      goto LAB_004ebe89;
    }
    *param_2 = sVar11 - sVar8;
  }
  param_2[2] = sVar3 - sVar8;
LAB_004ebe89:
  param_2[1] = 0;
  *param_2 = (short)(*param_2 * 3 >> 3);
  param_2[2] = (short)(param_2[2] * 3 >> 3);
  return;
}
