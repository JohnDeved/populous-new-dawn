/* Ghidra 12.1.3 pseudocode; entry 004bee20; set_texture_globe.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void set_texture_globe(ushort param_1,undefined1 *param_2)

{
  byte bVar1;
  byte bVar2;
  byte bVar3;
  byte bVar4;
  byte bVar5;
  ushort uVar6;
  uint uVar7;
  uint uVar8;
  uint uVar9;
  int iVar10;
  int iVar11;
  uint uVar12;
  int iVar13;
  uint uVar14;
  char *pcVar15;
  char *pcVar16;
  undefined1 *puVar17;
  int iVar18;
  int iVar19;
  int iVar20;
  undefined4 local_60;
  int local_5c;
  int local_58;
  int local_54;
  int local_50;
  int local_4c;
  int local_48;
  int local_44;
  int local_40;
  int local_30;
  int local_20;
  int local_1c;
  uint local_18;
  int local_14;

  uVar7 = (param_1 & 0xfe) * 2 | param_1 & 0xfe00;
  uVar12 = (uint)(byte)(&game_state.level_data[0].brightness)[uVar7 * 4];
  iVar13 = (int)(short)(&game_state.level_data[0].height)[uVar7 * 2];
  local_5c = iVar13 + 0x4b;
  bVar1 = (&game_state.level_data[0].cliff_index)[uVar7 * 4];
  if ((bVar1 != 0) && (local_5c = iVar13 + 0x96, 0x3fe < local_5c)) {
    local_5c = 0x3fe;
  }
  uVar7 = (uint)bVar1;
  bVar5 = (byte)(param_1 >> 8);
  uVar6 = CONCAT11(bVar5,(byte)param_1 + 2);
  local_60 = (uint)uVar6;
  uVar8 = (local_60 & 0xfe) * 2 | uVar6 & 0xfe00;
  iVar13 = (int)(short)(&game_state.level_data[0].height)[uVar8 * 2];
  local_54 = iVar13 + 0x4b;
  bVar1 = (&game_state.level_data[0].cliff_index)[uVar8 * 4];
  if ((bVar1 != 0) && (local_54 = iVar13 + 0x96, 0x3fe < local_54)) {
    local_54 = 0x3fe;
  }
  local_60._0_2_ = CONCAT11(bVar5 + 2,(byte)param_1 + 2);
  uVar6 = (ushort)local_60;
  local_60 = (uint)(ushort)local_60;
  uVar9 = (uVar6 & 0xfe) * 2 | local_60 & 0xfe00;
  bVar2 = (&game_state.level_data[0].brightness)[uVar9 * 4];
  iVar13 = (int)(short)(&game_state.level_data[0].height)[uVar9 * 2];
  local_50 = iVar13 + 0x4b;
  bVar3 = (&game_state.level_data[0].cliff_index)[uVar9 * 4];
  if ((bVar3 != 0) && (local_50 = iVar13 + 0x96, 0x3fe < local_50)) {
    local_50 = 0x3fe;
  }
  uVar6 = CONCAT11(bVar5 + 2,(byte)param_1);
  local_60 = (uint)uVar6;
  uVar9 = (uVar6 & 0xfe) * 2 | local_60 & 0xfe00;
  uVar14 = (uint)(byte)(&game_state.level_data[0].brightness)[uVar9 * 4];
  iVar13 = (int)(short)(&game_state.level_data[0].height)[uVar9 * 2];
  local_58 = iVar13 + 0x4b;
  bVar4 = (&game_state.level_data[0].cliff_index)[uVar9 * 4];
  if ((bVar4 != 0) && (local_58 = iVar13 + 0x96, 0x3fe < local_58)) {
    local_58 = 0x3fe;
  }
  iVar13 = (byte)(&game_state.level_data[0].brightness)[uVar8 * 4] - uVar12;
  local_4c = iVar13 * 0x2000;
  local_1c = uVar12 << 0x10;
  local_48 = (local_54 - local_5c) * 0x2000;
  local_18 = local_5c << 0x10;
  iVar10 = bVar1 - uVar7;
  local_44 = iVar10 * 0x2000;
  local_14 = uVar7 << 0x10;
  local_30 = 8;
  pcVar15 = (char *)(((uint)((bVar5 & 0xe) >> 1) * 0x100 + (uint)(((byte)param_1 & 0xe) >> 1)) *
                     0x20 + disp0_mem);
  do {
    local_40 = 8;
    local_20 = local_14;
    iVar11 = local_1c;
    uVar8 = local_18;
    do {
      puVar17 = param_2;
      pcVar16 = pcVar15;
      iVar19 = (int)uVar8 >> 0x10;
      uVar9 = uVar8 & 0xffff00ff;
      uVar8 = uVar8 + local_48;
      iVar18 = ((int)*pcVar16 >> 2) + (iVar11 >> 0x10);
      if ((char)((uint)iVar18 >> 8) != '\0') {
        if (iVar18 < 0) {
          iVar18 = 0;
        }
        else if (0xff < iVar18) {
          iVar18 = 0xff;
        }
      }
      iVar11 = iVar11 + local_4c;
      iVar20 = local_20 >> 0x12;
      local_20 = local_20 + local_44;
      *puVar17 = *(undefined1 *)
                  ((uint)*(byte *)(((int)((int)*(short *)(static_landscape_array + iVar19 * 2) *
                                          (int)*pcVar16 & 0xfffffc03U) >> 2) + ((int)uVar9 >> 8) +
                                   iVar18 + bigf0_mem) + iVar20 * 0x80 + cliff0_mem);
      local_40 = local_40 + -1;
      pcVar15 = pcVar16 + 4;
      param_2 = puVar17 + 1;
    } while (local_40 != 0);
    local_1c = local_1c + (uVar14 - uVar12) * 0x2000;
    local_18 = local_18 + (local_58 - local_5c) * 0x2000;
    param_2 = puVar17 + 0xf9;
    pcVar15 = pcVar16 + 0x3e4;
    local_14 = local_14 + (bVar4 - uVar7) * 0x2000;
    local_4c = local_4c + ((int)((bVar2 - uVar14) * 0x2000 + iVar13 * -0x2000) >> 3);
    local_48 = local_48 + ((local_50 - local_58) * 0x2000 + (local_54 - local_5c) * -0x2000 >> 3);
    local_44 = local_44 + ((int)(((uint)bVar3 - (uint)bVar4) * 0x2000 + iVar10 * -0x2000) >> 3);
    local_30 = local_30 + -1;
  } while (local_30 != 0);
  return;
}
