/* Ghidra 12.1.3 pseudocode; entry 00519d10; FUN_00519d10.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_00519d10(int param_1,char param_2)

{
  undefined2 *puVar1;
  bool bVar2;
  char cVar3;
  char cVar4;
  uint uVar5;
  undefined2 local_1a;
  undefined2 local_14;
  short sStack_12;
  undefined2 uStack_10;
  undefined2 local_c;
  short local_a;
  undefined1 local_8 [4];
  undefined1 local_4 [4];

  bVar2 = false;
  puVar1 = (undefined2 *)(param_1 + 0x3d);
  local_14._0_1_ = (undefined1)((ushort)*puVar1 >> 8);
  local_14._1_1_ = (undefined1)((ushort)*(undefined2 *)(param_1 + 0x3f) >> 8);
  uVar5 = (CONCAT11(local_14._1_1_,(undefined1)local_14) & 0xfe) * 2 |
          CONCAT11(local_14._1_1_,(undefined1)local_14) & 0xfe00;
  if ((*(byte *)((int)&game_state.level_data[0].flags + uVar5 * 4 + 1) & 2) != 0) {
    FUN_004044b0(unit_land_array
                 [(ushort)(&game_state.level_data[0].unit_index_2)[uVar5 * 2] & 0x3ff],&local_c);
    local_14._0_1_ = (undefined1)local_c;
    local_14._1_1_ = (undefined1)((ushort)local_c >> 8);
    sStack_12 = local_a;
    uStack_10 = 0;
    uStack_10 = calc_point_height(CONCAT22(local_a,local_c),local_a);
    add_unit_to_cell(param_1,&local_14);
  }
  if ((param_2 != '\0') || ((*(byte *)(param_1 + 0x2e) & 0x1f) == 0)) {
    cVar3 = FUN_0051e4b0(param_1,puVar1,1);
    if (cVar3 == '\0') {
      cVar3 = get_empty_indexed_xy(2,*(undefined2 *)(param_1 + 0x26),0,8);
      if (cVar3 != '\0') {
        local_1a = CONCAT11((char)((ushort)*(undefined2 *)(param_1 + 0x3f) >> 8),
                            (char)((ushort)*puVar1 >> 8)) & 0xfefe;
        do {
          cVar4 = get_indexed_xy(cVar3,local_8,local_4);
          if (cVar4 == '\0') goto LAB_00519ec5;
          local_14 = ((byte)(local_8[0] * '\x02' + (char)local_1a) + 1) * 0x100;
          sStack_12 = ((byte)(local_4[0] * '\x02' + local_1a._1_1_) + 1) * 0x100;
          uStack_10 = calc_point_height(CONCAT22(sStack_12,local_14),CONCAT22(uStack_10,sStack_12));
          cVar4 = FUN_0051e4b0(param_1,&local_14,1);
        } while (cVar4 == '\0');
        bVar2 = true;
LAB_00519ec5:
        clear_indexed_xy(cVar3);
      }
      if (bVar2) {
        uStack_10 = calc_point_height(CONCAT22(sStack_12,local_14),CONCAT22(uStack_10,sStack_12));
        add_unit_to_cell(param_1,&local_14);
      }
    }
  }
  return;
}
