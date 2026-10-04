/* Ghidra 12.1.3 pseudocode; entry 004c5cf0; FUN_004c5cf0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_004c5cf0(int param_1,int param_2)

{
  undefined2 *puVar1;
  uint uVar2;
  int iVar3;
  int iVar4;
  uint uVar5;

  puVar1 = (undefined2 *)(param_2 * 0x52 + 0x36 + param_1);
  switch(puVar1[0x21]) {
  case 0:
    break;
  default:
    return;
  case 2:
    goto switchD_004c5d1a_caseD_2;
  case 3:
    if (puVar1[5] != 0) {
      if ((&DAT_009607f9)[*(char *)(param_1 + 0xc22) * 0x30] != '\0') {
        *(uint *)(param_1 + 0x596) = *(uint *)(param_1 + 0x596) | 4;
      }
      *(uint *)(param_1 + 0x596) = *(uint *)(param_1 + 0x596) | 8;
      iVar3 = FUN_00462730(param_1);
      if ((iVar3 != -1) && (iVar4 = FUN_004627f0(param_1,8,0), iVar4 != 0)) {
        FUN_00462790(param_1,iVar3,8,puVar1[5],puVar1[6],0,0);
        iVar3 = iVar3 * 0x52;
        iVar4 = iVar3 + 0x36 + param_1;
        FUN_004f4030(param_1,iVar4,CONCAT22((short)((uint)iVar3 >> 0x10),puVar1[6]),4,1);
        if (*(short *)(iVar3 + param_1 + 0x58) == 0) {
          FUN_00462770(iVar4);
        }
      }
    }
    if ((((*(uint *)(param_1 + 0x596) & 8) == 0) &&
        (*(uint *)(param_1 + 0x596) = *(uint *)(param_1 + 0x596) & 0xfffffffb,
        (&DAT_00960809)[*(char *)(param_1 + 0xc22) * 0x30] != '\0')) &&
       (iVar3 = FUN_00462730(param_1), iVar3 != -1)) {
      uVar5 = DAT_0089d178 * 0x24a1 + 0x24df;
      uVar2 = uVar5 >> 0xd;
      DAT_0089d178 = uVar2 | uVar5 * 0x80000;
      if ((uVar2 & 1) == 0) {
        iVar4 = FUN_004627f0(param_1,0xf,0);
        if (iVar4 != 0) {
          FUN_00462790(param_1,iVar3,0xf,0,0,0,2);
        }
      }
      else {
        iVar4 = FUN_004627f0(param_1,0xb,0);
        if (iVar4 != 0) {
          FUN_00462790(param_1,iVar3,0xb,0,0,1,2);
          puVar1[0x21] = 5;
          return;
        }
      }
    }
    puVar1[0x21] = 5;
    return;
  case 5:
    FUN_004f6840(param_1,puVar1);
    FUN_00462770(puVar1);
    return;
  }
  puVar1[1] = (puVar1[0x19] + 1) * puVar1[0x19] * 4 + -1;
  *puVar1 = (short)*(undefined4 *)(puVar1 + 0x1b);
  puVar1[0x21] = 2;
  *(uint *)(param_1 + 0x596) = *(uint *)(param_1 + 0x596) & 0xfffffff7;
  *(undefined1 *)(puVar1 + 7) = 0x32;
  puVar1[5] = 0;
  *(undefined1 *)((int)puVar1 + 0x11) = 0;
  puVar1[2] = 0;
  *(undefined1 *)(puVar1 + 8) = 0;
switchD_004c5d1a_caseD_2:
  iVar3 = FUN_004f8e10(param_1,puVar1);
  if (iVar3 == 2) {
    puVar1[0x21] = 3;
    return;
  }
  if (iVar3 < 0xc) {
    return;
  }
  if (iVar3 < 0xe) {
    if (puVar1[5] != 0) {
      return;
    }
    puVar1[5] = puVar1[3];
    puVar1[6] = puVar1[4];
    puVar1[0x21] = 3;
    return;
  }
  return;
}
