/* Ghidra 12.1.3 pseudocode; entry 0040a0c0; FUN_0040a0c0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_0040a0c0(int param_1,char param_2)

{
  char cVar1;
  byte bVar2;
  ushort uVar3;
  unit_struct *puVar4;
  ushort uVar5;
  short sVar6;
  char *pcVar7;
  undefined1 uVar8;
  int iVar9;
  unit_struct *puVar10;
  byte *pbVar11;
  ushort *puVar12;
  int iVar13;
  int local_c;
  ushort local_4;
  ushort local_2;

  uVar3 = *(ushort *)(param_1 + 0x24);
  if (param_2 == '\0') {
    *(ushort *)(param_1 + 0x9c) = *(ushort *)(param_1 + 0x9c) & 0x7fff;
    iVar13 = (int)(short)game_state._841986_2_;
    pcVar7 = &game_state.field_0x9b6b8;
    while (iVar13 != 0) {
      if (((*(short *)(pcVar7 + 2) != 0) && (iVar13 = iVar13 + -1, *pcVar7 == '\n')) &&
         (*(ushort *)(pcVar7 + 6) == uVar3)) {
        pcVar7[1] = pcVar7[1] | 1;
      }
      pcVar7 = pcVar7 + 10;
    }
  }
  else {
    *(byte *)(param_1 + 0x9d) = *(byte *)(param_1 + 0x9d) | 0x80;
    cVar1 = (&objs0_mem[*(short *)(param_1 + 0x33)].shapes_index)
            [(short)((int)((int)*(short *)(param_1 + 0x26) +
                          ((int)*(short *)(param_1 + 0x26) >> 0x1f & 0x1ffU)) >> 9)];
    pbVar11 = &game_state.field_0x9b6b8;
    iVar13 = (int)(short)game_state._841986_2_;
    local_c._0_2_ =
         CONCAT11((char)((ushort)(((short)(char)shapes_mem[cVar1].field_0x5 +
                                  (ushort)(byte)shapes_mem[cVar1].y2 * -4) * 0x40 +
                                 *(short *)(param_1 + 0x7c)) >> 8),
                  (char)((ushort)(((short)(char)shapes_mem[cVar1].field_0x4 +
                                  (ushort)(byte)shapes_mem[cVar1].x2 * -4) * 0x40 +
                                 *(short *)(param_1 + 0x7a)) >> 8)) & 0xfefe;
    while (iVar13 != 0) {
      if (*(short *)(pbVar11 + 2) != 0) {
        iVar13 = iVar13 + -1;
        if ((*(uint *)(&DAT_005a7dca + (uint)*pbVar11 * 0x16) & 0x80000) != 0) {
          if ((*(uint *)(&DAT_005a7dca + (uint)*pbVar11 * 0x16) & 4) == 0) {
            uVar5 = *(ushort *)(pbVar11 + 6);
          }
          else {
            uVar5 = (&game_state.level_data[0].unit_index_2)
                    [((*(ushort *)(pbVar11 + 8) & 0xfe) * 2 | *(ushort *)(pbVar11 + 8) & 0xfe00) * 2
                    ] & 0x3ff;
          }
          if (uVar3 == uVar5) {
            *pbVar11 = 10;
            *(ushort *)(pbVar11 + 6) = uVar3;
            *(ushort *)(pbVar11 + 8) = (ushort)local_c;
            puVar10 = game_state.tribes_array[*(char *)(param_1 + 0x2f)].person_units;
            iVar9 = (int)*(short *)(pbVar11 + 2);
            while ((puVar10 != (unit_struct *)0x0 && (iVar9 != 0))) {
              if (puVar10->state == '\n') {
                uVar5 = *(ushort *)&puVar10->field_0x9b;
                if (uVar5 == 0) {
                  uVar5 = *(ushort *)
                           ((int)&puVar10->loc_3_z + (uint)(byte)puVar10->hut_people_inside * 2 + 1)
                  ;
                }
                if ((uint)uVar5 == (int)(pbVar11 + -0x938830) / 10) {
                  puVar10->flags_2 = puVar10->flags_2 | 0x10;
                  iVar9 = iVar9 + -1;
                }
              }
              puVar10 = puVar10->next_unit;
            }
          }
        }
      }
      pbVar11 = pbVar11 + 10;
    }
    if ((*(char *)(param_1 + 0xa6) != '\0') && (sVar6 = FUN_00436c20(), sVar6 != 0)) {
      local_2 = (ushort)local_c;
      local_4 = uVar3;
      FUN_00438730(sVar6,10,&local_4,0x20);
      puVar12 = (ushort *)(param_1 + 0x86);
      local_c = 7;
      do {
        puVar10 = (unit_struct *)0x0;
        if (((*puVar12 != 0) &&
            (puVar4 = unit_land_array[*puVar12], (*(byte *)&puVar4->flags_2 & 1) == 0)) &&
           (puVar4->unit_class != '\0')) {
          puVar10 = puVar4;
        }
        if (puVar10 != (unit_struct *)0x0) {
          remove_person_from_hut(param_1,puVar10);
          FUN_00436ca0(puVar10);
          FUN_00436d00(puVar10,sVar6,0);
          FUN_004e9b40(puVar10);
          if ((*(byte *)((int)&puVar10->flags_2 + 2) & 0x10) == 0) {
            *(undefined1 *)((int)&puVar10->loc_1_y + 1) = puVar10->state;
            if ((game_state.level_flags & 2) == 0) {
              bVar2 = puVar10->unit_type;
LAB_0040a362:
              uVar8 = unit_type_array_person[bVar2].next_state;
            }
            else {
              bVar2 = puVar10->unit_type;
              if (bVar2 != 7) goto LAB_0040a362;
              uVar8 = 0x27;
            }
            empty_unit_function(puVar10);
            puVar10->state = uVar8;
            init_unit_class(puVar10);
          }
        }
        puVar12 = puVar12 + 1;
        local_c = local_c + -1;
        if (local_c == 0) {
          return;
        }
      } while( true );
    }
  }
  return;
}
