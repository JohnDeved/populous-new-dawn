/* Ghidra 12.1.3 pseudocode; entry 0040cd00; calc_normal_maybe.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


short calc_normal_maybe(int *param_1,int *param_2,int *param_3)

{
  ushort uVar1;
  ushort uVar2;
  int iVar3;
  int iVar4;
  int iVar5;
  int iVar6;
  int iVar7;
  int iVar8;
  int iVar9;

  iVar9 = *param_2 - *param_1;
  iVar5 = param_2[1] - param_1[1];
  iVar4 = param_2[2] - param_1[2];
  iVar6 = *param_3 - *param_1;
  iVar7 = param_3[1] - param_1[1];
  iVar3 = param_3[2] - param_1[2];
  iVar8 = iVar5 * iVar3 - iVar4 * iVar7;
  iVar5 = iVar9 * iVar7 - iVar6 * iVar5;
  uVar1 = calc_angle_quadrant(iVar5,-iVar8);
  iVar5 = fast_sqrt(iVar5 * iVar5 + iVar8 * iVar8);
  uVar2 = calc_angle_quadrant(iVar6 * iVar4 - iVar9 * iVar3,-iVar5);
  return ((ushort)((int)((uVar2 & 0x7ff) + 0x20) >> 6) & 0x1f) * 0x20 +
         ((ushort)((int)((uVar1 & 0x7ff) + 0x20) >> 6) & 0x1f);
}
