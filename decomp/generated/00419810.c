/* Ghidra 12.1.3 pseudocode; entry 00419810; FUN_00419810.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_00419810(int param_1)

{
  short *psVar1;
  int iVar2;
  short sVar3;
  uint uVar4;
  undefined4 uVar5;

  psVar1 = (short *)(param_1 + 0x911);
  psVar1[0] = 0;
  psVar1[1] = 0;
  *(undefined2 *)(param_1 + 0x915) = 0;
  iVar2 = *(int *)(param_1 + 0x89d);
  uVar5 = 0;
  if (iVar2 != 0) {
    *(undefined4 *)psVar1 = *(undefined4 *)(iVar2 + 0x3d);
    *(undefined2 *)(param_1 + 0x915) = *(undefined2 *)(iVar2 + 0x41);
    uVar4 = CONCAT22((short)((uint)(iVar2 + 0x3d) >> 0x10),*psVar1) & 0xfffffe00;
    *psVar1 = (short)uVar4 + 0x100;
    uVar4 = CONCAT22((short)(uVar4 >> 0x10),*(undefined2 *)(param_1 + 0x913)) & 0xfffffe00;
    sVar3 = (short)uVar4 + 0x100;
    uVar5 = CONCAT22((short)(uVar4 >> 0x10),sVar3);
    *(short *)(param_1 + 0x913) = sVar3;
  }
  FUN_0044ff80(psVar1,CONCAT31((int3)((uint)uVar5 >> 8),*(undefined1 *)(param_1 + 0xc22)),1);
  return;
}
