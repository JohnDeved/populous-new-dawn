/* Ghidra 12.1.3 pseudocode; entry 004a0050; FUN_004a0050.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_004a0050(int param_1)

{
  short sVar1;
  unit_struct *puVar2;
  undefined4 uVar3;
  undefined3 uVar5;
  int iVar4;
  int *piStack_2c;
  undefined *puStack_28;
  int iStack_14;
  int iStack_10;
  int iStack_c;
  int iStack_8;
  undefined1 *puStack_4;

  iStack_10 = 0;
  iStack_14 = 0;
  puVar2 = game_state.tribes_array[player_tribe_num].shaman;
  iStack_8 = 0;
  iStack_c = 0;
  if (*(int *)(param_1 + 0x10) != 0) {
    puStack_28 = *(undefined **)(param_1 + 0x37);
    piStack_2c = (int *)0x4a009a;
    iStack_14 = parameterize_by_screen_width();
    puStack_28 = *(undefined **)(param_1 + 0x3b);
    piStack_2c = (int *)0x4a00aa;
    iStack_10 = parameterize_by_screen_height();
    puStack_28 = (undefined *)(*(int *)(param_1 + 0x47) + *(int *)(param_1 + 0x37));
    piStack_2c = (int *)0x4a00bd;
    iStack_c = parameterize_by_screen_width();
    puStack_28 = (undefined *)(*(int *)(param_1 + 0x4b) + *(int *)(param_1 + 0x3b));
    piStack_2c = (int *)0x4a00d0;
    iStack_8 = parameterize_by_screen_height();
    piStack_2c = &iStack_14;
    puStack_28 = &DAT_005ca9e0;
    draw_hfx_ingame_window();
    iStack_10 = iStack_10 + 2;
    iStack_8 = iStack_8 + -2;
    iStack_14 = iStack_14 + 2;
    iStack_c = iStack_c + -2;
    set_indexed_value_from_system_palette(DAT_0089c6f5);
    uVar3 = FUN_00516890(&iStack_14);
    if (puVar2 != (unit_struct *)0x0) {
      sVar1 = *(short *)&puVar2->field_0x6c;
      if (sVar1 != 0) {
        uVar5 = (undefined3)(CONCAT22((short)((uint)uVar3 >> 0x10),sVar1) >> 8);
        if (*(short *)&puVar2->field_0x6e <= sVar1) {
          set_indexed_value_from_system_palette(CONCAT31(uVar5,DAT_0089c6f5));
          FUN_00516890(&iStack_14);
          puStack_4 = (undefined1 *)&piStack_2c;
          iVar4 = ((iStack_10 - iStack_8) * (int)*(short *)&puVar2->field_0x6e) /
                  (int)*(short *)&puVar2->field_0x6c;
          iStack_10 = iStack_8 + iVar4;
          set_indexed_value_from_system_palette
                    (CONCAT31((int3)((uint)iVar4 >> 8),global_palette_indexes));
          FUN_00516890(&iStack_14);
          return;
        }
        set_indexed_value_from_system_palette(CONCAT31(uVar5,global_palette_indexes));
        FUN_00516890(&iStack_14);
        return;
      }
    }
    set_indexed_value_from_system_palette(DAT_0089c6f5);
    FUN_00516890(&iStack_14);
  }
  return;
}
