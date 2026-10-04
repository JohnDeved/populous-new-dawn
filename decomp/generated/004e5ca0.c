/* Ghidra 12.1.3 pseudocode; entry 004e5ca0; FUN_004e5ca0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


undefined4 FUN_004e5ca0(int param_1,undefined4 param_2)

{
  byte bVar1;
  bool bVar2;
  char cVar3;
  int iVar4;
  int iVar5;
  int iVar6;
  uint uVar7;
  short *psVar8;
  byte *pbVar9;
  uint uVar10;
  uint uVar11;
  uint uStack_10;
  short asStack_8 [4];

  asStack_8[0] = 1;
  asStack_8[1] = 1;
  asStack_8[2] = 1;
  asStack_8[3] = 1;
  uVar10 = 0;
  iVar4 = FUN_004627f0(param_1,0x10,0);
  if (iVar4 != 0) {
    iVar4 = 0;
    do {
      iVar5 = FUN_00408dd0((int)*(short *)((int)&DAT_005d5518 + iVar4),
                           (int)*(char *)(param_1 + 0xc22));
      if ((iVar5 == 0) ||
         (iVar5 = FUN_004f6a90(param_1,(int)*(short *)((int)&DAT_005d5528 + iVar4)), iVar5 == 0)) {
LAB_004e5d54:
        *(undefined2 *)((int)asStack_8 + iVar4) = 0;
      }
      else {
        iVar5 = *(char *)(param_1 + 0xc22) * 0x30;
        if ((*(char *)((int)&DAT_009607ea + iVar5 + *(short *)((int)&DAT_005d5520 + iVar4)) == '\0')
           || (bVar1 = *(byte *)((int)&DAT_009607ea + *(short *)((int)&DAT_005d5520 + iVar4) + iVar5
                                ), iVar5 = *(int *)(param_1 + 0x91d),
              iVar6 = FUN_004f6af0(param_1,(int)*(short *)((int)&DAT_005d5528 + iVar4)),
              iVar5 / (int)(uint)bVar1 < iVar6)) goto LAB_004e5d54;
      }
      iVar4 = iVar4 + 2;
    } while (iVar4 < 8);
    psVar8 = asStack_8;
    do {
      if (*psVar8 != 0) {
        uVar10 = uVar10 + 1;
      }
      psVar8 = psVar8 + 1;
    } while (psVar8 < &stack0x00000000);
    if (0 < (int)uVar10) {
      uVar7 = DAT_0089d178 * 0x24a1 + 0x24df;
      DAT_0089d178 = uVar7 >> 0xd | uVar7 * 0x80000;
      uVar7 = 0;
      uVar10 = DAT_0089d178 % uVar10;
      psVar8 = asStack_8;
      do {
        uVar11 = uVar10;
        if ((*psVar8 != 0) && (uVar11 = uVar10 - 1, uVar10 = uVar7, uVar11 == 0xffffffff)) break;
        uVar10 = uVar11;
        psVar8 = psVar8 + 1;
        uVar7 = uVar7 + 1;
      } while (psVar8 < &stack0x00000000);
      iVar4 = FUN_004f67b0(param_1);
      if ((int)(uint)(byte)(&DAT_005a7248)[(short)(&DAT_005d5518)[uVar10] * 0x4c] <= iVar4) {
        uStack_10 = 0xffffffff;
        for (iVar4 = *(int *)(param_1 + 0x885); iVar4 != 0; iVar4 = *(int *)(iVar4 + 8)) {
          if ((ushort)*(byte *)(iVar4 + 0x2b) == (&DAT_005d5518)[uVar10]) {
            bVar2 = false;
            iVar5 = 0;
            pbVar9 = (byte *)(param_1 + 0x74);
            do {
              if ((((*pbVar9 & 1) != 0) && (pbVar9[0x11] == 0x10)) &&
                 ((uint)*(ushort *)(iVar4 + 0x24) == *(uint *)(pbVar9 + -0xc))) {
                bVar2 = true;
                break;
              }
              pbVar9 = pbVar9 + 0x52;
              iVar5 = iVar5 + 1;
            } while (iVar5 < 10);
            if (((*(char *)(iVar4 + 0x2c) != '\x02') || (cVar3 = FUN_0043d690(iVar4), cVar3 != '\0')
                ) || (*(char *)(iVar4 + 0xa6) != '\0')) {
              bVar2 = true;
            }
            if (!bVar2) {
              uStack_10 = (uint)*(ushort *)(iVar4 + 0x24);
              break;
            }
          }
        }
        if (uStack_10 != 0xffffffff) {
          FUN_00462790(param_1,param_2,0x10,uStack_10,0,0,0);
          return 1;
        }
      }
    }
  }
  return 0;
}
