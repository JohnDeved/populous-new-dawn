/* Ghidra 12.1.3 pseudocode; entry 00401230; landscape_modification_sunlight.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void landscape_modification_sunlight(void)

{
  ushort uVar1;
  uint uVar2;
  sunlight_struct *psVar3;
  int iVar4;
  int iVar5;
  ushort local_12;
  undefined2 local_10;
  undefined2 local_e;
  int local_c;
  int local_8;
  int local_4;

  local_c = (int)(short)game_state._841988_2_;
  if (local_c != 0) {
    local_4 = 0;
    psVar3 = game_state.sunlight_array;
    do {
      if (local_c == 0) {
        return;
      }
      if (psVar3->enabled != '\0') {
        iVar4 = 0;
        local_8 = 7;
        local_12 = CONCAT11((char)((ushort)psVar3->y >> 8),(char)((ushort)psVar3->x >> 8)) & 0xfefe;
        local_10._0_1_ = (char)local_12;
        local_10._0_1_ = (char)local_10 + -6;
        local_10._1_1_ = (char)(local_12 >> 8);
        local_10 = CONCAT11(local_10._1_1_ + -6,(char)local_10);
        local_e = local_10;
        do {
          for (iVar5 = 7; iVar5 != 0; iVar5 = iVar5 + -1) {
            uVar2 = (local_e & 0xfe) * 2 | local_e & 0xfe00;
            local_e = CONCAT11(local_e._1_1_,(char)local_e + '\x02');
            uVar1 = (&game_state.level_data[0].unit_index_2)[uVar2 * 2];
            (&game_state.level_data[0].unit_index_2)[uVar2 * 2] =
                 uVar1 & 0x3ff ^ (uVar1 & 0xfc00) + (char)(&psVar3->field8_0xc)[iVar4] * -0x400;
            (&psVar3->field8_0xc)[iVar4] = 0;
            iVar4 = iVar4 + 1;
          }
          local_8 = local_8 + -1;
          local_e = CONCAT11(local_e._1_1_ + '\x02',(char)local_10);
        } while (local_8 != 0);
        local_c = local_c + -1;
      }
      psVar3 = psVar3 + 1;
      local_4 = local_4 + 1;
    } while (local_4 < 0x32);
  }
  return;
}
