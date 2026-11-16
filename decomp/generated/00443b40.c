/* Ghidra 12.1.3 pseudocode; entry 00443b40; FUN_00443b40.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_00443b40(char param_1,char param_2)

{
  undefined2 uVar1;
  unit_struct *puVar2;
  short sVar3;
  unit_struct *puVar4;
  uint uVar5;
  int iVar6;
  unit_struct *puVar7;
  ushort *puVar8;
  unit_struct *puVar9;
  undefined2 local_4 [2];

  puVar2 = game_state.tribes_array[param_1].shaman;
  if (puVar2 != (unit_struct *)0x0) {
    uVar1 = puVar2->unit_index;
    iVar6 = 0;
    puVar9 = game_state.tribes_array[param_1].person_units;
    for (puVar4 = puVar9; puVar4 != (unit_struct *)0x0; puVar4 = puVar4->next_unit) {
      if (((*(byte *)&puVar4->loc_1_x & 0x80) != 0) && (puVar2 != puVar4)) {
        iVar6 = iVar6 + 1;
      }
    }
    if (iVar6 == 0) {
      for (; puVar9 != (unit_struct *)0x0; puVar9 = puVar9->next_unit) {
        if ((puVar9->state == '\n') && (puVar9->field_0xa7 == '\x1e')) {
          iVar6 = 0;
          uVar5 = (uint)*(ushort *)&puVar9->field_0x9b;
          if ((uVar5 != 0) ||
             (uVar5 = (uint)*(ushort *)
                             ((int)&puVar9->loc_3_z + (uint)(byte)puVar9->hut_people_inside * 2 + 1)
             , uVar5 != 0)) {
            iVar6 = uVar5 * 10 + 0x938830;
          }
          FUN_00433490(puVar9,iVar6);
          FUN_00436ca0(puVar9);
        }
      }
    }
    else {
      sVar3 = 0;
      if (puVar9 != (unit_struct *)0x0) {
        do {
          if (((*(byte *)&puVar9->loc_1_x & 0x80) != 0) && (puVar2 != puVar9)) {
            if ((sVar3 == 0) && (sVar3 = FUN_00436c20(), sVar3 != 0)) {
              local_4[0] = uVar1;
              FUN_00438730(sVar3,0x1e,local_4,0);
            }
            puVar9->flags_2 = puVar9->flags_2 | 0x10;
            FUN_00436ca0(puVar9);
            FUN_00436d00(puVar9,sVar3,0);
            if (param_2 == '\0') {
              puVar9->flags_3 = puVar9->flags_3 & 0xffffff7f;
              *(byte *)&puVar9->loc_1_x = *(byte *)&puVar9->loc_1_x & 0x7f;
              if (puVar9->unit_land_array_index != 0) {
                puVar4 = unit_land_array[(ushort)puVar9->unit_land_array_index];
                puVar7 = (unit_struct *)0x0;
                if (((*(byte *)&puVar4->flags_2 & 1) == 0) && (puVar4->unit_class != '\0')) {
                  puVar7 = puVar4;
                }
                if (((puVar7 != (unit_struct *)0x0) && (puVar7->field_0x9e != '\0')) &&
                   (iVar6 = (int)(char)unit_type_array_vehicle[(byte)puVar7->unit_type].field_0x8,
                   0 < iVar6)) {
                  puVar8 = &puVar7->loc_1_x;
                  do {
                    puVar4 = (unit_struct *)0x0;
                    if (((*puVar8 != 0) &&
                        (puVar7 = unit_land_array[*puVar8], (*(byte *)&puVar7->flags_2 & 1) == 0))
                       && (puVar7->unit_class != '\0')) {
                      puVar4 = puVar7;
                    }
                    if ((puVar4 != (unit_struct *)0x0) && (puVar9 != puVar4)) {
                      puVar4->flags_3 = puVar4->flags_3 & 0xffffff7f;
                      *(byte *)&puVar4->loc_1_x = *(byte *)&puVar4->loc_1_x & 0x7f;
                    }
                    puVar8 = puVar8 + 1;
                    iVar6 = iVar6 + -1;
                  } while (iVar6 != 0);
                }
              }
            }
          }
          puVar9 = puVar9->next_unit;
        } while (puVar9 != (unit_struct *)0x0);
        return;
      }
    }
  }
  return;
}
