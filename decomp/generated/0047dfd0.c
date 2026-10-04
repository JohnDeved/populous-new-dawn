/* Ghidra 12.1.3 pseudocode; entry 0047dfd0; FUN_0047dfd0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void __thiscall
FUN_0047dfd0(int param_1,undefined4 param_2,undefined4 param_3,undefined4 param_4,undefined4 param_5
            ,undefined4 param_6,undefined4 param_7,int param_8,ushort param_9,undefined4 param_10,
            uint param_11)

{
  uint *puVar1;
  undefined4 *puVar2;
  int iVar3;
  int iVar4;

  if ((*(int *)((uint)param_9 * 0x24 + 0x14 + *(int *)(param_8 + 4)) != 0) &&
     (puVar2 = *(undefined4 **)(param_1 + 0x20002a), puVar2 <= (undefined4 *)(param_1 + 0x1ff82aU)))
  {
    if (puVar2 != (undefined4 *)0x0) {
      puVar2[7] = 0;
      *puVar2 = &PTR_LAB_0058f500;
      puVar2[1] = 0;
      *puVar2 = &PTR_FUN_0058f528;
      puVar2[8] = 0;
      *(undefined4 *)((int)puVar2 + 0x56) = 0;
    }
    iVar3 = *(int *)(param_1 + 0x20002a);
    iVar4 = FUN_004f95a0(param_2,param_3,param_4,param_5,param_8,param_9,param_10,param_6,param_7);
    puVar1 = (uint *)(iVar3 + 0x20);
    *puVar1 = *puVar1 | param_11;
    *(short *)(param_1 + 0x1c) = *(short *)(param_1 + 0x1c) + 1;
    *(int *)(param_1 + 0x20002a) = *(int *)(param_1 + 0x20002a) + iVar4;
  }
  return;
}
