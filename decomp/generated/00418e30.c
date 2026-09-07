/* Ghidra 12.1.3 pseudocode; entry 00418e30; FUN_00418e30.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_00418e30(void)

{
  undefined4 *puVar1;
  unit_struct *puVar2;
  uint uVar3;
  bool bVar4;
  bool bVar5;
  byte bVar6;
  byte bVar7;
  int iVar8;
  int iVar9;
  int iVar10;
  byte bVar11;
  int iVar12;
  int *piVar13;
  int iVar14;
  int local_8;
  int local_4;

  iVar12 = 0;
  if (((game_state.offset_counter_2 & 0xf) != 0) || (game_state.offset_counter_2 < 0x11)) {
    return;
  }
  iVar8 = (int)player_tribe_num;
  bVar5 = false;
  iVar9 = 4;
  iVar10 = 0x89d1c8;
  do {
    iVar14 = *(int *)(iVar10 + 0x949);
    if (((iVar14 != 0) && (*(char *)(iVar10 + 0xc20) != '\0')) && (iVar14 < 0x60)) {
      *(int *)(iVar10 + 0x949) = iVar14 + 0x10;
    }
    iVar10 = iVar10 + 0xc65;
    iVar9 = iVar9 + -1;
  } while (iVar9 != 0);
  if ((land_flags_1 & 8) != 0) {
    iVar8 = 0;
    iVar9 = 0x89d1c8;
    piVar13 = &game_state.tribes_array[0].num_persons;
    local_4 = 0;
    local_8 = -1;
    do {
      if ((*(int *)(iVar9 + 0x949) == 0) && (*(char *)(iVar9 + 0xc20) != '\0')) {
        if (*piVar13 == 0) {
          *(undefined4 *)(iVar9 + 0x949) = 1;
          if (player_tribe_num == iVar8) {
            FUN_0041b610(iVar8);
            uVar3 = land_flags_1;
            land_flags_1 = land_flags_1 & 0xf9ffffff;
            land_flags_1 = land_flags_1 | 0x4000000;
            if ((uVar3 & 8) != 0) {
              FUN_00450610(1,0);
            }
            FUN_004af1c0(1);
          }
          FUN_0041b8b0(iVar8);
        }
        else {
          local_4 = local_4 + 1;
          local_8 = iVar8;
        }
      }
      piVar13 = (int *)((int)piVar13 + 0xc65);
      iVar8 = iVar8 + 1;
      iVar9 = iVar9 + 0xc65;
    } while (piVar13 < (int *)((int)&game_state.level_data[0x89].height + 1));
    if (local_4 < 2) {
      if (local_8 != -1) {
        uVar3 = *(uint *)&game_state.tribes_array[local_8].field_0x941;
        if ((uVar3 & 1) == 0) {
          *(uint *)&game_state.tribes_array[local_8].field_0x941 = uVar3 | 1;
          for (puVar2 = game_state.tribes_array[(char)local_8].person_units;
              puVar2 != (unit_struct *)0x0; puVar2 = puVar2->next_unit) {
            if ((puVar2->unit_type != '\b') && ((puVar2->flags_2 & 0x100000) == 0)) {
              *(undefined1 *)((int)&puVar2->loc_1_y + 1) = puVar2->state;
              empty_unit_function(puVar2);
              puVar2->state = 0x29;
              init_unit_class(puVar2);
            }
          }
        }
        if ((player_tribe_num == local_8) && ((land_flags_1 & 0x6000000) == 0)) {
          land_flags_1 = land_flags_1 & 0xf9ffffff;
          land_flags_1 = land_flags_1 | 0x2000000;
          FUN_004af1c0(1);
        }
      }
    }
    else {
      iVar12 = 1;
      iVar8 = 0;
      iVar9 = 0x89d1c8;
      do {
        if (iVar12 == 0) goto LAB_0041945d;
        if ((*(int *)(iVar9 + 0x949) == 0) && (*(char *)(iVar9 + 0xc20) != '\0')) {
          iVar10 = iVar8 + 1;
          iVar14 = iVar8 + 0x89d1c9 + iVar10 * 0xc64;
          while ((iVar10 < 4 && (iVar12 != 0))) {
            if ((*(int *)(iVar14 + 0x949) == 0) && (*(char *)(iVar14 + 0xc20) != '\0')) {
              bVar11 = (byte)iVar8;
              bVar7 = (byte)iVar10;
              if (((bVar11 == 0xff) || (bVar7 == 0xff)) || (bVar11 == bVar7)) {
                bVar6 = 1;
              }
              else {
                bVar6 = *(byte *)((int)game_state.start_n1 + (char)bVar11 + 0x9c) &
                        '\x01' << (bVar7 & 0x1f);
              }
              if (bVar6 != 0) {
                if (((bVar7 == 0xff) || (bVar11 == 0xff)) || (bVar11 == bVar7)) {
                  bVar7 = 1;
                }
                else {
                  bVar7 = *(byte *)((int)game_state.start_n1 + (char)bVar7 + 0x9c) &
                          '\x01' << (bVar11 & 0x1f);
                }
                if (bVar7 != 0) goto LAB_00419294;
              }
              iVar12 = 0;
            }
LAB_00419294:
            iVar10 = iVar10 + 1;
            iVar14 = iVar14 + 0xc65;
          }
        }
        iVar8 = iVar8 + 1;
        iVar9 = iVar9 + 0xc65;
      } while (iVar8 < 4);
      if (iVar12 != 0) {
        iVar8 = 0;
        iVar9 = 0x89d1c8;
        do {
          if (iVar12 == 0) break;
          if ((*(int *)(iVar9 + 0x949) == 0) && (*(char *)(iVar9 + 0xc20) != '\0')) {
            if ((*(uint *)(iVar9 + 0x941) & 1) == 0) {
              *(uint *)(iVar9 + 0x941) = *(uint *)(iVar9 + 0x941) | 1;
              for (puVar2 = game_state.tribes_array[(char)iVar8].person_units;
                  puVar2 != (unit_struct *)0x0; puVar2 = puVar2->next_unit) {
                if ((puVar2->unit_type != '\b') &&
                   ((*(byte *)((int)&puVar2->flags_2 + 2) & 0x10) == 0)) {
                  *(undefined1 *)((int)&puVar2->loc_1_y + 1) = puVar2->state;
                  empty_unit_function(puVar2);
                  puVar2->state = 0x29;
                  init_unit_class(puVar2);
                }
              }
            }
            if ((player_tribe_num == iVar8) && ((land_flags_1 & 0x6000000) == 0)) {
              land_flags_1 = land_flags_1 & 0xf9ffffff;
              land_flags_1 = land_flags_1 | 0x2000000;
              FUN_004af1c0(1);
            }
          }
          iVar8 = iVar8 + 1;
          iVar9 = iVar9 + 0xc65;
        } while (iVar8 < 4);
      }
    }
LAB_0041945d:
    FUN_004164b0(iVar12,local_4);
    return;
  }
  if (game_state.tribes_array[iVar8].f_949 != 0) {
    return;
  }
  iVar12 = (int)player_tribe_num;
  if (game_state.tribes_array[iVar12].num_persons == 0) {
    if ((game_state.tribes_array[iVar12].field_0x93f & 2) == 0) goto LAB_0041909d;
  }
  else if ((game_state.tribes_array[iVar12].field_0x93f & 2) == 0) {
    iVar12 = 1;
    iVar8 = 0x89de2d;
    bVar4 = true;
    if (1 < game_state.num_tribes) {
      piVar13 = &game_state.tribes_array[1].num_persons;
      do {
        if (*(int *)(iVar8 + 0x949) == 0) {
          if (*piVar13 == 0) {
            bVar5 = true;
            *(undefined4 *)(iVar8 + 0x949) = 1;
            FUN_0041b8b0(iVar12);
            if (player_tribe_num != -1) {
              *(int *)(&game_state.field_0xccc56 + player_tribe_num * 0x30) =
                   *(int *)(&game_state.field_0xccc56 + player_tribe_num * 0x30) + 1;
            }
          }
          else {
            bVar4 = false;
          }
        }
        piVar13 = (int *)((int)piVar13 + 0xc65);
        iVar12 = iVar12 + 1;
        iVar8 = iVar8 + 0xc65;
      } while (iVar12 < (int)(uint)game_state.num_tribes);
    }
    if ((!bVar4) && ((game_state.tribes_array[player_tribe_num].field_0x93f & 4) == 0)) {
      return;
    }
    if ((land_flags_1 & 0x2000000) == 0) {
      for (puVar2 = game_state.tribes_array[player_tribe_num].person_units;
          puVar2 != (unit_struct *)0x0; puVar2 = puVar2->next_unit) {
        if ((puVar2->unit_type != '\b') && ((puVar2->flags_2 & 0x100000) == 0)) {
          *(undefined1 *)((int)&puVar2->loc_1_y + 1) = puVar2->state;
          empty_unit_function(puVar2);
          puVar2->state = 0x29;
          init_unit_class(puVar2);
        }
      }
    }
    land_flags_1 = land_flags_1 & 0xf9ffffff;
    land_flags_1 = land_flags_1 | 0x2000000;
    FUN_004af1c0(1);
    if (bVar5) {
      FUN_0041b610(DAT_0089d165);
    }
    game_state._800570_1_ = game_state._800570_1_ | 1;
    level_copy_3(level_number + -1);
    return;
  }
  for (puVar2 = game_state.tribes_array[iVar12].person_units; puVar2 != (unit_struct *)0x0;
      puVar2 = puVar2->next_unit) {
    uVar3 = puVar2->flags_3;
    puVar2->flags_3 = uVar3 & 0xffff7fff;
    puVar2->flags_3 = uVar3 & 0xfff77fff;
    FUN_004da080(puVar2,0xffffffff,(int)*(short *)&puVar2->field_0x6e,1);
  }
LAB_0041909d:
  puVar1 = &game_state.tribes_array[iVar8].f_949;
  *puVar1 = *puVar1 + 1;
  uVar3 = land_flags_1;
  land_flags_1 = land_flags_1 & 0xf9ffffff;
  land_flags_1 = land_flags_1 | 0x4000000;
  if ((uVar3 & 8) != 0) {
    FUN_00450610(1,0);
  }
  FUN_004af1c0(1);
  FUN_0041b610(player_tribe_num);
  FUN_0041b8b0(player_tribe_num);
  return;
}
