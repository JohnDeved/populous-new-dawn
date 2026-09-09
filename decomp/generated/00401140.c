/* Ghidra 12.1.3 pseudocode; entry 00401140; landscape_modification_sunlight_item.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void landscape_modification_sunlight_item(undefined1 *param_1)

{
  ushort uVar1;
  uint uVar2;
  int iVar3;
  uint uVar4;
  int iVar5;
  undefined2 local_8;
  undefined2 local_6;
  int local_4;

  iVar3 = 0;
  *param_1 = 0;
  game_state._841988_2_ = game_state._841988_2_ + -1;
  local_4._0_2_ =
       CONCAT11((char)((ushort)*(undefined2 *)(param_1 + 6) >> 8),
                (char)((ushort)*(undefined2 *)(param_1 + 4) >> 8)) & 0xfefe;
  uVar1 = (ushort)local_4;
  local_4 = 7;
  local_8._0_1_ = (char)uVar1;
  local_8._0_1_ = (char)local_8 + -6;
  local_8._1_1_ = (char)(uVar1 >> 8);
  local_8 = CONCAT11(local_8._1_1_ + -6,(char)local_8);
  local_6 = local_8;
  do {
    for (iVar5 = 7; iVar5 != 0; iVar5 = iVar5 + -1) {
      uVar2 = (uint)local_6;
      uVar4 = (uint)local_6;
      local_6 = CONCAT11(local_6._1_1_,(char)local_6 + '\x02');
      uVar2 = (uVar2 & 0xfe) * 2 | uVar4 & 0xfe00;
      uVar1 = (&game_state.level_data[0].unit_index_2)[uVar2 * 2];
      (&game_state.level_data[0].unit_index_2)[uVar2 * 2] =
           uVar1 & 0x3ff ^ (uVar1 & 0xfc00) + (char)param_1[iVar3 + 0xc] * -0x400;
      param_1[iVar3 + 0xc] = 0;
      iVar3 = iVar3 + 1;
    }
    local_4 = local_4 + -1;
    local_6 = CONCAT11(local_6._1_1_ + '\x02',(char)local_8);
  } while (local_4 != 0);
  return;
}
