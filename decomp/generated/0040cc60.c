/* Ghidra 12.1.3 pseudocode; entry 0040cc60; calc_points_median.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void calc_points_median(int param_1,int param_2,int param_3,int param_4,int param_5)

{
  short *psVar1;
  short *psVar2;
  short sVar3;
  short *psVar4;

  sVar3 = 0;
  psVar4 = *(short **)(param_1 + 0x18);
  psVar2 = *(short **)(param_2 + 0x18);
  psVar1 = *(short **)(param_3 + 0x18);
  if (0 < *(short *)(param_1 + 4)) {
    do {
      sVar3 = sVar3 + 1;
      *psVar4 = *psVar2 + (short)((((int)*psVar1 - (int)*psVar2) * param_4) / param_5);
      psVar4[1] = psVar2[1] + (short)((((int)psVar1[1] - (int)psVar2[1]) * param_4) / param_5);
      psVar4[2] = psVar2[2] + (short)((((int)psVar1[2] - (int)psVar2[2]) * param_4) / param_5);
      psVar1 = psVar1 + 3;
      psVar2 = psVar2 + 3;
      psVar4 = psVar4 + 3;
    } while (sVar3 < *(short *)(param_1 + 4));
  }
  return;
}
