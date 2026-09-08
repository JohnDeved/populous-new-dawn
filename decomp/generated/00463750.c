/* Ghidra 12.1.3 pseudocode; entry 00463750; FUN_00463750.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_00463750(undefined2 *param_1)

{
  short sVar1;

  sVar1 = calc_point_height(*param_1,param_1[1]);
  if ((short)param_1[2] < sVar1) {
    param_1[2] = sVar1;
  }
  return;
}
