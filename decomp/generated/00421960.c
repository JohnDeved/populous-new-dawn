/* Ghidra 12.1.3 pseudocode; entry 00421960; FUN_00421960.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */

void FUN_00421960(undefined1 *param_1)

{
  byte *pbVar1;
  byte *pbVar2;
  byte bVar3;
  byte bVar4;
  byte bVar5;
  int *piVar6;
  undefined1 *puVar7;
  undefined1 *puVar8;
  int *piVar9;
  uint uVar10;
  int iVar11;
  int *piVar12;

  uVar10 = 0;
  DAT_006513db = 0;
  *param_1 = DAT_00650930;
  param_1[1] = DAT_00650934;
  param_1[2] = DAT_00650938;
  param_1[4] = DAT_0065093a;
  param_1[5] = DAT_0065093e;
  param_1[6] = DAT_00650942;
  puVar8 = param_1 + 8;
  param_1[0x408] = DAT_00651344;
  piVar6 = &DAT_00650944;
  piVar12 = (int *)&DAT_00650930;
  if (_DAT_00651344 != 0) {
    do {
      piVar9 = piVar6;
      puVar7 = puVar8;
      if (piVar12 != (int *)0x0) {
        iVar11 = *piVar9 - *piVar12;
        if (iVar11 < 0) {
          iVar11 = *piVar12 - *piVar9;
        }
        if (iVar11 < 0x80) {
          iVar11 = piVar9[1] - piVar12[1];
          if (iVar11 < 0) {
            iVar11 = piVar12[1] - piVar9[1];
          }
          if (iVar11 < 0x80) goto LAB_00421a1a;
        }
        puVar7 = puVar8 + 4;
        *puVar8 = (char)(*piVar9 + *piVar12 >> 1);
        puVar8[1] = (char)(piVar9[1] + piVar12[1] >> 1);
        puVar8[2] = (char)piVar9[2];
        param_1[0x408] = param_1[0x408] + '\x01';
      }
LAB_00421a1a:
      uVar10 = uVar10 + 1;
      *puVar7 = (char)*piVar9;
      puVar8 = puVar7 + 4;
      puVar7[1] = (char)piVar9[1];
      puVar7[2] = (char)piVar9[2];
      piVar6 = (int *)((int)piVar9 + 10);
      piVar12 = piVar9;
    } while (uVar10 < _DAT_00651344);
  }
  bVar3 = param_1[0x408];
  if ((1 < bVar3) &&
     (((&DAT_005a7dcb)
       [(uint)*(byte *)((int)(game_state.sunlight_array + 0x32) +
                       (uint)*(ushort *)
                              (game_state._755280_4_ + 0x8b +
                              (uint)*(byte *)(game_state._755280_4_ + 0xa6) * 2) * 10) * 0x16] &
      0x40) != 0)) {
    pbVar2 = param_1 + (uint)bVar3 * 4 + 4;
    pbVar1 = param_1 + (uint)bVar3 * 4;
    bVar4 = *pbVar2;
    if ((param_1[4] == bVar4) && (bVar5 = pbVar2[1], param_1[5] == bVar5)) {
      if ((pbVar2[2] == 0) && (pbVar1[2] == 1)) {
        iVar11 = (uint)bVar4 - (uint)*pbVar1;
        if (iVar11 < 0) {
          iVar11 = (uint)*pbVar1 - (uint)bVar4;
        }
        if (iVar11 < 3) {
          iVar11 = (uint)bVar5 - (uint)pbVar1[1];
          if (iVar11 < 0) {
            iVar11 = (uint)pbVar1[1] - (uint)bVar5;
          }
          if (iVar11 < 3) {
            param_1[0x408] = bVar3 - 1;
            DAT_006513db = 1;
            return;
          }
        }
      }
      else if ((2 < bVar3) && (((pbVar2[2] == 0 && (pbVar1[2] == 0)) && (pbVar1[-2] == 1)))) {
        iVar11 = (uint)bVar4 - (uint)pbVar1[-4];
        if (iVar11 < 0) {
          iVar11 = (uint)pbVar1[-4] - (uint)bVar4;
        }
        if (iVar11 < 3) {
          iVar11 = (uint)bVar5 - (uint)pbVar1[-3];
          if (iVar11 < 0) {
            iVar11 = (uint)pbVar1[-3] - (uint)bVar5;
          }
          if (iVar11 < 3) {
            param_1[0x408] = bVar3 - 2;
            DAT_006513db = 1;
          }
        }
      }
    }
  }
  return;
}
