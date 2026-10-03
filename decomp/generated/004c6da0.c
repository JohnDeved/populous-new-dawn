/* Ghidra 12.1.3 pseudocode; entry 004c6da0; FUN_004c6da0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_004c6da0(int param_1,int param_2)

{
  ushort *puVar1;
  char cVar2;
  byte bVar3;
  ushort uVar4;
  int iVar5;
  uint uVar6;
  uint uVar7;
  undefined4 uVar8;
  int iVar9;
  ushort *puVar10;
  ushort local_1a;
  undefined1 local_8;
  undefined1 uStack_7;
  undefined2 local_6;
  undefined1 uStack_5;
  int local_4;

  puVar1 = (ushort *)(param_2 * 0x52 + 0x36 + param_1);
  switch(puVar1[0x21]) {
  case 0:
    puVar1[0x21] = 2;
    *(char *)((int)puVar1 + 9) = (char)puVar1[0x19];
    *puVar1 = (ushort)*(undefined4 *)(puVar1 + 0x1b);
    puVar1[2] = 0;
    cVar2 = (&DAT_00960808)[*(char *)(param_1 + 0xc22) * 0x30];
    *(char *)(puVar1 + 8) = cVar2;
    if (cVar2 == '\0') {
      *(undefined1 *)(puVar1 + 8) = 1;
    }
    else {
      uVar6 = DAT_0089d178 * 0x24a1 + 0x24df;
      uVar7 = uVar6 >> 0xd;
      DAT_0089d178 = uVar7 | uVar6 * 0x80000;
      *(byte *)(puVar1 + 8) = (byte)uVar7 & 3;
    }
    cVar2 = *(char *)((int)puVar1 + 9);
    if (cVar2 == '\x04') {
      if ((*(int *)(puVar1 + 0x1d) == 0) && (iVar9 = FUN_004f5270(param_1), iVar9 != 0)) {
        *puVar1 = *(ushort *)(param_1 + 0x5a4);
      }
      puVar1[1] = 2000;
      uVar7 = DAT_0089d178 * 0x24a1 + 0x24df;
      DAT_0089d178 = uVar7 >> 0xd | uVar7 * 0x80000;
    }
    else {
      if (('\f' < cVar2) && (cVar2 < '\x0f')) {
        puVar1[1] = 0xdac;
        *(undefined1 *)(puVar1 + 7) = 0;
        *(undefined1 *)(puVar1 + 5) = 10;
        *(undefined1 *)((int)puVar1 + 0xf) = 1;
        goto switchD_004c6dca_caseD_2;
      }
      puVar1[1] = 2000;
      uVar7 = DAT_0089d178 * 0x24a1 + 0x24df;
      DAT_0089d178 = uVar7 >> 0xd | uVar7 * 0x80000;
    }
    *(byte *)(puVar1 + 7) = (byte)DAT_0089d178 & 3;
    *(undefined1 *)(puVar1 + 5) = 0x28;
    *(undefined1 *)((int)puVar1 + 0xf) = 0;
  case 2:
switchD_004c6dca_caseD_2:
    iVar9 = FUN_004f7aa0(param_1,puVar1,(char)puVar1[7]);
    if (iVar9 == 1) {
      if (*(char *)((int)puVar1 + 9) != '\x04') {
        puVar1[0x21] = 4;
        *(undefined1 *)(puVar1 + 6) = 0;
        return;
      }
      puVar1[0x21] = 3;
      return;
    }
    if (iVar9 != 2) {
      return;
    }
    puVar1[0x21] = 9;
    *(undefined1 *)((int)puVar1 + 0xb) = 0;
    break;
  case 3:
    if ((*(int *)(puVar1 + 0x1d) == 0) && (*(char *)(param_1 + 0x5b4) == '\0')) {
      iVar9 = 0;
      if ((((&DAT_008a03ec)[((*puVar1 & 0xfe) * 2 | *puVar1 & 0xfe00) * 2] & 0x3ff) != 0) &&
         ((iVar5 = (&DAT_00890390)
                   [(&DAT_008a03ec)[((*puVar1 & 0xfe) * 2 | *puVar1 & 0xfe00) * 2] & 0x3ff],
          (*(byte *)(iVar5 + 0xc) & 1) == 0 && (*(char *)(iVar5 + 0x2a) != '\0')))) {
        iVar9 = iVar5;
      }
      if (iVar9 != 0) {
        FUN_004b9fc0(iVar9,&local_8);
        *(undefined1 *)(param_1 + 0x36c) = 0;
        *(undefined1 *)(param_1 + 0x5b4) = 1;
        local_1a = CONCAT11(uStack_5,uStack_7) & 0xfefe;
        *(ushort *)(param_1 + 0x36a) = local_1a;
      }
    }
    puVar1[0x21] = 4;
    *(undefined1 *)(puVar1 + 6) = 0;
    return;
  case 4:
    FUN_004f5c80(param_1,puVar1,5);
    return;
  case 5:
    uVar8 = FUN_004f5d20(param_1,(int)*(char *)((int)puVar1 + 9),&DAT_00a0d108);
    local_4 = FUN_004f8490(param_1,2,2,0xffffffff,1,*puVar1,0,uVar8);
    if (local_4 == 0) {
      puVar1[0x21] = 9;
      return;
    }
    *(char *)(puVar1 + 6) = (char)puVar1[6] + (char)local_4;
    if (0 < local_4) {
      puVar10 = &DAT_00a0d10a;
      do {
        iVar9 = (&DAT_00890390)[*puVar10];
        if ((*(byte *)(iVar9 + 0xe) & 0x10) == 0) {
          *(undefined1 *)(iVar9 + 0x7d) = *(undefined1 *)(iVar9 + 0x2c);
          FUN_004ed6f0(iVar9);
          *(undefined1 *)(iVar9 + 0x2c) = 0xe;
          FUN_004ed640(iVar9);
        }
        puVar10 = puVar10 + 2;
        local_4 = local_4 + -1;
      } while (local_4 != 0);
    }
    puVar1[0x21] = 6;
    *(undefined1 *)(param_1 + 0x5b1) = 0x14;
    return;
  case 6:
    FUN_004f5d10(param_1,puVar1,7);
    return;
  case 7:
    uVar4 = *puVar1;
    iVar9 = (&DAT_00890390)
            [(ushort)(&DAT_008a03ec)[((uVar4 & 0xfe) * 2 | uVar4 & 0xfe00) * 2] & 0x3ff];
    if (iVar9 == 0) {
      FUN_004f65e0(param_1);
      puVar1[0x21] = 9;
      *(undefined1 *)((int)puVar1 + 0xb) = 0;
      return;
    }
    if (*(char *)(iVar9 + 0x2a) == '\x02') {
      puVar10 = (ushort *)(iVar9 + 0x82);
      iVar9 = 0;
      if (((*puVar10 != 0) && (iVar5 = (&DAT_00890390)[*puVar10], (*(byte *)(iVar5 + 0xc) & 1) == 0)
          ) && (*(char *)(iVar5 + 0x2a) != '\0')) {
        iVar9 = iVar5;
      }
      if (iVar9 == 0) {
        FUN_004f65e0(param_1);
        puVar1[0x21] = 9;
        *(undefined1 *)((int)puVar1 + 0xb) = 0;
        return;
      }
    }
    FUN_00435730(param_1,6,CONCAT22((short)((uint)iVar9 >> 0x10),*(undefined2 *)(iVar9 + 0x24)),
                 CONCAT22((short)((uint)(param_2 * 0x52) >> 0x10),uVar4));
    FUN_004f6440(param_1,puVar1);
    FUN_004359b0(param_1,0xffffffff,0xffffffff,0xffffffff);
    FUN_00418ce0(param_1,0xe);
    puVar1[0x21] = 8;
    *(undefined1 *)((int)puVar1 + 0xd) = 0;
    *(undefined1 *)(puVar1 + 4) = 0;
    puVar1[3] = 0;
    return;
  case 8:
    iVar9 = (&DAT_00890390)
            [(ushort)(&DAT_008a03ec)[((*puVar1 & 0xfe) * 2 | *puVar1 & 0xfe00) * 2] & 0x3ff];
    if ((iVar9 == 0) || (*(char *)(param_1 + 0xc22) != *(char *)(iVar9 + 0x2f))) {
      puVar1[0x21] = 9;
      *(undefined1 *)((int)puVar1 + 0xb) = 0;
      return;
    }
    if (*(char *)(iVar9 + 0x2a) == '\x02') {
      if (*(char *)(iVar9 + 0x2c) != '\x01') {
        puVar1[0x21] = 9;
        *(undefined1 *)((int)puVar1 + 0xb) = 1;
        return;
      }
      if ((char)puVar1[4] == *(char *)(iVar9 + 0x78)) {
        FUN_004f6320(param_1,puVar1);
      }
      else {
        *(char *)(puVar1 + 4) = *(char *)(iVar9 + 0x78);
        puVar1[3] = 0;
      }
      iVar9 = (&DAT_00890390)[*(short *)(iVar9 + 0x82)];
    }
    else {
      FUN_004f6320(param_1,puVar1);
    }
    bVar3 = *(byte *)(iVar9 + 0x9a);
    iVar9 = FUN_004f5d20(param_1,(int)*(char *)((int)puVar1 + 9));
    if ((int)(uint)bVar3 < iVar9) {
      if (*(byte *)((int)puVar1 + 0xd) < 0x10) {
        *(byte *)((int)puVar1 + 0xd) = *(byte *)((int)puVar1 + 0xd) + 1;
        return;
      }
      puVar1[0x21] = 4;
      *(byte *)(puVar1 + 6) = bVar3;
      return;
    }
    break;
  case 9:
    if ((&DAT_00890390)
        [(ushort)(&DAT_008a03ec)[((*puVar1 & 0xfe) * 2 | *puVar1 & 0xfe00) * 2] & 0x3ff] != 0) {
      FUN_004f6840(param_1,puVar1);
      FUN_00462770(puVar1);
      return;
    }
    FUN_004f6840(param_1,puVar1);
    FUN_00462770(puVar1);
    return;
  }
  return;
}
