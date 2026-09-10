/* Ghidra 12.1.3 pseudocode; entry 00444430; comp_distances.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void comp_distances(ushort *param_1,int param_2)

{
  int *piVar1;
  int *piVar2;
  int iVar3;
  int *piVar4;
  int iVar5;
  undefined2 *puVar6;
  int iVar7;

  iVar3 = 4;
  puVar6 = (undefined2 *)(param_2 + 2);
  do {
    *puVar6 = 0;
    puVar6[-1] = 0;
    *(uint *)(puVar6 + 1) = (uint)*param_1;
    iVar3 = iVar3 + -1;
    *(uint *)(puVar6 + 3) = (uint)param_1[1];
    puVar6 = puVar6 + 6;
    param_1 = param_1 + 2;
  } while (iVar3 != 0);
  iVar3 = 0;
  piVar4 = (int *)(param_2 + 4);
  do {
    if ((short)piVar4[-1] == 0) {
      iVar7 = 0;
      piVar2 = (int *)(param_2 + 4);
      do {
        if ((iVar7 != iVar3) && ((short)piVar2[-1] == 0)) {
          iVar5 = *piVar2 - *piVar4;
          if (iVar5 < 0) {
            iVar5 = -iVar5;
          }
          if (0x8000 < iVar5) {
            iVar5 = iVar3;
            if (*piVar2 < *piVar4) {
              iVar5 = iVar7;
            }
            puVar6 = (undefined2 *)(param_2 + iVar5 * 0xc);
            piVar1 = (int *)(puVar6 + 2);
            *piVar1 = *piVar1 + 0x10000;
            *puVar6 = 1;
          }
        }
        piVar2 = piVar2 + 3;
        iVar7 = iVar7 + 1;
      } while (iVar7 < 4);
    }
    piVar4 = piVar4 + 3;
    iVar3 = iVar3 + 1;
  } while (iVar3 < 4);
  iVar3 = 0;
  piVar4 = (int *)(param_2 + 8);
  do {
    if (*(short *)((int)piVar4 + -6) == 0) {
      iVar7 = 0;
      piVar2 = (int *)(param_2 + 8);
      do {
        if ((iVar7 != iVar3) && (*(short *)((int)piVar2 + -6) == 0)) {
          iVar5 = *piVar2 - *piVar4;
          if (iVar5 < 0) {
            iVar5 = -iVar5;
          }
          if (0x8000 < iVar5) {
            iVar5 = iVar3;
            if (*piVar2 < *piVar4) {
              iVar5 = iVar7;
            }
            iVar5 = param_2 + iVar5 * 0xc;
            piVar1 = (int *)(iVar5 + 8);
            *piVar1 = *piVar1 + 0x10000;
            *(undefined2 *)(iVar5 + 2) = 1;
          }
        }
        piVar2 = piVar2 + 3;
        iVar7 = iVar7 + 1;
      } while (iVar7 < 4);
    }
    piVar4 = piVar4 + 3;
    iVar3 = iVar3 + 1;
  } while (iVar3 < 4);
  return;
}
