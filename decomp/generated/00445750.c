/* Ghidra 12.1.3 pseudocode; entry 00445750; FUN_00445750.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_00445750(unit_struct *param_1,char param_2,uint param_3)

{
  int iVar1;
  unit_struct *puVar2;
  unit_struct *puVar3;
  ushort *puVar4;

  if (param_2 == '\0') {
    param_1->flags_3 = param_1->flags_3 & 0xffffff7f;
    *(byte *)&param_1->loc_1_x = *(byte *)&param_1->loc_1_x & 0x7f;
  }
  else {
    *(byte *)&param_1->loc_1_x = *(byte *)&param_1->loc_1_x | 0x80;
    if ((param_3 & 4) == 0) {
      param_1->flags_3 = param_1->flags_3 & 0xefffffff;
    }
    else {
      param_1->flags_3 = param_1->flags_3 | 0x10000000;
    }
    if ((param_1->tribe_index == player_tribe_num) && (game_state._838930_2_ != param_1->unit_index)
       ) {
      game_state._838943_1_ = game_state._838943_1_ & 0xfd;
      game_state._838940_1_ = 0;
      game_state._838930_2_ = param_1->unit_index;
    }
  }
  if (((param_3 & 2) == 0) && (param_1->unit_land_array_index != 0)) {
    puVar2 = unit_land_array[(ushort)param_1->unit_land_array_index];
    puVar3 = (unit_struct *)0x0;
    if (((*(byte *)&puVar2->flags_2 & 1) == 0) && (puVar2->unit_class != '\0')) {
      puVar3 = puVar2;
    }
    if ((puVar3 != (unit_struct *)0x0) && (puVar3->field_0x9e != '\0')) {
      iVar1 = (int)(char)unit_type_array_vehicle[(byte)puVar3->unit_type].field_0x8;
      if (0 < iVar1) {
        puVar4 = &puVar3->loc_1_x;
        do {
          puVar2 = (unit_struct *)0x0;
          if (((*puVar4 != 0) &&
              (puVar3 = unit_land_array[*puVar4], (*(byte *)&puVar3->flags_2 & 1) == 0)) &&
             (puVar3->unit_class != '\0')) {
            puVar2 = puVar3;
          }
          if ((puVar2 != (unit_struct *)0x0) && (puVar2 != param_1)) {
            if (param_2 == '\0') {
              puVar2->flags_3 = puVar2->flags_3 & 0xffffff7f;
              *(byte *)&puVar2->loc_1_x = *(byte *)&puVar2->loc_1_x & 0x7f;
            }
            else {
              *(byte *)&puVar2->loc_1_x = *(byte *)&puVar2->loc_1_x | 0x80;
              if ((param_3 & 4) == 0) {
                puVar2->flags_3 = puVar2->flags_3 & 0xefffffff;
              }
              else {
                puVar2->flags_3 = puVar2->flags_3 | 0x10000000;
              }
              if (puVar2->tribe_index == player_tribe_num) {
                if (game_state._838930_2_ != puVar2->unit_index) {
                  game_state._838943_1_ = game_state._838943_1_ & 0xfd;
                  game_state._838940_1_ = 0;
                  game_state._838930_2_ = puVar2->unit_index;
                }
              }
            }
          }
          puVar4 = puVar4 + 1;
          iVar1 = iVar1 + -1;
        } while (iVar1 != 0);
      }
    }
  }
  return;
}
