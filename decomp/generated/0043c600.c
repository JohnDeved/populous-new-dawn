/* Ghidra 12.1.3 pseudocode; entry 0043c600; FUN_0043c600.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


unit_struct * FUN_0043c600(int param_1,int *param_2,char param_3)

{
  unit_struct *puVar1;
  bool bVar2;
  short sVar3;
  short sVar4;
  undefined2 local_1e;
  ushort uStack_1a;
  short local_18;
  short local_16;
  int local_14;
  undefined4 *local_10;
  short sStack_a;

  uStack_1a = (ushort)((uint)*(undefined4 *)(param_1 + 0x3d) >> 0x10);
  local_14 = *param_2;
  if (local_14 < 0x32) {
    local_10 = (undefined4 *)(&DAT_00974048 + local_14 * 4);
    do {
      sVar3 = (short)*local_10;
      sStack_a = (short)((uint)*local_10 >> 0x10);
      switch((short)((int)((int)*(short *)(param_1 + 0x26) +
                          ((int)*(short *)(param_1 + 0x26) >> 0x1f & 0x1ffU)) >> 9)) {
      case 0:
        local_16 = sStack_a;
        local_18 = sVar3;
        break;
      case 1:
        local_16 = -sVar3;
        local_18 = sStack_a;
        break;
      case 2:
        local_16 = -sStack_a;
        local_18 = -sVar3;
        break;
      case 3:
        local_18 = -sStack_a;
        local_16 = sVar3;
      }
      bVar2 = false;
      sVar4 = ((ushort)*(undefined4 *)(param_1 + 0x3d) & 0xfe00) + 0x100 + local_18;
      sVar3 = (uStack_1a & 0xfe00) + 0x100 + local_16;
      local_1e = CONCAT11((char)((ushort)sVar3 >> 8),(char)((ushort)sVar4 >> 8));
      for (puVar1 = unit_land_array
                    [(short)(&game_state.level_data[0].unit_index)
                            [((local_1e & 0xfe) * 2 | local_1e & 0xfe00) * 2]];
          puVar1 != (unit_struct *)0x0; puVar1 = unit_land_array[puVar1->next_unit_index]) {
        if ((((puVar1->unit_class == '\x01') && (puVar1->tribe_index == param_3)) &&
            (puVar1->field36_0x5f == 0)) &&
           (((puVar1->pos).x == sVar4 && ((puVar1->pos).y == sVar3)))) {
          bVar2 = true;
          break;
        }
      }
      if (bVar2) {
        *param_2 = local_14;
        return puVar1;
      }
      local_10 = local_10 + 1;
      local_14 = local_14 + 1;
    } while (local_10 < null_ARRAY_00974110);
  }
  return (unit_struct *)0x0;
}
