/* Ghidra 12.1.3 pseudocode; entry 00504b70; FUN_00504b70.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_00504b70(int param_1)

{
  if ((*(ushort *)(param_1 + 0xc) != 0) &&
     (*(byte *)(param_1 + 0x16 + *(char *)(param_1 + 1) * 4) < 2)) {
    draw_ui_panel(param_1,unit_land_array[*(ushort *)(param_1 + 0xc)],(int)*(short *)(param_1 + 0xe)
                  ,(int)*(short *)(param_1 + 0x10),0,0,0,1);
  }
  return;
}
