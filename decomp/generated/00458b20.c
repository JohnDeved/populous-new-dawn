/* Ghidra 12.1.3 pseudocode; entry 00458b20; get_system_palettes_to_ui_struct.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


undefined4 get_system_palettes_to_ui_struct(void)

{
  HDC hdc;
  UINT UVar1;
  uint uVar2;
  tagPALETTEENTRY local_28 [10];

  hdc = GetDC((HWND)0x0);
  UVar1 = GetSystemPaletteEntries(hdc,0,10,local_28);
  if (UVar1 != 10) {
    return 0xffffffff;
  }
  uVar2 = 0;
  do {
    local_28[uVar2].peFlags = '\0';
    uVar2 = uVar2 + 2;
  } while (uVar2 < 10);
  ui_struct_set_palettes(local_28,0,10);
  UVar1 = GetSystemPaletteEntries(hdc,0xf6,10,local_28);
  if (UVar1 != 10) {
    return 0xffffffff;
  }
  uVar2 = 0;
  do {
    local_28[uVar2].peFlags = '\0';
    uVar2 = uVar2 + 2;
  } while (uVar2 < 10);
  ui_struct_set_palettes(local_28,0xf6,10);
  ReleaseDC((HWND)0x0,hdc);
  return 0;
}
