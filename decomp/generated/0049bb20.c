/* Ghidra 12.1.3 pseudocode; entry 0049bb20; convert_from_polar.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void convert_from_polar(int param_1,int param_2,int param_3,int *param_4,int *param_5)

{
  param_2 = (param_3 << 0xb) / param_2;
  *param_4 = maybe_cos[param_2] * param_1 >> 0x10;
  *param_5 = maybe_sin[param_2] * param_1 >> 0x10;
  return;
}
