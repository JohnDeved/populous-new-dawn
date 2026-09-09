/* Ghidra 12.1.3 pseudocode; entry 004393d0; FUN_004393d0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


/* WARNING: Removing unreachable block (ram,0x00439460) */

undefined4 FUN_004393d0(int param_1)

{
  ushort uVar1;
  undefined2 uVar2;
  short sVar3;
  undefined4 in_EAX;
  uint uVar4;
  undefined2 extraout_var;
  undefined1 uVar6;
  undefined4 uVar5;

  uVar6 = 0;
  uVar1 = *(ushort *)(param_1 + 0x76);
  uVar4 = CONCAT22((short)((uint)in_EAX >> 0x10),uVar1);
  if ((uVar1 & 0x10) != 0) {
    *(ushort *)(param_1 + 0x76) = uVar1 & 0xffef;
    FUN_004d4f40(param_1);
    sVar3 = *(short *)(param_1 + 0x5d);
    update_gs_unit_related_array_item(param_1);
    *(ushort *)(param_1 + 0x57) = sVar3 + 0x400U & 0x7ff;
    uVar4 = *(uint *)(param_1 + 0xc);
    *(uint *)(param_1 + 0xc) = uVar4 | 0x80;
    uVar4 = uVar4 | 0x1080;
    *(uint *)(param_1 + 0xc) = uVar4;
  }
  *(uint *)(param_1 + 0xc) = *(uint *)(param_1 + 0xc) | 0x8000;
  sVar3 = *(short *)(param_1 + 0x70) + -1;
  uVar5 = CONCAT22((short)(uVar4 >> 0x10),sVar3);
  *(short *)(param_1 + 0x70) = sVar3;
  if (sVar3 == 0) {
    FUN_004d4ee0(param_1);
    uVar2 = *(undefined2 *)(param_1 + 0x5d);
    uVar5 = CONCAT22(extraout_var,uVar2);
    uVar4 = *(uint *)(param_1 + 0xc);
    *(uint *)(param_1 + 0xc) = uVar4 & 0xffff7fff;
    if ((uVar4 & 0x80) != 0) {
      *(undefined2 *)(param_1 + 0x57) = uVar2;
    }
    *(undefined2 *)(param_1 + 0x5d) = uVar2;
    *(undefined2 *)(param_1 + 0x26) = uVar2;
    uVar6 = 1;
  }
  return CONCAT31((int3)((uint)uVar5 >> 8),uVar6);
}
