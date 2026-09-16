/* Ghidra 12.1.3 pseudocode; entry 004f1fe0; FUN_004f1fe0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_004f1fe0(char param_1,char param_2,int param_3)

{
  int iVar1;
  unit_struct *puVar2;
  int iVar3;
  int iVar4;
  undefined2 local_6;

  param_2 = param_2 + (char)param_3 * -2;
  iVar1 = param_3 * 2 + 1;
  for (iVar3 = iVar1; local_6 = CONCAT11(param_2,param_1 + (char)param_3 * -2), iVar4 = iVar1,
      iVar3 != 0; iVar3 = iVar3 + -1) {
    for (; iVar4 != 0; iVar4 = iVar4 + -1) {
      for (puVar2 = unit_land_array
                    [(short)(&game_state.level_data[0].unit_index)
                            [((local_6 & 0xfe) * 2 | local_6 & 0xfe00) * 2]];
          puVar2 != (unit_struct *)0x0; puVar2 = unit_land_array[puVar2->next_unit_index]) {
        if ((puVar2->unit_class == '\x01') && (puVar2->unit_type == '\x01')) {
          FUN_00499aa0(puVar2);
        }
      }
      local_6 = CONCAT11(local_6._1_1_,(char)local_6 + '\x02');
    }
    param_2 = local_6._1_1_ + '\x02';
  }
  return;
}
