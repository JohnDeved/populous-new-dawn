/* Ghidra 12.1.3 pseudocode; entry 0056d9d0; FUN_0056d9d0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


int __thiscall FUN_0056d9d0(int param_1,undefined4 param_2,undefined4 param_3)

{
  int iVar1;
  undefined4 unaff_EDI;
  undefined1 local_4 [4];

  if ((*(byte *)(param_1 + 0x30) & 1) == 0) {
    return 0;
  }
  iVar1 = FUN_00570e20(param_2,param_3,local_4);
  if (iVar1 != 0) {
    FUN_0056db50(iVar1,param_3,unaff_EDI);
  }
  return iVar1;
}
