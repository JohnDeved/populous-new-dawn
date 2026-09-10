/* Ghidra 12.1.3 pseudocode; entry 00444270; rotate_line.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


/* WARNING: Removing unreachable block (ram,0x004442a8) */
/* WARNING: Removing unreachable block (ram,0x004442b2) */

void rotate_line(short *param_1,short *param_2,ushort param_3)

{
  short sVar1;
  short sVar2;
  short sVar3;
  short sVar4;
  bool bVar5;
  ushort uVar6;
  int iVar7;
  int iVar8;
  ushort uVar9;
  uint uVar10;
  uint uVar11;
  ushort uVar12;

  iVar7 = (int)((int)(short)param_3 + ((int)(short)param_3 >> 0x1f & 0x1ffU)) >> 9;
  uVar11 = (uint)(ushort)(param_1[4] - *param_1);
  uVar10 = (uint)(ushort)(param_1[5] - param_1[1]);
  if (0x7fff < uVar11) {
    uVar11 = uVar11 - 0x10000;
  }
  if (0x7fff < uVar10) {
    uVar10 = uVar10 - 0x10000;
  }
  uVar6 = calc_angle_quadrant(uVar11,-uVar10);
  uVar12 = param_3 + 0x200 & 0x7ff;
  bVar5 = false;
  uVar9 = param_3 & 0x7ff;
  uVar6 = uVar6 & 0x7ff;
  if (uVar9 < 0x600) {
    if (uVar9 <= uVar6) goto joined_r0x00444318;
  }
  else {
    if (uVar6 < uVar9) {
joined_r0x00444318:
      if (uVar12 <= uVar6) goto LAB_0044431c;
    }
    bVar5 = true;
  }
LAB_0044431c:
  if (bVar5) {
    iVar8 = 0;
    goto LAB_0044438f;
  }
  bVar5 = false;
  uVar9 = param_3 + 0x400 & 0x7ff;
  if (uVar12 < 0x600) {
    if (uVar12 <= uVar6) goto joined_r0x0044434b;
  }
  else {
    if (uVar6 < uVar12) {
joined_r0x0044434b:
      if (uVar9 <= uVar6) goto LAB_0044434f;
    }
    bVar5 = true;
  }
LAB_0044434f:
  if (bVar5) {
    iVar8 = 1;
    goto LAB_0044438f;
  }
  bVar5 = false;
  if (uVar9 < 0x600) {
    if (uVar9 <= uVar6) goto joined_r0x00444380;
  }
  else {
    if (uVar6 < uVar9) {
joined_r0x00444380:
      if ((param_3 - 0x200 & 0x7ff) <= uVar6) goto LAB_00444384;
    }
    bVar5 = true;
  }
LAB_00444384:
  iVar8 = !bVar5 + 2;
LAB_0044438f:
  uVar11 = -(iVar8 + iVar7) & 3;
  uVar10 = (-1 - iVar7) - iVar8 & 3;
  sVar1 = param_1[(uVar11 + 2 & 3) * 2];
  sVar2 = param_1[uVar11 * 2];
  sVar3 = param_1[uVar10 * 2 + 1];
  sVar4 = param_1[(uVar10 + 2 & 3) * 2 + 1];
  *param_2 = sVar2 + -8;
  param_2[1] = sVar3 + -8;
  param_2[2] = sVar1;
  param_2[3] = sVar3 + -8;
  param_2[4] = sVar1;
  param_2[5] = sVar4;
  param_2[6] = sVar2 + -8;
  param_2[7] = sVar4;
  return;
}
