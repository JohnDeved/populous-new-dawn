/* Ghidra 12.1.3 pseudocode; entry 004deb40; FUN_004deb40.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_004deb40(char param_1,char param_2)

{
  int iVar1;
  bool bVar2;
  char cVar3;
  int iVar4;
  int iVar5;
  int iVar6;
  uint uVar7;
  ushort *puVar8;
  int iVar9;
  uint uVar10;
  ushort uStack_12;
  undefined1 uStack_10;
  undefined1 uStack_f;
  undefined2 uStack_e;
  int iStack_c;
  int iStack_4;

  uVar7 = (uint)param_1;
  if (((&DAT_005a794d)[uVar7 * 0x17] & 1) == 0) {
    iStack_4 = 0x899f67;
    iVar4 = DAT_00890368;
  }
  else {
    iStack_4 = 0x899f79;
    iVar4 = DAT_00890364;
  }
  iStack_c = 0;
  uVar10 = (uint)param_2;
  uStack_12 = *(ushort *)(iStack_4 + uVar10 * 2);
  if (((uStack_12 != 0) && (iVar5 = (&DAT_00890390)[uStack_12], (*(byte *)(iVar5 + 0xc) & 1) == 0))
     && (*(char *)(iVar5 + 0x2a) != '\0')) {
    iStack_c = iVar5;
  }
  if (((iStack_c == 0) || (*(char *)(iStack_c + 0x2a) != '\x04')) ||
     ((*(byte *)(iStack_c + 0x2b) != uVar7 || (*(char *)(iStack_c + 0x2f) != DAT_0089c6f0)))) {
LAB_004decb3:
    uStack_12 = 0;
  }
  else {
    bVar2 = false;
    if (*(char *)(iStack_c + 0x9e) != '\0') {
      if (param_2 == '\0') {
        bVar2 = true;
      }
      else {
        iVar5 = 0;
        if (0 < (char)(&DAT_005a7940)[(uint)*(byte *)(iStack_c + 0x2b) * 0x17]) {
          puVar8 = (ushort *)(iStack_c + 0x7a);
          do {
            if (bVar2) goto LAB_004dec77;
            iVar6 = 0;
            if (((*puVar8 != 0) &&
                (iVar9 = (&DAT_00890390)[*puVar8], (*(byte *)(iVar9 + 0xc) & 1) == 0)) &&
               (*(char *)(iVar9 + 0x2a) != '\0')) {
              iVar6 = iVar9;
            }
            if ((iVar6 != 0) && (*(byte *)(iVar6 + 0x2b) == uVar10)) {
              bVar2 = true;
            }
            puVar8 = puVar8 + 1;
            iVar5 = iVar5 + 1;
          } while (iVar5 < (char)(&DAT_005a7940)[(uint)*(byte *)(iStack_c + 0x2b) * 0x17]);
        }
      }
    }
    if (!bVar2) goto LAB_004decb3;
LAB_004dec77:
    cVar3 = FUN_00451ac0(iStack_c,&DAT_0089d1ec + DAT_0089c6f0 * 0xc65,
                         *(uint *)((int)&DAT_0089db05 + DAT_0089c6f0 * 0xc65) & 0x80);
    if (cVar3 == '\0') goto LAB_004decb3;
  }
  iVar5 = iVar4;
  if (uStack_12 == 0) {
    iVar4 = FUN_004514f0((int)DAT_0089c6f0,uVar7,uVar10,&DAT_0089d1ec + DAT_0089c6f0 * 0xc65,1);
    if (iVar4 == 0) goto LAB_004def09;
  }
  else {
    for (; (iVar5 != 0 && (iVar5 != iStack_c)); iVar5 = *(int *)(iVar5 + 8)) {
    }
    uStack_10 = 0;
    uStack_f = 0;
    uStack_e = 0;
    iVar5 = *(int *)(iVar5 + 8);
    while ((iVar5 != 0 && (CONCAT22(uStack_e,CONCAT11(uStack_f,uStack_10)) == 0))) {
      if (*(char *)(iVar5 + 0x2f) == DAT_0089c6f0) {
        bVar2 = false;
        if (*(char *)(iVar5 + 0x9e) != '\0') {
          if (param_2 == '\0') {
            bVar2 = true;
          }
          else {
            iVar6 = 0;
            if (0 < (char)(&DAT_005a7940)[(uint)*(byte *)(iVar5 + 0x2b) * 0x17]) {
              puVar8 = (ushort *)(iVar5 + 0x7a);
              do {
                if (bVar2) goto LAB_004ded90;
                iVar9 = 0;
                if (((*puVar8 != 0) &&
                    (iVar1 = (&DAT_00890390)[*puVar8], (*(byte *)(iVar1 + 0xc) & 1) == 0)) &&
                   (*(char *)(iVar1 + 0x2a) != '\0')) {
                  iVar9 = iVar1;
                }
                if ((iVar9 != 0) && (*(byte *)(iVar9 + 0x2b) == uVar10)) {
                  bVar2 = true;
                }
                puVar8 = puVar8 + 1;
                iVar6 = iVar6 + 1;
              } while (iVar6 < (char)(&DAT_005a7940)[(uint)*(byte *)(iVar5 + 0x2b) * 0x17]);
            }
          }
        }
        if (bVar2) {
LAB_004ded90:
          cVar3 = FUN_00451ac0(iVar5,&DAT_0089d1ec + DAT_0089c6f0 * 0xc65,
                               *(uint *)((int)&DAT_0089db05 + DAT_0089c6f0 * 0xc65) & 0x80);
          if (cVar3 != '\0') {
            uStack_10 = (undefined1)iVar5;
            uStack_f = (undefined1)((uint)iVar5 >> 8);
            uStack_e = (undefined2)((uint)iVar5 >> 0x10);
          }
        }
      }
      iVar5 = *(int *)(iVar5 + 8);
    }
    for (; (iVar4 != 0 && (iVar4 != iStack_c)); iVar4 = *(int *)(iVar4 + 8)) {
      if (CONCAT22(uStack_e,CONCAT11(uStack_f,uStack_10)) != 0) goto LAB_004deecc;
      if (*(char *)(iVar4 + 0x2f) == DAT_0089c6f0) {
        bVar2 = false;
        if (*(char *)(iVar4 + 0x9e) != '\0') {
          if (param_2 == '\0') {
            bVar2 = true;
          }
          else {
            iVar5 = 0;
            if (0 < (char)(&DAT_005a7940)[(uint)*(byte *)(iVar4 + 0x2b) * 0x17]) {
              puVar8 = (ushort *)(iVar4 + 0x7a);
              do {
                if (bVar2) goto LAB_004dee7d;
                iVar6 = 0;
                if (((*puVar8 != 0) &&
                    (iVar9 = (&DAT_00890390)[*puVar8], (*(byte *)(iVar9 + 0xc) & 1) == 0)) &&
                   (*(char *)(iVar9 + 0x2a) != '\0')) {
                  iVar6 = iVar9;
                }
                if ((iVar6 != 0) && (*(byte *)(iVar6 + 0x2b) == uVar10)) {
                  bVar2 = true;
                }
                puVar8 = puVar8 + 1;
                iVar5 = iVar5 + 1;
              } while (iVar5 < (char)(&DAT_005a7940)[(uint)*(byte *)(iVar4 + 0x2b) * 0x17]);
            }
          }
        }
        if (bVar2) {
LAB_004dee7d:
          cVar3 = FUN_00451ac0(iVar4,&DAT_0089d1ec + DAT_0089c6f0 * 0xc65,
                               *(uint *)((int)&DAT_0089db05 + DAT_0089c6f0 * 0xc65) & 0x80);
          if (cVar3 != '\0') {
            uStack_10 = (undefined1)iVar4;
            uStack_f = (undefined1)((uint)iVar4 >> 8);
            uStack_e = (undefined2)((uint)iVar4 >> 0x10);
          }
        }
      }
    }
    if (CONCAT22(uStack_e,CONCAT11(uStack_f,uStack_10)) == 0) goto LAB_004def09;
LAB_004deecc:
    iVar4 = CONCAT22(uStack_e,CONCAT11(uStack_f,uStack_10));
  }
  uStack_12 = *(ushort *)(iVar4 + 0x24);
LAB_004def09:
  *(ushort *)(iStack_4 + uVar10 * 2) = uStack_12;
  if (uStack_12 != 0) {
    iVar4 = (&DAT_00890390)[(short)uStack_12];
    FUN_00417ca0(iVar4 + 0x3d,0xffffffff,0);
    FUN_00504590(iVar4,0);
  }
  return;
}
