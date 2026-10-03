/* Ghidra 12.1.3 pseudocode; entry 004e5810; FUN_004e5810.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


undefined4 FUN_004e5810(int param_1,int param_2)

{
  short sVar1;
  int iVar2;
  uint uVar3;

  iVar2 = FUN_004627f0(param_1,1,0);
  if (iVar2 != 0) {
    iVar2 = FUN_004f2260(param_1);
    if (iVar2 != 0) {
      sVar1 = *(short *)(param_1 + 0x5ae);
      if (sVar1 == 0) {
        sVar1 = FUN_004f6020(param_1);
      }
      uVar3 = (uint)*(byte *)(param_1 + 0x5bb);
      FUN_00462790(param_1,param_2,1,sVar1,(uVar3 - 1) * uVar3 * 4,
                   ((1 - uVar3) * uVar3 +
                   (*(byte *)(param_1 + 0x5bc) + 1) * (uint)*(byte *)(param_1 + 0x5bc)) * 4 + -1,0);
      *(undefined1 *)(param_2 * 0x52 + 0x42 + param_1) = 1;
      return 1;
    }
  }
  return 0;
}
