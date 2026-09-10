/* Ghidra 12.1.3 pseudocode; entry 00488ad0; FUN_00488ad0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


undefined4 __thiscall
FUN_00488ad0(int param_1,int param_2,byte param_3,byte param_4,byte param_5,char param_6)

{
  bool bVar1;
  undefined4 *puVar2;
  int *piVar3;
  int *piVar4;
  int *piVar5;
  undefined1 *puVar6;
  int *piVar7;
  undefined1 *puVar8;
  int iVar9;
  int iVar10;

  piVar3 = (int *)0x0;
  if (param_5 != 0) {
    piVar4 = (int *)0x0;
    puVar8 = &DAT_005d5de8;
    iVar9 = DAT_005d5de9;
    while (iVar9 != 0) {
      if ((*(int *)(puVar8 + 1) == param_2) && ((puVar8[5] & 2) != 0)) {
        piVar7 = *(int **)(param_1 + 0x400);
        piVar5 = piVar4;
        if (piVar7 == (int *)0x0) goto LAB_00488b38;
        goto LAB_00488b1c;
      }
      iVar9 = *(int *)(puVar8 + 0xd);
      puVar8 = puVar8 + 0xc;
    }
    puVar2 = (undefined4 *)(param_1 + (uint)param_5 * 4);
    for (piVar7 = (int *)*puVar2;
        (piVar5 = piVar4, piVar7 != (int *)0x0 &&
        ((*piVar7 != param_2 || (piVar5 = piVar7, *(char *)((int)piVar7 + 5) != param_6))));
        piVar7 = *(int **)((int)piVar7 + 0xb)) {
      piVar3 = piVar7;
    }
    if (piVar5 != (int *)0x0) {
      if (piVar3 == (int *)0x0) {
        *puVar2 = *(undefined4 *)((int)piVar5 + 0xb);
      }
      else {
        *(undefined4 *)((int)piVar3 + 0xb) = *(undefined4 *)((int)piVar5 + 0xb);
      }
      free_2(piVar5);
    }
  }
  goto LAB_00488ba3;
  while (puVar2 = (undefined4 *)((int)piVar7 + 0xb), piVar3 = piVar7, piVar5 = piVar4,
        piVar7 = (int *)*puVar2, (int *)*puVar2 != (int *)0x0) {
LAB_00488b1c:
    if (((*piVar7 == param_2) && (*(byte *)(piVar7 + 1) == param_5)) &&
       (piVar5 = piVar7, *(char *)((int)piVar7 + 5) == param_6)) break;
  }
LAB_00488b38:
  if (piVar5 != (int *)0x0) {
    if (piVar3 == (int *)0x0) {
      *(undefined4 *)(param_1 + 0x400) = *(undefined4 *)((int)piVar5 + 0xb);
    }
    else {
      *(undefined4 *)((int)piVar3 + 0xb) = *(undefined4 *)((int)piVar5 + 0xb);
    }
    free_2(piVar5);
  }
LAB_00488ba3:
  iVar9 = DAT_005d5de9;
  for (puVar8 = &DAT_005d5de8;
      (puVar6 = (undefined1 *)0x0, iVar9 != 0 && (puVar6 = puVar8, *(int *)(puVar8 + 1) != param_2))
      ; puVar8 = puVar8 + 0xc) {
    iVar9 = *(int *)(puVar8 + 0xd);
  }
  if ((puVar6 != (undefined1 *)0x0) && (puVar2 = operator_new(0xf), puVar2 != (undefined4 *)0x0)) {
    *puVar2 = *(undefined4 *)(puVar6 + 1);
    if ((puVar8[6] & 0x40) != 0) {
      param_4 = param_4 | 0x40;
    }
    *(byte *)((int)puVar2 + 5) = param_4;
    *(undefined1 *)((int)puVar2 + 10) = puVar6[7];
    *(undefined4 *)((int)puVar2 + 6) = *(undefined4 *)(puVar6 + 8);
    *(undefined1 *)(puVar2 + 1) = puVar6[5];
    bVar1 = false;
    *(undefined4 *)((int)puVar2 + 0xb) = 0;
    if ((*(byte *)(puVar2 + 1) & 2) != 0) {
      *(byte *)(puVar2 + 1) = param_3;
      iVar9 = *(int *)(param_1 + 0x400);
      if (*(int *)(param_1 + 0x400) == 0) {
        *(undefined4 **)(param_1 + 0x400) = puVar2;
        return 1;
      }
      do {
        iVar10 = *(int *)(iVar9 + 0xb);
        if (iVar10 == 0) {
          bVar1 = true;
          *(int *)(iVar9 + 0xb) = (int)puVar2;
          iVar10 = iVar9;
        }
        iVar9 = iVar10;
      } while (!bVar1);
      return 1;
    }
    bVar1 = false;
    piVar3 = (int *)(param_1 + (uint)param_3 * 4);
    iVar9 = *piVar3;
    if (iVar9 == 0) {
      *piVar3 = (int)puVar2;
      return 1;
    }
    do {
      iVar10 = *(int *)(iVar9 + 0xb);
      if (iVar10 == 0) {
        bVar1 = true;
        *(int *)(iVar9 + 0xb) = (int)puVar2;
        iVar10 = iVar9;
      }
      iVar9 = iVar10;
    } while (!bVar1);
    return 1;
  }
  return 0;
}
