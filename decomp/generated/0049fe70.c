/* Ghidra 12.1.3 pseudocode; entry 0049fe70; FUN_0049fe70.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_0049fe70(int param_1)

{
  unit_struct *puVar1;
  int iVar2;
  undefined3 uVar4;
  undefined4 uVar3;
  int iStack_34;
  int iStack_30;
  int iStack_20;
  int iStack_1c;
  int iStack_18;
  int iStack_14;
  int *piStack_10;
  int iStack_c;
  int iStack_8;
  int iStack_4;

  iStack_14 = 0;
  puVar1 = game_state.tribes_array[player_tribe_num].shaman;
  iStack_18 = 0;
  iStack_1c = 0;
  iStack_20 = 0;
  if (*(int *)(param_1 + 0x10) != 0) {
    iStack_30 = *(undefined4 *)(param_1 + 0x37);
    iStack_34 = 0x49feba;
    piStack_10 = (int *)parameterize_by_screen_width();
    iStack_30 = *(undefined4 *)(param_1 + 0x3b);
    iStack_34 = 0x49feca;
    iStack_c = parameterize_by_screen_height();
    iStack_30 = *(int *)(param_1 + 0x47) + *(int *)(param_1 + 0x37);
    iStack_34 = 0x49fedd;
    iStack_8 = parameterize_by_screen_width();
    iStack_30 = *(int *)(param_1 + 0x4b) + *(int *)(param_1 + 0x3b);
    iStack_34 = 0x49fef0;
    iStack_4 = parameterize_by_screen_height();
    iStack_30 = 0x5cac68;
    iStack_34 = 0x5cac38;
    FUN_004a1dd0(param_1,0x5cac38);
    iStack_14 = iStack_4 + -3;
    iStack_20 = (int)piStack_10 + 2;
    iStack_18 = iStack_8 + -3;
    iStack_1c = iStack_c + 2;
    uVar4 = (undefined3)((uint)iStack_1c >> 8);
    if ((*(int *)(param_1 + 8) != 0) && (puVar1 != (unit_struct *)0x0)) {
      if ((*(int *)(param_1 + 0x18) == 0) && (*(int *)(param_1 + 0x1c) == 0)) {
        iVar2 = *(short *)&puVar1->field_0x6c + -0xe1;
        uVar4 = (undefined3)((uint)iVar2 >> 8);
        if (*(short *)&puVar1->field_0x6e < iVar2) {
          uVar3 = CONCAT31(uVar4,DAT_0089c6f5);
        }
        else if (((puVar1->state == '\x19') || (puVar1->state == '\x1d')) &&
                (((byte)sprite_animation_counter & 4) != 0)) {
          uVar3 = CONCAT31(uVar4,DAT_0089c700);
        }
        else {
          uVar3 = CONCAT31(uVar4,DAT_0089c6f5);
        }
      }
      else {
        uVar3 = CONCAT31(uVar4,global_palette_indexes);
      }
      piStack_10 = &iStack_34;
      set_indexed_value_from_system_palette(uVar3);
      FUN_00516890(&iStack_20);
      iVar2 = (iStack_14 - iStack_1c) * 0x16;
      iStack_30 = iStack_14 - ((int)(iVar2 + (iVar2 >> 0x1f & 0xffU)) >> 8);
      iStack_34 = (iStack_18 + iStack_20) / 2;
      FUN_00450e60(puVar1);
      return;
    }
    piStack_10 = &iStack_34;
    set_indexed_value_from_system_palette(CONCAT31(uVar4,DAT_0089c6f5));
    FUN_00516890(&iStack_20);
  }
  return;
}
