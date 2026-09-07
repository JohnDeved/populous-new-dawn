/* Ghidra 12.1.3 pseudocode; entry 004f6c20; FUN_004f6c20.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_004f6c20(int param_1)

{
  int iVar1;
  undefined4 *puVar2;

  if ((*(char *)(param_1 + 0xc22) * 8 + game_state.offset_counter_2 + 0x11U & 0x7f) == 0) {
    if (DAT_005d56b0 == -2) {
      DAT_005d56b0 = -1;
    }
    DAT_005d56b0 = DAT_005d56b0 + '\x01';
    if (DAT_005d56b0 == '\0') {
      puVar2 = textures_end;
      for (iVar1 = 0x1000; iVar1 != 0; iVar1 = iVar1 + -1) {
        *puVar2 = 0;
        puVar2 = puVar2 + 1;
      }
      DAT_005d56b0 = '\x01';
    }
    if (*(char *)(param_1 + 0xc1f) == '\x01') {
      for (iVar1 = *(int *)(param_1 + 0x885); iVar1 != 0; iVar1 = *(int *)(iVar1 + 8)) {
        set_land_pos_ph_2(iVar1,*(undefined1 *)(param_1 + 0x5be),0);
      }
    }
    else {
      iVar1 = *(int *)(param_1 + 0x885);
      if (iVar1 != 0) {
        do {
          set_land_pos_ph_2(iVar1,0xb,0);
          iVar1 = *(int *)(iVar1 + 8);
        } while (iVar1 != 0);
        return;
      }
    }
  }
  return;
}
