/* Ghidra 12.1.3 pseudocode; entry 0042adc0; reset_palette.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void reset_palette(undefined4 param_1,undefined1 *param_2)

{
  undefined1 uVar1;

  reset_palette_mem(param_1,0);
  uVar1 = find_palette_min_element(param_1,0xff,0xff,0xff);
  *param_2 = uVar1;
  uVar1 = find_palette_min_element(param_1,0xc,0xc,0xc);
  param_2[1] = uVar1;
  uVar1 = find_palette_min_element(param_1,0xff,0,0);
  param_2[2] = uVar1;
  uVar1 = find_palette_min_element(param_1,0,0xff,0);
  param_2[3] = uVar1;
  uVar1 = find_palette_min_element(param_1,0,0,0xff);
  param_2[4] = uVar1;
  uVar1 = find_palette_min_element(param_1,0xff,0xff,0);
  param_2[5] = uVar1;
  uVar1 = find_palette_min_element(param_1,0xff,0,0xff);
  param_2[6] = uVar1;
  uVar1 = find_palette_min_element(param_1,0,0xff,0xff);
  param_2[7] = uVar1;
  uVar1 = find_palette_min_element(param_1,0,0,0xc2);
  param_2[8] = uVar1;
  uVar1 = find_palette_min_element(param_1,0xaa,0xaa,0xaa);
  param_2[9] = uVar1;
  uVar1 = find_palette_min_element(param_1,0x75,0x75,0x75);
  param_2[10] = uVar1;
  uVar1 = find_palette_min_element(param_1,0x55,0x28,0x48);
  param_2[0xb] = uVar1;
  uVar1 = find_palette_min_element(param_1,0x7d,4,4);
  param_2[0xc] = uVar1;
  uVar1 = find_palette_min_element(param_1,0x7d,4,4);
  param_2[0xd] = uVar1;
  reset_palette_mem(param_1,1);
  return;
}
