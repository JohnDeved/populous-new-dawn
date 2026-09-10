/* Ghidra 12.1.3 pseudocode; entry 0051eab0; FUN_0051eab0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


undefined4
FUN_0051eab0(int param_1,undefined2 param_2,int param_3,int param_4,char param_5,char param_6)

{
  byte bVar1;
  char cVar2;
  bool bVar3;
  ushort uVar4;
  unit_struct *puVar5;
  char cVar6;
  unit_struct *puVar7;
  uint uVar8;
  int iVar9;
  unit_struct *puVar10;
  unit_struct *puVar11;
  byte bVar12;
  uint uVar13;
  byte bVar14;
  char local_11;
  char local_10;
  char cStack_f;
  undefined2 local_e;

  local_11 = '\0';
  cStack_f = (char)((ushort)param_2 >> 8);
  cStack_f = cStack_f - (char)param_4;
  local_10 = (char)param_2;
  bVar1 = *(byte *)(param_1 + 0x2f);
  local_10 = local_10 - (char)param_3;
  puVar7 = (unit_struct *)(param_3 + 1);
  param_4 = param_4 + 1;
  puVar11 = puVar7;
  do {
    uVar4 = CONCAT11(cStack_f,local_10);
    if ((param_4 == 0) || (puVar5 = puVar7, puVar10 = puVar7, local_11 != '\0')) {
      return CONCAT31((int3)((uint)puVar11 >> 8),local_11);
    }
    while ((local_e._1_1_ = (char)(uVar4 >> 8), puVar5 != (unit_struct *)0x0 && (local_11 == '\0')))
    {
      uVar8 = (uVar4 & 0xfe) * 2 | uVar4 & 0xfe00;
      puVar10 = (unit_struct *)
                (*(byte *)(landscape_height_array +
                          ((&game_state.level_data[0].c_3)[uVar8 * 4] & 0xf)) & 0xffffff02);
      cVar6 = (char)puVar10;
      puVar11 = unit_land_array[(short)(&game_state.level_data[0].unit_index)[uVar8 * 2]];
      while (puVar11 != (unit_struct *)0x0) {
        if (local_11 != '\0') goto LAB_0051edcd;
        if (puVar11->unit_class == '\x01') {
          if ((cVar6 == '\0') && ((puVar11->flags_2 & 0x800000) == 0)) {
            bVar3 = false;
            if ((*(short *)&puVar11->field_0x9d != 0) &&
               (unit_land_array[*(short *)&puVar11->field_0x9d]->unit_type != '\t')) {
              bVar3 = true;
            }
            if ((((!bVar3) && (puVar11->unit_land_array_index == 0)) && (puVar11->state != 0x17)) &&
               ((unit_type_related_1_ARRAY_005a6f78[(byte)puVar11->state].field_0x2 & 4) == 0)) {
              bVar3 = true;
              if ((*(short *)&puVar11->field_0x6e < 1) || ((puVar11->flags_2 & 0x10000) != 0)) {
LAB_0051ecbc:
                bVar3 = false;
              }
              else {
                bVar12 = *(byte *)(param_1 + 0x2f);
                if ((bVar12 == 0xff) ||
                   ((bVar14 = puVar11->tribe_index, bVar14 == 0xff || (bVar14 == bVar12)))) {
                  bVar14 = 1;
                }
                else {
                  bVar14 = *(byte *)((int)game_state.start_n1 + (char)bVar12 + 0x9c) &
                           '\x01' << (bVar14 & 0x1f);
                }
                if ((((bVar14 != 0) || (puVar11->tribe_index == bVar12)) ||
                    (puVar11->tribe_index == 0xff)) ||
                   (((iVar9 = FUN_004de7b0(puVar11,(int)(char)bVar12), iVar9 != 0 ||
                     (iVar9 = FUN_004de7b0(param_1,(int)(char)puVar11->tribe_index), iVar9 != 0)) ||
                    ((*(byte *)((int)&puVar11->flags_4 + 1) & 0x10) != 0)))) goto LAB_0051ecbc;
                cVar2 = *(char *)(param_1 + 0x2b);
                if (cVar2 == '\x04') {
                  if ((((game_state.level_flags & 2) != 0) || (puVar11->unit_type == '\x04')) ||
                     (puVar11->unit_type == '\a')) goto LAB_0051ecc1;
                  goto LAB_0051ecbc;
                }
                if (cVar2 == '\x06') {
                  if (((game_state.level_flags & 2) != 0) && (puVar11->unit_type == '\a'))
                  goto LAB_0051ecbc;
                }
                else if ((cVar2 != '\b') && (puVar11->unit_type == '\b')) goto LAB_0051ecbc;
              }
LAB_0051ecc1:
              if (bVar3) {
                local_11 = '\x02';
              }
            }
          }
        }
        else if ((puVar11->unit_class == '\n') && (puVar11->unit_type == '\b')) {
          if (param_6 == '\0') {
            if ((unit_type_array_person[*(byte *)(param_1 + 0x2b)].flags & 0x40) == 0) {
              uVar13 = puVar11->flags_4 & 0x100000;
            }
            else {
              uVar13 = puVar11->flags_4 & 0x200000;
            }
            if (uVar13 != 0) goto LAB_0051ed14;
          }
          local_11 = '\x01';
        }
LAB_0051ed14:
        puVar10 = (unit_struct *)(uint)puVar11->next_unit_index;
        puVar11 = unit_land_array[(int)puVar10];
      }
      if ((local_11 == '\0') && (param_5 != '\0')) {
        if ((bVar1 == 0xff) ||
           ((bVar12 = ((&game_state.level_data[0].c_2)[uVar8 * 4] & 0xf) - 1, bVar12 == 0xff ||
            (bVar12 == bVar1)))) {
          puVar10 = (unit_struct *)CONCAT31((int3)((uint)puVar10 >> 8),1);
        }
        else {
          puVar10 = (unit_struct *)
                    CONCAT31((char)bVar1 >> 7,
                             *(byte *)((int)game_state.start_n1 + (char)bVar1 + 0x9c) &
                             '\x01' << (bVar12 & 0x1f));
        }
        if ((char)puVar10 == '\0') {
          puVar10 = (unit_struct *)(&game_state.level_data[0].flags)[uVar8];
          uVar13 = (uint)puVar10 & 0x200;
          if ((uVar13 != 0) || (((uint)puVar10 & 0x400) != 0)) {
            puVar10 = unit_land_array
                      [(ushort)(&game_state.level_data[0].unit_index_2)[uVar8 * 2] & 0x3ff];
            if (uVar13 == 0) {
              puVar10 = (unit_struct *)FUN_004baab0(puVar10,param_1);
              bVar12 = (byte)puVar10;
              goto joined_r0x0051edc6;
            }
LAB_0051edc8:
            local_11 = '\x03';
          }
        }
        else if ((*(byte *)((int)&game_state.level_data[0].flags + uVar8 * 4 + 1) & 2) != 0) {
          puVar10 = (unit_struct *)
                    ((ushort)(&game_state.level_data[0].unit_index_2)[uVar8 * 2] & 0x3ff);
          bVar12 = unit_land_array[(int)puVar10]->field_0x9c & 0x10;
joined_r0x0051edc6:
          if (bVar12 != 0) goto LAB_0051edc8;
        }
      }
LAB_0051edcd:
      local_e._0_1_ = (char)uVar4;
      local_e = CONCAT11(local_e._1_1_,(char)local_e + '\x02');
      puVar5 = (unit_struct *)&puVar5[-1].field_0xb2;
      uVar4 = local_e;
    }
    puVar11 = (unit_struct *)CONCAT31((int3)((uint)puVar10 >> 8),local_10);
    param_4 = param_4 + -1;
    cStack_f = local_e._1_1_ + '\x02';
  } while( true );
}
