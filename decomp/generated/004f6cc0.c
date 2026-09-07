/* Ghidra 12.1.3 pseudocode; entry 004f6cc0; set_land_pos_ph_2.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void set_land_pos_ph_2(int param_1,int param_2,int param_3)

{
  byte *pbVar1;
  char cVar2;
  char cVar3;
  int iVar4;
  uint uVar5;
  int iVar6;
  undefined2 local_8;
  undefined2 local_6;
  undefined *local_4;

  cVar3 = *(char *)(param_1 + 0x2f);
  if (param_2 == 5) {
    local_4 = &DAT_005d56b4;
  }
  else if (param_2 == 7) {
    local_4 = &DAT_005d56bc;
  }
  else if (param_2 == 9) {
    local_4 = &DAT_005d56c8;
  }
  else {
    local_4 = &DAT_005d56d8;
    param_2 = 0xb;
  }
  local_8 = CONCAT11((char)((ushort)*(undefined2 *)(param_1 + 0x3f) >> 8),
                     (char)((ushort)*(undefined2 *)(param_1 + 0x3d) >> 8)) & 0xfefe;
  cVar2 = local_8._1_1_ + ('\x01' - (char)param_2) * '\x02';
  local_8._1_1_ = cVar2;
  if (param_3 == 0) {
    iVar6 = 0;
    if (0 < param_2) {
      do {
        local_6 = CONCAT11(local_8._1_1_,(char)local_8 + local_4[iVar6] * -2);
        for (iVar4 = (uint)(byte)local_4[iVar6] * 2 + 1; iVar4 != 0; iVar4 = iVar4 + -1) {
          uVar5 = (local_6 & 0xfe) * 2 | local_6 & 0xfe00;
          if ((*(byte *)(landscape_height_array + ((&game_state.level_data[0].c_3)[uVar5 * 4] & 0xf)
                        ) & 1) != 0) {
            pbVar1 = &game_state.level_data[0].ph_2 + uVar5 * 4;
            *pbVar1 = *pbVar1 | '\x01' << (cVar3 + 4U & 0x1f);
          }
          local_6 = CONCAT11(local_6._1_1_,(char)local_6 + '\x02');
        }
        local_8._1_1_ = local_8._1_1_ + '\x02';
        iVar6 = iVar6 + 1;
      } while (iVar6 < param_2);
    }
    while (param_2 = param_2 + -1, param_2 != 0) {
      local_6 = CONCAT11(local_8._1_1_,(char)local_8 + local_4[param_2] * -2);
      for (iVar6 = (uint)(byte)local_4[param_2] * 2 + 1; iVar6 != 0; iVar6 = iVar6 + -1) {
        uVar5 = (local_6 & 0xfe) * 2 | local_6 & 0xfe00;
        if ((*(byte *)(landscape_height_array + ((&game_state.level_data[0].c_3)[uVar5 * 4] & 0xf))
            & 1) != 0) {
          pbVar1 = &game_state.level_data[0].ph_2 + uVar5 * 4;
          *pbVar1 = *pbVar1 | '\x01' << (cVar3 + 4U & 0x1f);
        }
        local_6 = CONCAT11(local_6._1_1_,(char)local_6 + '\x02');
      }
      local_8._1_1_ = local_8._1_1_ + '\x02';
    }
  }
  else {
    iVar6 = 0;
    if (0 < param_2) {
      do {
        local_6 = CONCAT11(local_8._1_1_,(char)local_8 + local_4[iVar6] * -2);
        for (iVar4 = (uint)(byte)local_4[iVar6] * 2 + 1; iVar4 != 0; iVar4 = iVar4 + -1) {
          uVar5 = (local_6 & 0xfe) * 2 | local_6 & 0xfe00;
          if ((*(byte *)(landscape_height_array + ((&game_state.level_data[0].c_3)[uVar5 * 4] & 0xf)
                        ) & 1) != 0) {
            pbVar1 = &game_state.level_data[0].ph_2 + uVar5 * 4;
            *pbVar1 = *pbVar1 & ~('\x01' << (cVar3 + 4U & 0x1f));
          }
          local_6 = CONCAT11(local_6._1_1_,(char)local_6 + '\x02');
        }
        local_8._1_1_ = local_8._1_1_ + '\x02';
        iVar6 = iVar6 + 1;
      } while (iVar6 < param_2);
    }
    param_2 = param_2 + -1;
    if (param_2 != 0) {
      do {
        local_6 = CONCAT11(local_8._1_1_,(char)local_8 + local_4[param_2] * -2);
        for (iVar6 = (uint)(byte)local_4[param_2] * 2 + 1; iVar6 != 0; iVar6 = iVar6 + -1) {
          uVar5 = (local_6 & 0xfe) * 2 | local_6 & 0xfe00;
          if ((*(byte *)(landscape_height_array + ((&game_state.level_data[0].c_3)[uVar5 * 4] & 0xf)
                        ) & 1) != 0) {
            pbVar1 = &game_state.level_data[0].ph_2 + uVar5 * 4;
            *pbVar1 = *pbVar1 & ~('\x01' << (cVar3 + 4U & 0x1f));
          }
          local_6 = CONCAT11(local_6._1_1_,(char)local_6 + '\x02');
        }
        local_8._1_1_ = local_8._1_1_ + '\x02';
        param_2 = param_2 + -1;
      } while (param_2 != 0);
      return;
    }
  }
  return;
}
