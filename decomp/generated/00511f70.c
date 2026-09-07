/* Ghidra 12.1.3 pseudocode; entry 00511f70; process_lightning_bolt.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void process_lightning_bolt(int param_1)

{
  unit_struct *puVar1;
  uint uVar2;
  bool bVar3;
  bool bVar4;
  int iVar5;
  undefined2 local_6;

  bVar4 = false;
  iVar5 = alloc_unit(7,0x20,*(undefined1 *)(param_1 + 0x2f),param_1 + 0x3d);
  if (iVar5 != 0) {
    *(uint *)(iVar5 + 0xc) = *(uint *)(iVar5 + 0xc) | 0x4000;
    *(ushort *)(iVar5 + 0x35) = *(ushort *)(iVar5 + 0x35) & 0xffef;
    *(uint *)(iVar5 + 0x10) = *(uint *)(iVar5 + 0x10) | 0x200;
    unit_set_object(iVar5 + 0x33,0x29,0x551);
    if ((*(byte *)(iVar5 + 0xe) & 0x10) == 0) {
      empty_unit_function(iVar5);
      *(undefined1 *)(iVar5 + 0x2c) = 0x24;
      init_unit_class(iVar5);
    }
    *(undefined2 *)(iVar5 + 0x6c) = 8;
  }
  iVar5 = alloc_unit(7,0x1e,*(undefined1 *)(param_1 + 0x2f),param_1 + 0x3d);
  if (iVar5 != 0) {
    *(undefined4 *)(iVar5 + 0x57) = *(undefined4 *)(param_1 + 0x57);
    *(undefined2 *)(iVar5 + 0x5b) = *(undefined2 *)(param_1 + 0x5b);
    if ((PTR_008922e8 != (unit_struct *)0x0) && (*(char *)(param_1 + 0x2f) != player_tribe_num)) {
      bVar4 = true;
    }
    local_6 = CONCAT11((char)((ushort)*(undefined2 *)(iVar5 + 0x59) >> 8),
                       (char)((ushort)*(undefined2 *)(iVar5 + 0x57) >> 8));
    iVar5 = 0;
    puVar1 = unit_land_array
             [(short)(&game_state.level_data[0].unit_index)
                     [((local_6 & 0xfe) * 2 | local_6 & 0xfe00) * 2]];
    while ((puVar1 != (unit_struct *)0x0 && (iVar5 <= DAT_005aa4d4))) {
      if (puVar1->unit_class == '\x01') {
        bVar3 = true;
        if (puVar1->unit_type == '\a') {
          if (puVar1->tribe_index == *(char *)(param_1 + 0x2f)) {
LAB_005120a0:
            bVar3 = false;
          }
        }
        else if (puVar1->unit_type == '\b') goto LAB_005120a0;
        uVar2 = puVar1->flags_3;
        if ((uVar2 & 0x20000) != 0) {
          bVar3 = false;
        }
        if ((uVar2 & 0x8000) != 0) {
          bVar3 = false;
        }
        if (bVar3) {
          *(undefined2 *)&puVar1->field_0x6e = 0;
          iVar5 = iVar5 + 1;
          FUN_004da0d0(puVar1,CONCAT31((int3)(uVar2 >> 8),*(undefined1 *)(param_1 + 0x2f)));
          if ((*(byte *)((int)&puVar1->flags_2 + 2) & 0x10) == 0) {
            *(undefined1 *)((int)&puVar1->loc_1_y + 1) = puVar1->state;
            empty_unit_function(puVar1);
            puVar1->state = 0x2c;
            init_unit_class(puVar1);
          }
        }
      }
      puVar1 = unit_land_array[puVar1->next_unit_index];
    }
    if (((bVar4) &&
        (puVar1 = game_state.tribes_array[player_tribe_num].shaman, puVar1 != (unit_struct *)0x0))
       && (puVar1->state == '*')) {
      puVar1->flags_2 = puVar1->flags_2 & 0xffefffff;
      puVar1 = game_state.tribes_array[player_tribe_num].shaman;
      if ((*(byte *)((int)&puVar1->flags_2 + 2) & 0x10) == 0) {
        *(undefined1 *)((int)&puVar1->loc_1_y + 1) = puVar1->state;
        empty_unit_function(puVar1);
        puVar1->state = 3;
        init_unit_class(puVar1);
      }
      FUN_004da0d0(game_state.tribes_array[player_tribe_num].shaman,*(undefined1 *)(param_1 + 0x2f))
      ;
    }
  }
  update_after_unit_alloc(param_1);
  return;
}
