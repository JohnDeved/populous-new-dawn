/* Ghidra 12.1.3 pseudocode; entry 0044a070; FUN_0044a070.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */

void FUN_0044a070(int param_1,int param_2,float *param_3,float *param_4)

{
  float fVar1;
  float fVar2;
  float local_18;
  float local_14;
  float local_10;
  float local_c;
  float local_4;

  fVar1 = (float)param_2;
  local_14 = (float)param_2 * _DAT_0058f2fc * _DAT_0058f300;
  if (local_14 < _DAT_0058f304) {
    local_14 = 1.0;
  }
  local_c = (float)(param_1 / param_2) / local_14;
  if (local_c == _DAT_0058f2e8) {
    local_c = 1.0;
  }
  fVar2 = (param_3[3] * param_3[3]) / (local_c * _DAT_0058f308);
  if (((param_1 < 0) && (fVar2 < (float)param_1)) || ((0 < param_1 && ((float)param_1 < fVar2)))) {
    local_18 = (float)param_1;
    local_4 = 0.0;
    local_c = 0.0;
    local_10 = 0.0;
    param_3[3] = local_18 / fVar1;
    local_18 = param_3[3] / fVar1;
    local_14 = fVar1;
    if (local_18 == _DAT_0058f2e8) {
      local_18 = 1.0;
    }
  }
  else {
    local_4 = -(param_3[3] / local_c) + local_14;
    local_10 = ((float)param_1 + fVar2) / (((fVar1 - local_4) - local_14) + local_14);
    local_c = (local_10 - param_3[3]) / local_4;
    local_18 = local_10 / local_14;
  }
  param_3[4] = param_3[3];
  param_3[2] = local_10;
  *param_3 = local_c;
  param_3[1] = local_18;
  *param_4 = local_4;
  param_4[1] = fVar1 - local_14;
  return;
}
