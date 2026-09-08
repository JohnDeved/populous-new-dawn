/* Ghidra 12.1.3 pseudocode; entry 00475350; FUN_00475350.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_00475350(short param_1,undefined2 param_2,byte param_3,byte param_4)

{
  uint uVar1;
  undefined1 uVar2;
  uint uVar3;
  int iVar4;
  uint uVar5;
  short sVar6;
  short sVar7;
  undefined4 unaff_EDI;
  undefined4 uVar8;
  undefined2 uStack_18;
  undefined4 local_4;

  if (4 < param_4) {
    uVar3 = pseudo_random * 0x24a1 + 0x24df;
    uVar1 = uVar3 >> 0xd;
    uVar3 = (uVar1 | uVar3 * 0x80000) * 0x24a1 + 0x24df;
    pseudo_random = uVar3 >> 0xd | uVar3 * 0x80000;
    param_4 = param_4 >> 1;
    iVar4 = (uint)param_4 + pseudo_random % (uint)param_4;
    DAT_005da07c = (int)((uint)param_3 * 7) >> 3;
    uVar2 = (undefined1)DAT_005da07c;
    if (iVar4 != 0) {
      uVar8 = CONCAT22((short)((uint)unaff_EDI >> 0x10),param_2);
      local_4 = (iVar4 + 0xbU) / 0xc;
      do {
        if ((uVar1 & 1) == 0) {
          uVar3 = pseudo_random * 0x24a1 + 0x24df;
          pseudo_random = uVar3 >> 0xd | uVar3 * 0x80000;
          sVar6 = -(short)((ulonglong)pseudo_random % 0xc);
        }
        else {
          uVar3 = pseudo_random * 0x24a1 + 0x24df;
          pseudo_random = uVar3 >> 0xd | uVar3 * 0x80000;
          sVar6 = (short)((ulonglong)pseudo_random % 0xc);
        }
        iVar4 = (int)param_1;
        param_1 = param_1 + sVar6;
        sVar7 = (short)uVar8;
        uVar8 = CONCAT22((short)((uint)uVar8 >> 0x10),sVar7 + 0xc);
        set_texture_5(iVar4,(int)sVar7,sVar6 + iVar4,sVar7 + 0xc,DAT_005da07c << 0x18 | 0xffffff,2,
                      (DAT_005d3d2c == 0) - 1 & 0x992ff0,2);
        uVar5 = pseudo_random * 0x24a1 + 0x24df;
        uVar3 = uVar5 >> 0xd;
        pseudo_random = uVar3 | uVar5 * 0x80000;
        uStack_18 = (undefined2)uVar3;
        if ((uVar3 & 3) == 0) {
          FUN_00475350(param_1,uVar8,CONCAT22(uStack_18,CONCAT11((char)uVar1,uVar2)) & 0xffff01ff,
                       param_4);
        }
        local_4 = local_4 - 1;
      } while (local_4 != 0);
    }
  }
  return;
}
