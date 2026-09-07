/* Ghidra 12.1.3 pseudocode; entry 004625e0; FUN_004625e0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_004625e0(int param_1)

{
  int iVar1;
  int iVar2;
  byte *pbVar3;
  int iVar4;
  int iVar5;
  byte *pbVar6;
  int iVar7;
  int *piVar8;
  int iVar9;
  int iStack_c;
  int iStack_4;

  iVar9 = 0;
  pbVar6 = (byte *)(param_1 + 0x74);
  pbVar3 = pbVar6;
  do {
    if ((*pbVar3 & 1) == 0) goto LAB_00462605;
    pbVar3 = pbVar3 + 0x52;
    iVar9 = iVar9 + 1;
  } while (iVar9 < 10);
  iVar9 = -1;
LAB_00462605:
  if (iVar9 != -1) {
    iVar4 = FUN_004e5b60(param_1,iVar9);
    if (iVar4 != 0) {
      iVar9 = 0;
      do {
        if ((*pbVar6 & 1) == 0) goto LAB_00462635;
        pbVar6 = pbVar6 + 0x52;
        iVar9 = iVar9 + 1;
      } while (iVar9 < 10);
      iVar9 = -1;
LAB_00462635:
      if (iVar9 == -1) {
        return;
      }
    }
    iVar4 = 0;
    iVar7 = param_1 + 0x36e;
    do {
      if (*(code **)(iVar7 + 4) != (code *)0x0) {
        iVar5 = (**(code **)(iVar7 + 4))(param_1,iVar9);
        *(int *)(iVar7 + 8) = *(int *)(iVar7 + 8) + 1;
        if (iVar5 != 0) break;
      }
      iVar4 = iVar4 + 1;
      iVar7 = iVar7 + 0x14;
    } while (iVar4 < 0xc);
    iStack_c = 0;
    do {
      iStack_4 = iStack_c;
      iVar9 = iStack_c * 0x14 + param_1;
      if (iStack_c < *(int *)(iVar9 + 0x37e) + iStack_c + -1) {
        piVar8 = (int *)(iVar9 + 0x376);
        do {
          iVar4 = *piVar8;
          if (piVar8[5] < iVar4) {
            iVar2 = piVar8[-2];
            iVar7 = piVar8[-1];
            iVar5 = piVar8[1];
            iVar1 = piVar8[2];
            *(char *)(piVar8 + -2) = (char)piVar8[3];
            piVar8[-1] = piVar8[4];
            *piVar8 = piVar8[5];
            piVar8[1] = piVar8[6];
            piVar8[2] = piVar8[7];
            *(char *)(piVar8 + 3) = (char)iVar2;
            piVar8[4] = iVar7;
            piVar8[5] = iVar4;
            piVar8[6] = iVar5;
            piVar8[7] = iVar1;
          }
          piVar8 = piVar8 + 5;
          iStack_4 = iStack_4 + 1;
        } while (iStack_4 < *(int *)(iVar9 + 0x37e) + iStack_c + -1);
      }
      iStack_c = iStack_c + *(int *)(iVar9 + 0x37e);
    } while (iStack_c < 0xc);
  }
  return;
}
