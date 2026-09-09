/* Ghidra 12.1.3 pseudocode; entry 0049e8b0; FUN_0049e8b0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */

void FUN_0049e8b0(void)

{
  int iVar1;
  undefined1 uVar2;
  int iVar3;
  int iVar4;
  undefined1 uVar5;
  int iVar6;
  undefined4 uVar7;
  int iVar8;
  int iVar9;
  short *psVar10;
  wchar_t *pwVar11;
  wchar_t *pwVar12;
  undefined1 uStack_2d;
  int iStack_28;
  int iStack_24;
  int iStack_20;
  int iStack_1c;
  int iStack_18;
  int iStack_14;
  int iStack_10;
  int iStack_c;
  int iStack_8;
  int iStack_4;

  iVar3 = (int)player_tribe_num;
  iVar4 = iVar3 * 0xc65 + 0x89d1c8;
  iStack_8 = 0;
  iStack_c = 0;
  iStack_10 = 0;
  iStack_14 = 0;
  iVar9 = 0x100;
  iStack_18 = 0;
  iStack_1c = 0;
  iStack_20 = 0;
  iStack_24 = 0;
  iStack_28 = 0x100;
  iStack_14 = parameterize_by_screen_width();
  iStack_10 = parameterize_by_screen_height();
  iStack_c = parameterize_by_screen_width();
  iStack_8 = parameterize_by_screen_height();
  draw_hfx_ingame_window();
  iStack_18 = iStack_8 + -2;
  iStack_20 = iStack_10 + 2;
  iVar8 = iStack_18 - iStack_20;
  iStack_24 = iStack_14 + 2;
  iStack_1c = iStack_c + -2;
  iVar6 = iStack_1c - iStack_24;
  if (screen_width != _DAT_005cd2a4) {
    _DAT_005cd2a4 = screen_width;
    pwVar11 = (wchar_t *)0x5cd2a8;
    do {
      pwVar12 = pwVar11 + 3;
      *pwVar11 = (short)(pwVar11[1] * iVar6 + (pwVar11[1] * iVar6 >> 0x1f & 0xffU) >> 8) +
                 (short)iStack_24;
      pwVar11 = pwVar12;
    } while (pwVar12 < u___s___s_005cd2b4);
  }
  iVar1 = *(int *)&game_state.tribes_array[iVar3].field_0x961;
  if (0 < iVar1) {
    iVar9 = iVar1 + ((int)(iVar1 * 200 + (iVar1 * 200 >> 0x1f & 0xffU)) >> 8);
    iVar4 = *(int *)&game_state.tribes_array[iVar3].field_0x95d;
    iStack_28 = iVar4;
    if (iVar9 < iVar4) {
      iStack_28 = iVar9;
    }
  }
  set_indexed_value_from_system_palette(CONCAT31((int3)((uint)iVar4 >> 8),DAT_0089c6f5));
  FUN_00516890(&iStack_24);
  iVar4 = iStack_20;
  if ((game_state.level_flags & 0x20) == 0) {
    if ((((byte)level_flags_2 & 1) == 0) || (DAT_0089798b != '\0')) {
      iStack_4 = iStack_20;
      iVar4 = (iVar6 * iStack_28) / iVar9 + iStack_24;
      psVar10 = (short *)0x5cd2a8;
      uStack_2d = DAT_005cd2ad;
      iVar9 = iStack_24;
      uVar5 = DAT_005cd2ac;
      if (iStack_24 < iStack_1c) {
        do {
          if (*psVar10 <= iVar9) {
            uVar5 = (undefined1)psVar10[5];
            uStack_2d = *(undefined1 *)((int)psVar10 + 0xb);
            psVar10 = psVar10 + 3;
          }
          uVar2 = uStack_2d;
          if (iVar4 <= iVar9) {
            uVar2 = uVar5;
          }
          set_indexed_value_from_system_palette(uVar2);
          iVar3 = iVar9 + 2;
          func_0x00516810(iVar9,iStack_4,iVar8);
          iVar9 = iVar3;
        } while (iVar3 < iStack_1c);
      }
    }
    else {
      uVar7 = CONCAT31((int3)((uint)iVar6 >> 8),DAT_0089c6f6);
      iVar9 = iStack_24;
      if (iStack_24 < iStack_1c) {
        do {
          set_indexed_value_from_system_palette(uVar7);
          func_0x00516810(iVar9,iVar4,iVar8);
          iVar9 = iVar9 + 2;
        } while (iVar9 < iStack_1c);
        return;
      }
    }
  }
  return;
}
