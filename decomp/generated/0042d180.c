/* Ghidra 12.1.3 pseudocode; entry 0042d180; set_tex_width_and_height_2.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void __thiscall
set_tex_width_and_height_2
          (int param_1,undefined4 param_2,undefined4 param_3,undefined4 param_4,int param_5)

{
  undefined4 uVar1;
  float10 extraout_ST1;

  *(float *)(param_1 + 0x30) = (float)param_5 * FLOAT_0058f218 * (float)param_5 * FLOAT_0058f218;
  uVar1 = __ftol();
  *(undefined4 *)(param_1 + 0x104) = uVar1;
  *(float *)(param_1 + 0x34) = (float)extraout_ST1;
  uVar1 = __ftol();
  *(undefined4 *)(param_1 + 0x100) = uVar1;
  *(undefined4 *)(param_1 + 0x10) = param_2;
  *(undefined4 *)(param_1 + 0x14) = param_3;
  return;
}
