/* Ghidra 12.1.3 pseudocode; entry 004a3000; update_palettes.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */
/* WARNING: Enum "_D3DRENDERSTATETYPE": Some values do not have unique names */

void update_palettes(void)

{
  uint uVar1;
  undefined4 *puVar2;
  uint uVar3;
  int iVar4;
  undefined4 *puVar5;
  undefined4 *puVar6;

  puVar2 = palette_global_ptr;
  uVar1 = level_flags_1;
  if ((level_flags_1 & 1) != 0) {
    level_flags_1 = level_flags_1 & 0xfffffffe;
    level_flags_1 = level_flags_1 | 4;
    puVar5 = palette_global_1;
    puVar6 = palette_global_ptr;
    for (iVar4 = 0x100; iVar4 != 0; iVar4 = iVar4 + -1) {
      *puVar6 = *puVar5;
      puVar5 = puVar5 + 1;
      puVar6 = puVar6 + 1;
    }
    if ((ui_struct != (ui_struct *)0x0) &&
       (ui_struct->dd_gamma_control != (LPDIRECTDRAWGAMMACONTROL)0x0)) {
      set_gamma_ramp();
    }
    palette_global_3 = puVar2;
    if (((level_flags_1 & 4) == 0) && (puVar2 != (undefined4 *)0x0)) {
      uVar3 = _clock();
      puVar5 = palette_global_3;
      if (DAT_005cd8f0 <= uVar3) {
        DAT_005cd8f0 = uVar3 + 400;
        _DAT_0089c695 = _DAT_0089c695 + 1;
        puVar6 = palette_global_3 + 0xff;
        *(undefined1 *)puVar6 = 0;
        *(undefined1 *)((int)puVar5 + 0x3fd) = 0;
        *(undefined1 *)((int)puVar5 + 0x3fe) = 0;
        *(undefined1 *)(puVar5 + 0xfe) = 0;
        *(undefined1 *)((int)puVar5 + 0x3f9) = 0;
        *(undefined1 *)((int)puVar5 + 0x3fa) = 0;
        *(undefined1 *)puVar6 = 0xff;
        *(undefined1 *)((int)puVar5 + 0x3fd) = 0xff;
        *(undefined1 *)((int)puVar5 + 0x3fe) = 0xff;
        *(undefined1 *)(puVar5 + 0xfe) = 0x83;
        *(undefined1 *)((int)puVar5 + 0x3f9) = 0x83;
        *(undefined1 *)((int)puVar5 + 0x3fa) = 0x83;
        ui_struct_set_palettes(palette_global_3 + 0xff,0xff,1);
        ui_struct_set_palettes(palette_global_3 + 0xfe,0xfe,1);
      }
    }
    ui_struct_set_palettes(puVar2,0,0x100);
    copy_global_palette(&palette_global_4,0x10,0x10);
    if ((uVar1 & 4) == 0) {
      level_flags_1 = level_flags_1 & 0xfffffffb;
    }
  }
  return;
}
