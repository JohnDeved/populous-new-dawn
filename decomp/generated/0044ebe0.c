/* Ghidra 12.1.3 pseudocode; entry 0044ebe0; FUN_0044ebe0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


undefined1 FUN_0044ebe0(undefined2 param_1,short param_2)

{
  int iVar1;
  undefined1 uVar2;
  int iVar3;
  int iVar4;
  undefined2 local_4;
  undefined2 local_2;

  uVar2 = 0;
  iVar1 = param_2 * 2 + 1;
  local_4._0_1_ = (char)param_1;
  local_4._0_1_ = (char)local_4 + (char)param_2 * -2;
  local_4._1_1_ = (char)((ushort)param_1 >> 8);
  local_4 = CONCAT11(local_4._1_1_ + (char)param_2 * -2,(char)local_4);
  local_2 = local_4;
  iVar3 = iVar1;
  iVar4 = iVar1;
  if (iVar1 != 0) {
    while( true ) {
      while (iVar3 == 0) {
        iVar4 = iVar4 + -1;
        local_2 = CONCAT11(local_2._1_1_ + '\x02',(char)local_4);
        iVar3 = iVar1;
        if (iVar4 == 0) {
          return uVar2;
        }
      }
      if ((*(byte *)(landscape_height_array +
                    ((&game_state.level_data[0].c_3)[((local_2 & 0xfe) * 2 | local_2 & 0xfe00) * 4]
                    & 0xf)) & 1) == 0) break;
      local_2 = CONCAT11(local_2._1_1_,(char)local_2 + '\x02');
      iVar3 = iVar3 + -1;
    }
    uVar2 = 1;
  }
  return uVar2;
}
