/* Ghidra 12.1.3 pseudocode; entry 004503f0; calc_distance_toroidal.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void calc_distance_toroidal(short *param_1,short *param_2)

{
  int iVar1;
  int iVar2;
  int iVar3;
  int iVar4;

  iVar4 = (int)*param_2 - (int)*param_1;
  iVar3 = (int)param_2[1] - (int)param_1[1];
  iVar1 = iVar4;
  if (iVar4 < 0) {
    iVar1 = -iVar4;
  }
  iVar2 = iVar3;
  if (iVar3 < 0) {
    iVar2 = -iVar3;
  }
  if (0x8000 < iVar1) {
    iVar4 = 0x10000 - iVar1;
  }
  if (0x8000 < iVar2) {
    iVar3 = 0x10000 - iVar2;
  }
  fast_sqrt(iVar4 * iVar4 + iVar3 * iVar3);
  return;
}
