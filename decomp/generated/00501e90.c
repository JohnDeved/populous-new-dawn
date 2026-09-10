/* Ghidra 12.1.3 pseudocode; entry 00501e90; FUN_00501e90.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_00501e90(int param_1,int param_2,int param_3)

{
  unit_struct *puVar1;
  char cVar2;
  char cVar3;
  int iVar4;
  short *psVar5;
  undefined2 local_c;
  undefined2 local_a;
  undefined4 local_8;
  undefined4 local_4;

  local_4 = 0;
  local_8 = 0;
  if (param_2 != 0) {
    *(uint *)(param_2 + 0x14) = *(uint *)(param_2 + 0x14) & 0xffffffef;
  }
  cVar2 = get_empty_indexed_xy(2,0,0,3);
  if (cVar2 != '\0') {
    local_c = CONCAT11((char)((ushort)*(undefined2 *)(param_3 + 0x3f) >> 8),
                       (char)((ushort)*(undefined2 *)(param_3 + 0x3d) >> 8)) & 0xfefe;
    cVar3 = get_indexed_xy(cVar2,&local_4,&local_8);
    while (cVar3 != '\0') {
      local_a = CONCAT11((char)local_8 * '\x02' + local_c._1_1_,
                         (char)local_4 * '\x02' + (char)local_c);
      for (puVar1 = unit_land_array
                    [(short)(&game_state.level_data[0].unit_index)
                            [((local_a & 0xfe) * 2 | local_a & 0xfe00) * 2]];
          puVar1 != (unit_struct *)0x0; puVar1 = unit_land_array[puVar1->next_unit_index]) {
        if ((((puVar1->flags_3 & 0x10) != 0) &&
            (puVar1->flags_3 = puVar1->flags_3 & 0xffffffef, param_1 != 0)) &&
           (*(byte *)(param_1 + 0x69) < 0xb)) {
          *(undefined2 *)(param_1 + 0x6a + (uint)*(byte *)(param_1 + 0x69) * 2) = puVar1->unit_index
          ;
          iVar4 = 0;
          psVar5 = (short *)(param_1 + 0x6a);
          *(char *)(param_1 + 0x68) = *(char *)(param_1 + 0x68) + '\x01';
          do {
            if (*psVar5 == 0) break;
            psVar5 = psVar5 + 1;
            iVar4 = iVar4 + 1;
          } while (iVar4 < 0xc);
          *(char *)(param_1 + 0x69) = (char)iVar4;
          puVar1->flags_2 = puVar1->flags_2 | 0x200000;
          *(byte *)&puVar1->obj_index_anim_prev_2 = (byte)puVar1->obj_index_anim_prev_2 | 0x20;
          puVar1->field36_0x5f = *(short *)(param_1 + 0x5f) / 2;
        }
      }
      cVar3 = get_indexed_xy(cVar2,&local_4,&local_8);
    }
    clear_indexed_xy(cVar2);
  }
  return;
}
