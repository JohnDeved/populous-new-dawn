/* Ghidra 12.1.3 pseudocode; entry 0050ccd0; FUN_0050ccd0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_0050ccd0(int param_1)

{
  int iVar1;
  uint uVar2;
  uint uVar3;
  uint uVar4;
  undefined4 *puVar5;
  short sVar6;
  uint uVar7;
  int iVar8;
  undefined2 local_c;
  int local_4;

  local_4 = 0x20;
  sVar6 = 0x5a;
  uVar7 = 2;
  iVar8 = 0;
  local_c = 0x3c;
  if ((*(uint *)(param_1 + 0xc) & 0x400) == 0) {
    puVar5 = (undefined4 *)0x0;
  }
  else {
    *(uint *)(param_1 + 0xc) = *(uint *)(param_1 + 0xc) & 0xfffffbff;
    DAT_00892443 = DAT_00892443 + -5;
    puVar5 = DAT_00892443;
  }
  if (puVar5 != (undefined4 *)0x0) {
    local_c = (undefined2)*puVar5;
    uVar7 = puVar5[1];
    sVar6 = (short)puVar5[3];
    iVar8 = puVar5[4];
    local_4 = puVar5[2];
  }
  *(short *)(param_1 + 0x41) = *(short *)(param_1 + 0x41) + sVar6;
  sVar6 = (short)uVar7;
  if (0 < local_4) {
    do {
      iVar1 = FUN_004ed8a0(7,3,*(undefined1 *)(param_1 + 0x2f),param_1 + 0x3d);
      if (iVar1 != 0) {
        if ((*(byte *)(param_1 + 0x11) & 1) == 0) {
          *(uint *)(iVar1 + 0x10) = *(uint *)(iVar1 + 0x10) & 0xfffffeff;
        }
        if (iVar8 == 1) {
          *(short *)(iVar1 + 0x6c) = sVar6 + 1;
        }
        else if (iVar8 == 2) {
          *(short *)(iVar1 + 0x6c) = sVar6 + 1;
          FUN_004ee700(iVar1 + 0x33,0x2b,0x4ba);
        }
        else {
          uVar2 = DAT_0089d178 * 0x24a1 + 0x24df;
          DAT_0089d178 = uVar2 >> 0xd | uVar2 * 0x80000;
          *(short *)(iVar1 + 0x6c) = (short)(DAT_0089d178 % uVar7) + 1;
        }
        *(undefined2 *)(iVar1 + 0x5f) = local_c;
        uVar3 = DAT_0089d178 * 0x24a1 + 0x24df;
        uVar2 = uVar3 >> 0xd;
        uVar4 = (uVar2 | uVar3 * 0x80000) * 0x24a1 + 0x24df;
        uVar3 = uVar4 >> 0xd;
        DAT_0089d178 = uVar3 | uVar4 * 0x80000;
        *(ushort *)(iVar1 + 0x57) = (ushort)uVar3 & 0x7ff;
        *(ushort *)(iVar1 + 0x59) = (ushort)uVar2 & 0x7ff;
        uVar2 = *(uint *)(iVar1 + 0xc);
        *(uint *)(iVar1 + 0xc) = uVar2 | 0x1000;
        *(uint *)(iVar1 + 0xc) = uVar2 | 0x1080;
      }
      local_4 = local_4 + -1;
    } while (local_4 != 0);
  }
  *(short *)(param_1 + 0x6c) = sVar6;
  if ((*(byte *)(param_1 + 0xe) & 0x10) == 0) {
    FUN_004ed6f0(param_1);
    *(undefined1 *)(param_1 + 0x2c) = 8;
  }
  return;
}
