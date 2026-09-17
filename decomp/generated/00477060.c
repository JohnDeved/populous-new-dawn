/* Ghidra 12.1.3 pseudocode; entry 00477060; FUN_00477060.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_00477060(unit_struct *param_1)

{
  char cVar1;
  unit_struct *puVar2;
  bool bVar3;
  char cVar4;
  int iVar5;
  unit_related_struct_20B *puVar6;
  int iVar7;
  char local_5;

  local_5 = '\0';
  bVar3 = true;
  if ((((land_flags_1._3_1_ & 6) != 0) && (((byte)land_flags_1 & 8) == 0)) ||
     (iVar5 = FUN_0041b5e0(), iVar5 < 2)) {
    bVar3 = false;
  }
  if (bVar3) {
    game_state.some_unit = param_1;
    (param_1->pos).x = ((param_1->pos).x & 0xfe00) + 0x100;
    (param_1->pos).y = ((param_1->pos).y & 0xfe00) + 0x100;
    if (game_state.some_unit != (unit_struct *)0x0) {
      game_state._4_4_ = game_state._4_4_ | 2;
      level_flags_2 = level_flags_2 | 0x2500000;
      FUN_00417ca0(&(game_state.some_unit)->pos,0xffffffff,1);
      vconfig_index_start = 0;
      DAT_0089c6eb = 0;
      if (draw_mode == 2) {
        FUN_0041d4b0(0);
      }
      FUN_00479f00(0xc,0,1);
      FUN_00479f00(8,0,1);
      FUN_00479f00(10,(short)player_tribe_num,0);
      FUN_004af0a0(0x20);
    }
    iVar5 = 0;
    iVar7 = 0x89d1c8;
    cVar1 = '\0';
    if (game_state.num_tribes != 0) {
      do {
        *(uint *)(iVar7 + 0x93d) = *(uint *)(iVar7 + 0x93d) & 0xfffffeff;
        cVar4 = FUN_00419480(iVar5);
        if (cVar4 == '\0') {
          *(char *)((int)&param_1->loc_2_x + iVar5) = cVar1;
          cVar1 = cVar1 + '\x01';
        }
        iVar5 = iVar5 + 1;
        iVar7 = iVar7 + 0xc65;
      } while (iVar5 < (int)(uint)game_state.num_tribes);
    }
    if ((param_1->flags_2 & 0x400) == 0) {
      puVar6 = (unit_related_struct_20B *)0x0;
    }
    else {
      param_1->flags_2 = param_1->flags_2 & 0xfffffbff;
      ptr_unit_related_20B = ptr_unit_related_20B + -1;
      puVar6 = ptr_unit_related_20B;
    }
    if (puVar6 != (unit_related_struct_20B *)0x0) {
      local_5 = *(char *)&puVar6->field0_0x0;
    }
    if (local_5 != '\0') {
      FUN_00478990(param_1);
    }
    iVar5 = 1;
    FUN_00477b90(param_1);
    do {
      puVar2 = unit_land_array[iVar5];
      if (puVar2->unit_class == '\x02') {
        iVar5 = (int)(char)unit_type_array_building[(byte)puVar2->unit_type].field_0x40;
        cVar1 = unit_type_array_building[(byte)puVar2->unit_type].field_0x41;
        iVar7 = iVar5;
        if (0 < iVar5) {
          do {
            alloc_unit(1,(int)cVar1,puVar2->tribe_index,&puVar2->pos);
            iVar7 = iVar7 + -1;
          } while (iVar7 != 0);
        }
        FUN_004ef180(puVar2);
      }
      iVar5 = iVar5 + 1;
    } while (iVar5 < 0x280);
    FUN_00477890(param_1);
    FUN_004782d0(param_1);
    if ((*(byte *)&param_1->flags_4 & 0x10) == 0) {
      FUN_0048a050(param_1,0xaf,2);
    }
    if ((*(byte *)((int)&param_1->flags_2 + 2) & 0x10) == 0) {
      empty_unit_function(param_1);
      param_1->state = 0x47;
      init_unit_class(param_1);
    }
    param_1->state_2 = 0;
    param_1->flags_2 = param_1->flags_2 | 0x40000000;
  }
  return;
}
