/* Ghidra 12.1.3 pseudocode; entry 004f4680; FUN_004f4680.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


undefined4 FUN_004f4680(int param_1,undefined4 param_2,uint param_3,ushort *param_4,int param_5)

{
  byte bVar1;
  unit_struct *puVar2;
  unit_struct *puVar3;
  byte bVar4;
  ushort uVar5;
  int iVar6;
  uint uVar7;
  int iVar8;
  int iVar9;
  int local_c;
  uint local_8;
  int local_4;

  *param_4 = (ushort)param_3;
  local_4 = 0;
  switch(param_2) {
  case 1:
  case 5:
  case 6:
  case 10:
  case 0xc:
  case 0xe:
  case 0xf:
  case 0x10:
  case 0x13:
    return 1;
  case 2:
  case 7:
    iVar9 = 0;
    for (puVar2 = unit_land_array
                  [(short)(&game_state.level_data[0].unit_index)
                          [((param_3 & 0xfe) * 2 | param_3 & 0xfe00) * 2]];
        puVar2 != (unit_struct *)0x0; puVar2 = unit_land_array[puVar2->next_unit_index]) {
      if ((puVar2->unit_class == '\x01') && (puVar2->tribe_index != -1)) {
        if ((((puVar2->flags_2 & 0x10000) == 0) &&
            (((puVar2->unit_type != '\x01' && (puVar2->unit_type != '\b')) &&
             (puVar2->state != '\x17')))) &&
           (((*(byte *)((int)&puVar2->flags_4 + 1) & 0x10) == 0 &&
            (iVar8 = FUN_004de7b0(puVar2,(int)*(char *)(param_1 + 0xc22)), iVar8 == 0)))) {
          bVar4 = *(byte *)(param_1 + 0xc22);
          if ((bVar4 == 0xff) || ((bVar1 = puVar2->tribe_index, bVar1 == 0xff || (bVar4 == bVar1))))
          {
            bVar4 = 1;
          }
          else {
            bVar4 = *(byte *)((int)game_state.start_n1 + (char)bVar4 + 0x9c) &
                    '\x01' << (bVar1 & 0x1f);
          }
          if (bVar4 == 0) {
            iVar9 = iVar9 + 1;
            goto LAB_004f476e;
          }
        }
        iVar9 = iVar9 + -1;
      }
LAB_004f476e:
    }
    if (0 < iVar9) {
      local_8 = param_3 & 0xffff;
      local_4 = iVar9;
    }
    local_c = 0x30;
    iVar9 = 0;
    do {
      iVar8 = 0;
      uVar5 = FUN_0049c890(param_3,iVar9,0);
      for (puVar2 = unit_land_array
                    [(short)(&game_state.level_data[0].unit_index)
                            [((uVar5 & 0xfe) * 2 | uVar5 & 0xfe00) * 2]];
          puVar2 != (unit_struct *)0x0; puVar2 = unit_land_array[puVar2->next_unit_index]) {
        if ((puVar2->unit_class == '\x01') && (puVar2->tribe_index != -1)) {
          if (((*(byte *)((int)&puVar2->flags_2 + 2) & 1) == 0) &&
             ((((puVar2->unit_type != '\x01' && (puVar2->unit_type != '\b')) &&
               (puVar2->state != '\x17')) &&
              (((*(byte *)((int)&puVar2->flags_4 + 1) & 0x10) == 0 &&
               (iVar6 = FUN_004de7b0(puVar2,(int)*(char *)(param_1 + 0xc22)), iVar6 == 0)))))) {
            bVar4 = *(byte *)(param_1 + 0xc22);
            if ((bVar4 == 0xff) ||
               ((bVar1 = puVar2->tribe_index, bVar1 == 0xff || (bVar4 == bVar1)))) {
              bVar4 = 1;
            }
            else {
              bVar4 = *(byte *)((int)game_state.start_n1 + (char)bVar4 + 0x9c) &
                      '\x01' << (bVar1 & 0x1f);
            }
            if (bVar4 == 0) {
              iVar8 = iVar8 + 1;
              goto LAB_004f485e;
            }
          }
          iVar8 = iVar8 + -1;
        }
LAB_004f485e:
      }
      if (local_4 < iVar8) {
        local_8 = (uint)uVar5;
        local_4 = iVar8;
      }
      local_c = local_c + -1;
      iVar9 = iVar9 + 1;
    } while (local_c != 0);
    if (local_4 != 0) {
      *param_4 = (ushort)local_8;
      return 1;
    }
    break;
  case 3:
  case 4:
  case 8:
    if (((param_5 != 0) && (*(char *)(param_5 + 0x2a) == '\x01')) &&
       (*(char *)(param_5 + 0x2b) == '\a')) {
      *param_4 = (ushort)param_3;
      return 1;
    }
    uVar7 = (param_3 & 0xfe) * 2 | param_3 & 0xfe00;
    for (puVar2 = unit_land_array[(short)(&game_state.level_data[0].unit_index)[uVar7 * 2]];
        puVar2 != (unit_struct *)0x0; puVar2 = unit_land_array[puVar2->next_unit_index]) {
      bVar4 = *(byte *)(param_1 + 0xc22);
      if (((bVar4 == 0xff) || (bVar1 = puVar2->tribe_index, bVar1 == 0xff)) || (bVar4 == bVar1)) {
        bVar4 = 1;
      }
      else {
        bVar4 = *(byte *)((int)game_state.start_n1 + (char)bVar4 + 0x9c) & '\x01' << (bVar1 & 0x1f);
      }
      if (bVar4 == 0) {
        if (puVar2->unit_class == '\x01') {
          iVar9 = 0;
          for (puVar3 = unit_land_array[(short)(&game_state.level_data[0].unit_index)[uVar7 * 2]];
              puVar3 != (unit_struct *)0x0; puVar3 = unit_land_array[puVar3->next_unit_index]) {
            if ((puVar3->unit_class == '\x01') && (puVar3->tribe_index != -1)) {
              if (((*(byte *)((int)&puVar3->flags_2 + 2) & 1) == 0) &&
                 ((((puVar3->unit_type != '\x01' && (puVar3->unit_type != '\b')) &&
                   (puVar3->state != '\x17')) &&
                  (((*(byte *)((int)&puVar3->flags_4 + 1) & 0x10) == 0 &&
                   (iVar8 = FUN_004de7b0(puVar3,(int)*(char *)(param_1 + 0xc22)), iVar8 == 0)))))) {
                bVar4 = *(byte *)(param_1 + 0xc22);
                if ((bVar4 == 0xff) ||
                   ((bVar1 = puVar3->tribe_index, bVar1 == 0xff || (bVar4 == bVar1)))) {
                  bVar4 = 1;
                }
                else {
                  bVar4 = *(byte *)((int)game_state.start_n1 + (char)bVar4 + 0x9c) &
                          '\x01' << (bVar1 & 0x1f);
                }
                if (bVar4 == 0) {
                  iVar9 = iVar9 + 1;
                  goto LAB_004f49f6;
                }
              }
              iVar9 = iVar9 + -1;
            }
LAB_004f49f6:
          }
          if (5 < iVar9) {
            *param_4 = (ushort)param_3;
            return 1;
          }
        }
        else if ((puVar2->unit_class == '\x02') && (puVar2->state == '\x02')) {
          local_c._0_2_ =
               CONCAT11((char)((ushort)(puVar2->pos).y >> 8),(char)((ushort)(puVar2->pos).x >> 8)) &
               0xfefe;
          *param_4 = (ushort)local_c;
          return 1;
        }
      }
    }
    local_c = 0;
    local_4 = 0;
    do {
      uVar5 = FUN_0049c890(param_3,local_c,0);
      uVar7 = (uVar5 & 0xfe) * 2 | uVar5 & 0xfe00;
      local_c = local_c + 1;
      for (puVar2 = unit_land_array[(short)(&game_state.level_data[0].unit_index)[uVar7 * 2]];
          puVar2 != (unit_struct *)0x0; puVar2 = unit_land_array[puVar2->next_unit_index]) {
        bVar4 = *(byte *)(param_1 + 0xc22);
        if (((bVar4 == 0xff) || (bVar1 = puVar2->tribe_index, bVar1 == 0xff)) || (bVar4 == bVar1)) {
          bVar4 = 1;
        }
        else {
          bVar4 = *(byte *)((int)game_state.start_n1 + (char)bVar4 + 0x9c) &
                  '\x01' << (bVar1 & 0x1f);
        }
        if (bVar4 == 0) {
          if (puVar2->unit_class == '\x01') {
            iVar9 = 0;
            for (puVar3 = unit_land_array[(short)(&game_state.level_data[0].unit_index)[uVar7 * 2]];
                puVar3 != (unit_struct *)0x0; puVar3 = unit_land_array[puVar3->next_unit_index]) {
              if ((puVar3->unit_class == '\x01') && (puVar3->tribe_index != -1)) {
                if (((((*(byte *)((int)&puVar3->flags_2 + 2) & 1) == 0) &&
                     ((puVar3->unit_type != '\x01' && (puVar3->unit_type != '\b')))) &&
                    (puVar3->state != '\x17')) &&
                   (((*(byte *)((int)&puVar3->flags_4 + 1) & 0x10) == 0 &&
                    (iVar8 = FUN_004de7b0(puVar3,(int)*(char *)(param_1 + 0xc22)), iVar8 == 0)))) {
                  bVar4 = *(byte *)(param_1 + 0xc22);
                  if ((bVar4 == 0xff) ||
                     ((bVar1 = puVar3->tribe_index, bVar1 == 0xff || (bVar4 == bVar1)))) {
                    bVar4 = 1;
                  }
                  else {
                    bVar4 = *(byte *)((int)game_state.start_n1 + (char)bVar4 + 0x9c) &
                            '\x01' << (bVar1 & 0x1f);
                  }
                  if (bVar4 == 0) {
                    iVar9 = iVar9 + 1;
                    goto LAB_004f4bb2;
                  }
                }
                iVar9 = iVar9 + -1;
              }
LAB_004f4bb2:
            }
            if (5 < iVar9) {
              *param_4 = (ushort)param_3;
              return 1;
            }
          }
          else if ((puVar2->unit_class == '\x02') && (puVar2->state == '\x02')) {
            local_c._0_2_ =
                 CONCAT11((char)((ushort)(puVar2->pos).y >> 8),(char)((ushort)(puVar2->pos).x >> 8))
                 & 0xfefe;
            *param_4 = (ushort)local_c;
            return 1;
          }
        }
      }
      local_4 = local_4 + 1;
    } while (local_4 < 0xe0);
    break;
  case 9:
  case 0xb:
  case 0xd:
    if (((&game_state.level_data[0].flags)[(param_3 & 0xfe) * 2 | param_3 & 0xfe00] & 0x200) == 0) {
      return 1;
    }
    iVar8 = 0;
    iVar9 = 0;
    do {
      uVar5 = FUN_0049c890(param_3,iVar9,0);
      if (((&game_state.level_data[0].flags)[(uVar5 & 0xfe) * 2 | uVar5 & 0xfe00] & 0x200) == 0) {
        *param_4 = uVar5;
        return 1;
      }
      iVar8 = iVar8 + 1;
      iVar9 = iVar9 + 1;
    } while (iVar8 < 0x18);
    return 0;
  }
  return 0;
}
