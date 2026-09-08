/* Ghidra 12.1.3 pseudocode; entry 00421f30; FUN_00421f30.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_00421f30(int *param_1,int *param_2)

{
  int iVar1;
  int iVar2;

  iVar1 = *param_2 - *param_1;
  iVar2 = param_2[1] - param_1[1];
  DAT_006513c8 = iVar1;
  if (iVar1 < 0) {
    DAT_006513c8 = -iVar1;
  }
  DAT_006513cc = iVar2;
  if (iVar2 < 0) {
    DAT_006513cc = -iVar2;
  }
  DAT_006513d4 = DAT_006513cc < DAT_006513c8;
  DAT_006513c0 = 1;
  if (iVar1 < 1) {
    DAT_006513c0 = 3;
  }
  DAT_006513c4 = 0;
  if (iVar2 < 1) {
    DAT_006513c4 = 2;
  }
  if (*param_1 == *param_2) {
    DAT_006513c0 = DAT_006513c4;
  }
  if (param_1[1] == param_2[1]) {
    DAT_006513c4 = DAT_006513c0;
  }
  DAT_006513d0 = DAT_006513cc / 2 + DAT_006513c8 / 2;
  return;
}
