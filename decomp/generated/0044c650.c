/* Ghidra 12.1.3 pseudocode; entry 0044c650; FUN_0044c650.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


undefined4 FUN_0044c650(int param_1)

{
  short *psVar1;
  byte bVar2;
  bool bVar3;
  short sVar4;
  int iVar5;
  int iVar6;
  int *piVar7;
  int iVar8;
  char cVar9;
  undefined4 *puVar10;
  short sVar11;

  iVar5 = 1;
  sVar11 = DAT_00684220;
  if (0 < DAT_00684508) {
    piVar7 = &DAT_00684222;
    do {
      if (*piVar7 == param_1) {
        sVar11 = (&DAT_00684220)[(short)iVar5 * 3];
        break;
      }
      piVar7 = (int *)((int)piVar7 + 6);
      iVar5 = iVar5 + 1;
    } while (iVar5 <= DAT_00684508);
  }
  sVar11 = (&DAT_00684296)[sVar11 * 0x1f];
  if (sVar11 == 0) {
    sVar4 = 1;
    iVar5 = DAT_005cd0be;
    while (iVar5 != 0) {
      if (*(int *)((int)&DAT_005cd080 + sVar4 * 0x3e) == param_1) goto LAB_0044c744;
      sVar4 = sVar4 + 1;
      iVar5 = *(int *)((int)&DAT_005cd080 + sVar4 * 0x3e);
    }
    sVar4 = 0;
LAB_0044c744:
    if (sVar4 == 0) {
      sVar11 = 0;
    }
    else {
      sVar11 = 1;
      iVar5 = sVar4 * 0x3e;
      do {
        if (*(int *)((int)&DAT_0068428c + sVar11 * 0x3e) == 0) goto LAB_0044c784;
        sVar11 = sVar11 + 1;
      } while (sVar11 < 0xb);
      sVar11 = 0;
LAB_0044c784:
      if (sVar11 != 0) {
        iVar6 = (int)sVar11;
        iVar8 = iVar6 * 0x3e;
        puVar10 = (undefined4 *)((int)&DAT_0068425e + iVar8);
        *(undefined4 *)((int)&DAT_0068428c + iVar8) = 1;
        (&DAT_00684298)[iVar6 * 0x1f] = sVar4;
        *puVar10 = *(undefined4 *)((int)&DAT_005cd080 + iVar5);
        (&DAT_00684262)[iVar6 * 0x1f] = (&DAT_005cd084)[sVar4 * 0x1f];
        *(undefined4 *)((int)&DAT_00684264 + iVar8) = *(undefined4 *)((int)&DAT_005cd086 + iVar5);
        *(undefined4 *)((int)&DAT_00684268 + iVar8) = *(undefined4 *)((int)&DAT_005cd08a + iVar5);
        *(int *)((int)&DAT_0068426c + iVar8) =
             (*(int *)((int)&DAT_005cd08e + iVar5) << 0x10) / 0x280;
        *(int *)((int)&DAT_00684270 + iVar8) =
             (*(int *)((int)&DAT_005cd092 + iVar5) << 0x10) / 0x1e0;
        *(int *)((int)&DAT_00684274 + iVar8) =
             (*(int *)((int)&DAT_005cd096 + iVar5) << 0x10) / 0x280;
        *(int *)((int)&DAT_00684278 + iVar8) =
             (*(int *)((int)&DAT_005cd09a + iVar5) << 0x10) / 0x1e0;
        *(undefined4 *)((int)&DAT_0068427c + iVar8) = *(undefined4 *)((int)&DAT_005cd09e + iVar5);
        *(undefined4 *)((int)&DAT_00684280 + iVar8) = *(undefined4 *)((int)&DAT_005cd0a2 + iVar5);
        *(undefined4 *)((int)&DAT_00684284 + iVar8) = *(undefined4 *)((int)&DAT_005cd0a6 + iVar5);
        *(undefined4 *)((int)&DAT_00684288 + iVar8) = *(undefined4 *)((int)&DAT_005cd0aa + iVar5);
        (&DAT_00684294)[iVar6 * 0x1f] = 0;
        (&DAT_00684296)[iVar6 * 0x1f] = sVar11;
        (&DAT_00684298)[iVar6 * 0x1f] = sVar4;
        *(undefined4 *)((int)&DAT_00684290 + iVar8) = DAT_00684210;
        (&DAT_0068429a)[iVar6 * 0x1f] = 0;
        cVar9 = (char)((DAT_0089c661 & 8) >> 3);
        if (cVar9 == '\0') {
          iVar5 = *(int *)((int)&DAT_00684264 + iVar8);
        }
        else {
          iVar5 = *(int *)((int)&DAT_00684268 + iVar8);
        }
        iVar6 = *(int *)(iVar5 + 4);
        while (iVar6 != 9) {
          bVar3 = true;
          bVar2 = *(byte *)(iVar5 + 0x41);
          if ((((bVar2 & 2) != 0) && (cVar9 == '\0')) || (((bVar2 & 1) != 0 && (cVar9 != '\0')))) {
            bVar3 = false;
          }
          if ((bVar2 & 8) != 0) {
            bVar3 = false;
          }
          if ((bVar3) && (sVar4 = FUN_0044ca80(puVar10,iVar5), sVar4 == 0)) break;
          iVar6 = *(int *)(iVar5 + 0x46);
          iVar5 = iVar5 + 0x42;
        }
        FUN_0044ce80(puVar10);
        if (*(code **)((int)&DAT_00684280 + iVar8) != (code *)0x0) {
          (**(code **)((int)&DAT_00684280 + iVar8))(puVar10);
        }
      }
    }
    if ((DAT_0088f000 == '\x02') && (DAT_0068c6cc == 0)) {
      FUN_0048a050(0,0x6d,1);
    }
  }
  else {
    iVar8 = (int)sVar11;
    iVar5 = iVar8 * 0x3e;
    if (*(int *)((int)&DAT_0068428c + iVar5) == 3) {
      *(undefined4 *)((int)&DAT_0068428c + iVar5) = 1;
      (&DAT_00684262)[iVar8 * 0x1f] = (&DAT_005cd084)[(short)(&DAT_00684298)[iVar8 * 0x1f] * 0x1f];
    }
    *(undefined4 *)((int)&DAT_00684290 + iVar5) = DAT_00684210;
    FUN_0044ce80((int)&DAT_0068425e + iVar5);
  }
  psVar1 = &DAT_0068429a + sVar11 * 0x1f;
  puVar10 = (undefined4 *)((int)&DAT_0068452c + *psVar1 * 0x71);
  if (puVar10 != &DAT_0068452c) {
    do {
      if ((((*(int *)((int)puVar10 + 0x22) == 5) && (*(char *)((int)puVar10 + 0x2a) != '\0')) &&
          (*(int *)((int)puVar10 + 0x5b) != 0)) &&
         (sVar4 = FUN_0044c650(*(int *)((int)puVar10 + 0x5b)), sVar4 != 0)) {
        (&DAT_00684294)[sVar4 * 0x1f] = *(undefined2 *)((int)puVar10 + 0x6b);
        break;
      }
      puVar10 = (undefined4 *)((int)&DAT_0068452c + *(short *)((int)puVar10 + 0x6d) * 0x71);
    } while (puVar10 != &DAT_0068452c);
  }
  puVar10 = (undefined4 *)((int)&DAT_0068452c + *psVar1 * 0x71);
  if (puVar10 != &DAT_0068452c) {
    do {
      if (((*(int *)((int)puVar10 + 0x22) == 3) && (*(char *)((int)puVar10 + 0x2a) != '\0')) &&
         ((*(int *)((int)puVar10 + 0x5b) != 0 &&
          (sVar4 = FUN_0044c650(*(int *)((int)puVar10 + 0x5b)), sVar4 != 0)))) {
        (&DAT_00684294)[sVar4 * 0x1f] = *(undefined2 *)((int)puVar10 + 0x6b);
      }
      puVar10 = (undefined4 *)((int)&DAT_0068452c + *(short *)((int)puVar10 + 0x6d) * 0x71);
    } while (puVar10 != &DAT_0068452c);
  }
  iVar5 = (int)*psVar1;
  puVar10 = (undefined4 *)((int)&DAT_0068452c + iVar5 * 0x71);
  if (puVar10 != &DAT_0068452c) {
    do {
      puVar10[3] = 0;
      if (*(int *)((int)&DAT_00684290 + *(short *)((int)puVar10 + 0x6b) * 0x3e) != 0) {
        if (*(code **)((int)puVar10 + 0x67) != (code *)0x0) {
          (**(code **)((int)puVar10 + 0x67))(puVar10);
        }
        if ((((DAT_0089c661 & 4) != 0) || (DAT_0068450c < *(int *)((int)puVar10 + 0x3f))) ||
           ((*(int *)((int)puVar10 + 0x47) + *(int *)((int)puVar10 + 0x3f) <= DAT_0068450c ||
            ((DAT_00684510 < *(int *)((int)puVar10 + 0x43) ||
             (*(int *)((int)puVar10 + 0x4b) + *(int *)((int)puVar10 + 0x43) <= DAT_00684510)))))) {
          puVar10[6] = 0;
          puVar10[7] = 0;
        }
      }
      iVar5 = (int)*(short *)((int)puVar10 + 0x6d);
      puVar10 = (undefined4 *)((int)&DAT_0068452c + iVar5 * 0x71);
    } while (puVar10 != &DAT_0068452c);
  }
  return CONCAT22((short)((uint)(iVar5 * 0xe) >> 0x10),sVar11);
}
