/* Ghidra 12.1.3 pseudocode; entry 00401790; sunlight_init_2.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void sunlight_init_2(void)

{
  longlong lVar1;
  longlong lVar2;
  int iVar3;
  int iVar4;
  int iVar5;
  int iVar6;
  int iVar7;
  uint uVar8;
  uint uVar9;
  int local_14;

  uVar8 = 0;
  do {
    lVar1 = (longlong)maybe_cos[(uVar8 & 0x1f) * 0x40] *
            (longlong)maybe_cos[(uVar8 & 0xffffffe0) * 2];
    lVar2 = (longlong)maybe_sin[(uVar8 & 0x1f) * 0x40] *
            (longlong)maybe_cos[(uVar8 & 0xffffffe0) * 2];
    iVar5 = (int)(short)(maybe_sin[(uVar8 & 0xffffffe0) * 2] >> 2);
    iVar7 = (int)(short)((int)((uint)lVar1 >> 0x10 | (int)((ulonglong)lVar1 >> 0x20) << 0x10) >> 2);
    iVar6 = (int)(short)((int)((uint)lVar2 >> 0x10 | (int)((ulonglong)lVar2 >> 0x20) << 0x10) >> 2);
    iVar4 = iVar6 * iVar6 + iVar5 * iVar5 + iVar7 * iVar7;
    iVar3 = fast_sqrt(iVar4);
    if (iVar3 == 0) {
      iVar3 = 0;
      iVar7 = 0;
      local_14 = 0;
    }
    else {
      local_14 = (iVar7 << 8) / iVar3;
      iVar7 = (iVar5 << 8) / iVar3;
      iVar3 = (iVar6 << 8) / iVar3;
    }
    iVar3 = game_state.sunlight_var_2 * iVar3 + game_state.sunlight_var_3 * iVar7 +
            game_state.sunlight_var_1 * local_14;
    if (iVar3 < 1) {
      iVar3 = 0;
    }
    (&sunlight_related_array_1)[uVar8] =
         game_state.sunlight_var_4 +
         (char)((uint)game_state.sunlight_var_5 * iVar3 +
                ((int)((uint)game_state.sunlight_var_5 * iVar3) >> 0x1f & 0xffffU) >> 0x10);
    iVar4 = fast_sqrt(iVar4);
    iVar3 = 0;
    if (iVar4 != 0) {
      iVar3 = (iVar5 << 8) / iVar4;
    }
    iVar3 = iVar3 * -200;
    if (iVar3 < 1) {
      iVar3 = 0;
    }
    uVar9 = uVar8 + 1;
    (&sunlight_related_array_2)[uVar8] =
         game_state.sunlight_var_4 +
         (char)((uint)game_state.sunlight_var_5 * iVar3 +
                ((int)((uint)game_state.sunlight_var_5 * iVar3) >> 0x1f & 0xffffU) >> 0x10);
    uVar8 = uVar9;
  } while ((int)uVar9 < 0x400);
  return;
}
