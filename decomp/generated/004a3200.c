/* Ghidra 12.1.3 pseudocode; entry 004a3200; reset_global_palettes.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */

void reset_global_palettes(void)

{
  undefined1 *puVar1;
  int iVar2;
  uint uVar3;

  if ((((byte)level_flags_1 & 4) == 0) && (palette_global_3 != 0)) {
    uVar3 = _clock();
    iVar2 = palette_global_3;
    if (DAT_005cd8f0 <= uVar3) {
      DAT_005cd8f0 = uVar3 + 400;
      _DAT_0089c695 = _DAT_0089c695 + 1;
      puVar1 = (undefined1 *)(palette_global_3 + 0x3fc);
      *puVar1 = 0;
      *(undefined1 *)(iVar2 + 0x3fd) = 0;
      *(undefined1 *)(iVar2 + 0x3fe) = 0;
      *(undefined1 *)(iVar2 + 0x3f8) = 0;
      *(undefined1 *)(iVar2 + 0x3f9) = 0;
      *(undefined1 *)(iVar2 + 0x3fa) = 0;
      *puVar1 = 0xff;
      *(undefined1 *)(iVar2 + 0x3fd) = 0xff;
      *(undefined1 *)(iVar2 + 0x3fe) = 0xff;
      *(undefined1 *)(iVar2 + 0x3f8) = 0x83;
      *(undefined1 *)(iVar2 + 0x3f9) = 0x83;
      *(undefined1 *)(iVar2 + 0x3fa) = 0x83;
      ui_struct_set_palettes(palette_global_3 + 0x3fc,0xff,1);
      ui_struct_set_palettes(palette_global_3 + 0x3f8,0xfe,1);
    }
  }
  return;
}
