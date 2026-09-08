/* Ghidra 12.1.3 pseudocode; entry 0040cde0; FUN_0040cde0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_0040cde0(undefined4 *param_1)

{
  int iVar1;
  int iVar2;

  iVar1 = bl320_sprite_width_1 * 0x10000 + -2;
  iVar2 = bl320_sprite_width * 0x10000 + -2;
  *param_1 = 0;
  param_1[2] = iVar1;
  param_1[4] = iVar1;
  param_1[5] = iVar2;
  param_1[7] = iVar2;
  param_1[1] = 0;
  param_1[3] = 0;
  param_1[6] = 0;
  return;
}
