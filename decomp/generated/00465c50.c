/* Ghidra 12.1.3 pseudocode; entry 00465c50; FUN_00465c50.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


undefined1 FUN_00465c50(int param_1)

{
  char cVar1;
  unit_struct *puVar2;
  ushort uVar3;
  char cVar4;
  char cVar5;
  byte bVar6;
  int iVar7;
  uint uVar8;
  int iVar9;
  byte *pbVar10;
  byte local_13;
  undefined1 local_11;
  undefined2 local_10;
  byte local_e;
  byte bStack_d;
  undefined4 local_8;
  undefined4 local_4;

  local_11 = 0;
  cVar1 = *(char *)(param_1 + 0x9e);
  if (cVar1 < (char)unit_type_array_vehicle[*(byte *)(param_1 + 0x2b)].field_0x8) {
    if (cVar1 != '\0') {
      local_13 = unit_land_array[*(ushort *)(param_1 + 0x7a)]->tribe_index;
    }
    cVar4 = get_empty_indexed_xy(2,0,0,6);
    if (cVar4 != '\0') {
      local_10 = CONCAT11((char)((ushort)*(undefined2 *)(param_1 + 0x3f) >> 8),
                          (char)((ushort)*(undefined2 *)(param_1 + 0x3d) >> 8)) & 0xfefe;
      uVar3 = local_10;
      cVar5 = get_indexed_xy(cVar4,&local_4,&local_8);
      while (cVar5 != '\0') {
        local_e = (byte)uVar3;
        bStack_d = (byte)(uVar3 >> 8);
        local_10 = CONCAT11((char)local_8 * '\x02' + bStack_d,(char)local_4 * '\x02' + local_e);
        uVar8 = (local_10 & 0xfe) * 2 | local_10 & 0xfe00;
        if ((*(byte *)(landscape_height_array + ((&game_state.level_data[0].c_3)[uVar8 * 4] & 0xf))
            & 2) == 0) {
          for (puVar2 = unit_land_array[(short)(&game_state.level_data[0].unit_index)[uVar8 * 2]];
              puVar2 != (unit_struct *)0x0; puVar2 = unit_land_array[puVar2->next_unit_index]) {
            if (cVar1 != '\0') {
              if (((local_13 == 0xff) || (bVar6 = puVar2->tribe_index, bVar6 == 0xff)) ||
                 (bVar6 == local_13)) {
                bVar6 = 1;
              }
              else {
                bVar6 = *(byte *)((int)game_state.start_n1 + (char)local_13 + 0x9c) &
                        '\x01' << (bVar6 & 0x1f);
              }
              if (bVar6 != 0) goto LAB_00465dbc;
            }
            else {
LAB_00465dbc:
              if (puVar2->index_to_array != 0) {
                iVar7 = (int)puVar2->index_to_array;
                if ((unit_type_array_vehicle[*(byte *)(param_1 + 0x2b)].field_0x15 & 1) == 0) {
                  if ((game_state.unit_related_array_1[iVar7].flag & 1) != 0) {
                    iVar9 = (int)(char)puVar2->field_0x67;
                    pbVar10 = (byte *)(iVar7 * 0x6d + 0x955c35 + iVar9 * 4);
                    for (; iVar9 < (int)(uint)(byte)game_state.unit_related_array_1[iVar7].
                                                    sub_array_counter; iVar9 = iVar9 + 1) {
                      if (((*pbVar10 & 0xfe) == local_e) && ((pbVar10[1] & 0xfe) == bStack_d))
                      goto LAB_00465e77;
                      pbVar10 = pbVar10 + 4;
                    }
                  }
                }
                else if ((game_state.unit_related_array_1[iVar7].flag & 2) != 0) {
LAB_00465e77:
                  local_11 = 1;
                  goto LAB_00465e7c;
                }
              }
            }
          }
        }
        cVar5 = get_indexed_xy(cVar4,&local_4,&local_8);
      }
LAB_00465e7c:
      clear_indexed_xy(cVar4);
    }
  }
  return local_11;
}
