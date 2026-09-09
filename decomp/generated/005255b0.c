/* Ghidra 12.1.3 pseudocode; entry 005255b0; FUN_005255b0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_005255b0(int param_1,int param_2,int param_3,byte param_4,int param_5)

{
  int iVar1;
  int iVar2;
  undefined4 local_8;

  if (param_3 < 0) {
    param_3 = 0;
  }
  else if (0x12 < param_3) {
    param_3 = 0x12;
  }
  if (param_5 == 1) {
    iVar2 = param_3 + 0x5dc;
  }
  else {
    iVar2 = param_3 + 0x5ef;
  }
  iVar1 = (uint)param_4 * 4;
  local_8 = CONCAT31(CONCAT21(CONCAT11(0xff,*(undefined1 *)(system_palette_mem + param_4)),
                              *(undefined1 *)((int)system_palette_mem + iVar1 + 1)),
                     *(undefined1 *)((int)system_palette_mem + iVar1 + 2));
  add_ui_polygons(param_1 - (param_3 + -1),param_2 - (param_3 + -1),hfx_0_addr + iVar2 * 8,local_8,
                  param_4);
  return;
}
