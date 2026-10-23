/* Ghidra 12.1.3 pseudocode; entry 004ec6f0; main_loop_inner.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */

void main_loop_inner(void)

{
  undefined1 *puVar1;
  ushort *puVar2;
  int iVar3;
  unit_struct *puVar4;
  unit_struct *puVar5;
  bool bVar6;
  int iVar7;
  char *pcVar8;
  int iVar9;
  int iVar10;

  puVar5 = allocated_units;
  if (((byte)land_flags_1 & 2) == 0) {
    iVar9 = 0;
    game_state.offset_counter_2 = game_state.offset_counter_2 + 1;
    DAT_0089d167 = 0;
    if (game_state._858439_1_ != '\0') {
      pcVar8 = &game_state.tribes_array[0].field_0xc24;
      do {
        if (*pcVar8 != '\0') {
          *pcVar8 = *pcVar8 + -1;
        }
        pcVar8 = pcVar8 + 0xc65;
        iVar9 = iVar9 + 1;
      } while (iVar9 < (int)(uint)(byte)game_state._858439_1_);
    }
    game_state._755262_4_ = 0;
    _DAT_0064f494 = _DAT_0064f494 + DAT_0064f480;
    game_state._755266_4_ = 0;
    _DAT_0064f49c = _DAT_0064f49c + DAT_0064f490;
    DAT_0064f480 = 0;
    _DAT_0064f498 = _DAT_0064f498 + DAT_0064f484;
    DAT_0064f484 = 0;
    _DAT_0064f488 = 0;
    _DAT_0064f48c = 0;
    DAT_0064f490 = 0;
    DAT_0089ce60 = '\0';
    if (((load_level_flags._1_1_ & 2) == 0) && ((game_state.level_flags & 0x20) == 0)) {
      FUN_00418e30();
      FUN_004e4f40();
    }
    iVar10 = 0x89d1c8;
    FUN_0041b230();
    iVar9 = 4;
    FUN_00436db0();
    FUN_00493af0();
    FUN_004ec3b0();
    do {
      iVar3 = *(int *)(iVar10 + 0x88d);
      while (iVar7 = iVar3, iVar7 != 0) {
        iVar3 = *(int *)(iVar7 + 8);
        if (*(char *)(iVar7 + 0x2a) != '\0') {
          process_formation_unit(iVar7);
        }
      }
      iVar10 = iVar10 + 0xc65;
      iVar9 = iVar9 + -1;
      puVar5 = pre_fight_units;
    } while (iVar9 != 0);
    while (puVar5 != (unit_struct *)0x0) {
      puVar4 = puVar5->next_unit;
      FUN_00518630(puVar5);
      puVar5 = puVar4;
    }
    FUN_00489e50(0);
    puVar5 = fight_units;
    while (puVar5 != (unit_struct *)0x0) {
      puVar4 = puVar5->next_unit;
      if ((DAT_0089ce60 == '\0') &&
         ((*(char *)((int)&puVar5->coord_scale_4 + 1) == player_tribe_num ||
          (*(char *)((int)&puVar5->coord_scale_4 + 2) == player_tribe_num)))) {
        DAT_0089ce60 = '\x01';
        _DAT_0089c6e5 = FUN_00404c50(&puVar5->pos);
        puVar1 = &game_state.tribes_array[player_tribe_num].field_0x93d;
        *(uint *)puVar1 = *(uint *)puVar1 | 0x8000;
      }
      FUN_00518fb0(puVar5);
      FUN_00489e50(puVar5);
      puVar5 = puVar4;
    }
    FUN_00489e50(1);
    level_flags_1 = level_flags_1 | 0x40;
    puVar5 = allocated_units;
    while (puVar4 = puVar5, puVar4 != (unit_struct *)0x0) {
      puVar5 = puVar4->next_unit_1;
      if (puVar4->state != '\0') {
        puVar4->class_counter = puVar4->class_counter + '\x01';
        maybe_unit_state_processing_1(puVar4);
      }
    }
    level_flags_1 = level_flags_1 & 0xffffffbf;
    puVar5 = guard_control_units;
    while (puVar5 != (unit_struct *)0x0) {
      puVar4 = puVar5->next_unit;
      switch(puVar5->unit_class) {
      case 2:
        unit_processing_class_2_bldg(puVar5);
        break;
      case 7:
        unit_processing_class_7_effect_2(puVar5);
        break;
      case 8:
        unit_processing_class_8_shot_2(puVar5);
        break;
      case 10:
        unit_processing_class_10_internal_2(puVar5);
      }
      puVar5 = puVar4;
    }
    FUN_004ef7f0();
    FUN_004f0460();
    puVar5 = allocated_units_2;
    while (puVar5 != (unit_struct *)0x0) {
      puVar4 = puVar5->next_unit_1;
      puVar5->class_counter = puVar5->class_counter + '\x01';
      maybe_unit_state_processing_1(puVar5);
      puVar5 = puVar4;
    }
    init_tribe_struct();
    sunlight_update_landscape();
    puVar5 = units_to_free;
    while (puVar4 = puVar5, puVar4 != (unit_struct *)0x0) {
      puVar5 = puVar4->next_unit_1;
      puVar1 = &puVar4->class_counter;
      *puVar1 = *puVar1 + -1;
      if (*puVar1 == '\0') {
        puVar4->flags_2 = puVar4->flags_2 & 0xfffffffe;
        move_unit_to_free_list(puVar4);
        DAT_0089c651 = DAT_0089c651 + -1;
        if ((ushort)puVar4->unit_index < 0x280) {
          DAT_0089c659 = DAT_0089c659 + -1;
        }
      }
    }
    FUN_00504660();
    if (game_state._858454_1_ != '\0') {
      set_landscape_pos_fields_2(game_state._858454_1_);
      game_state._858454_1_ = 0;
    }
    FUN_004fc020();
    bVar6 = false;
    if (game_state._838930_2_ != 0) {
      puVar5 = unit_land_array[(ushort)game_state._838930_2_];
      if (((puVar5 != (unit_struct *)0x0) && (puVar5->unit_class == '\x01')) &&
         (0 < *(short *)&puVar5->field_0x6e)) {
        bVar6 = true;
      }
      if (!bVar6) {
        game_state._838930_2_ = 0;
      }
    }
    FUN_0041cb40();
    level_land_processing_2();
    write_save();
    FUN_004f0e00();
    FUN_004ec390();
    FUN_00450a70();
    FUN_0041a550();
    FUN_0041c6d0();
    FUN_004f42c0();
    if (DAT_00895dbb != 0) {
      *(uint *)(DAT_00895dbb + 8) = (uint)DAT_0089d167;
      return;
    }
  }
  else {
    for (; puVar4 = allocated_units_2, puVar5 != (unit_struct *)0x0; puVar5 = puVar5->next_unit_1) {
      puVar2 = &(puVar5->object).flags;
      *puVar2 = *puVar2 & 0xfffe;
    }
    for (; puVar4 != (unit_struct *)0x0; puVar4 = puVar4->next_unit_1) {
      puVar2 = &(puVar4->object).flags;
      *puVar2 = *puVar2 & 0xfffe;
    }
  }
  return;
}
