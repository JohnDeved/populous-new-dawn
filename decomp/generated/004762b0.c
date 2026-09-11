/* Ghidra 12.1.3 pseudocode; entry 004762b0; FUN_004762b0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_004762b0(int param_1,int *param_2,int param_3)

{
  byte bVar1;
  short sVar2;
  bool bVar3;
  char cVar4;
  ushort uVar5;
  uint uVar6;
  int iVar7;
  int iVar8;
  int iVar9;
  int iVar10;
  uint uVar11;
  uint uVar12;
  uint uVar13;
  ushort local_10;
  byte local_8;
  int local_4;

  bVar3 = false;
  bVar1 = *(byte *)(param_1 + 0x65);
  cVar4 = bVar1 + 1;
  *(char *)(param_1 + 0x65) = cVar4;
  if (cVar4 < '\x05') {
    bVar3 = true;
    local_8 = bVar1;
    if (cVar4 < '\x02') {
      local_8 = 0;
    }
  }
  else {
    *(undefined1 *)(param_1 + 0x65) = 0;
  }
  if (bVar3) {
    local_10 = *(ushort *)(param_1 + 0x61) & 0xfefe;
    uVar11 = (uint)(ushort)(((*(ushort *)(param_1 + 0x61) & 0xfe) + 1) * 0x100) -
             (uint)(ushort)tribe_ptr->x;
    uVar6 = uVar11;
    if ((int)uVar11 < 0) {
      uVar6 = -uVar11;
    }
    uVar12 = uVar11;
    if (((uVar6 & 0x8000) != 0) && (uVar12 = uVar6 - 0x10000, (int)uVar11 < 1)) {
      uVar12 = 0x10000 - uVar6;
    }
    uVar11 = (uint)(ushort)(((local_10 >> 8) + 1) * 0x100) - (uint)(ushort)tribe_ptr->y;
    uVar6 = uVar11;
    if ((int)uVar11 < 0) {
      uVar6 = -uVar11;
    }
    uVar13 = uVar11;
    if (((uVar6 & 0x8000) != 0) && (uVar13 = uVar6 - 0x10000, (int)uVar11 < 1)) {
      uVar13 = 0x10000 - uVar6;
    }
    sVar2 = *(short *)(param_1 + 0x41);
    local_4 = (int)*(short *)(param_3 + 4);
    if (0 < local_4) {
      do {
        iVar7 = param_2[1] - (int)sVar2;
        if (0 < iVar7) {
          if (0x100 < iVar7) {
            iVar7 = 0x100;
          }
          iVar9 = *param_2 - (int)(short)((int)uVar12 >> 1);
          iVar10 = param_2[2] - (int)(short)((int)uVar13 >> 1);
          iVar8 = iVar9 * iVar9 + iVar10 * iVar10;
          if (0x100000 < iVar8) {
            iVar8 = 0x100000;
          }
          iVar7 = ((int)(iVar7 * 0x14 + (iVar7 * 0x14 >> 0x1f & 0xffU)) >> 8) * (0x100000 - iVar8);
          iVar7 = ((int)(iVar7 + (iVar7 >> 0x1f & 0xfffffU)) >> 0x14) >> (local_8 & 0x1f);
          if (0 < iVar7) {
            uVar5 = calc_angle_quadrant(iVar9,-iVar10);
            *param_2 = *param_2 + (maybe_sin[uVar5 & 0x7ff] * iVar7 >> 0x10);
            param_2[2] = param_2[2] + (maybe_cos[uVar5 & 0x7ff] * iVar7 >> 0x10);
          }
        }
        param_2 = param_2 + 8;
        local_4 = local_4 + -1;
      } while (local_4 != 0);
    }
  }
  return;
}
