/* Ghidra 12.1.3 pseudocode; entry 004e5b60; FUN_004e5b60.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


undefined4 FUN_004e5b60(int param_1,undefined4 param_2)

{
  undefined2 uVar1;
  int iVar2;
  char cVar3;

  iVar2 = FUN_004627f0(param_1,9,0);
  if (iVar2 != 0) {
    iVar2 = FUN_004f52b0(param_1);
    if (iVar2 == 0) {
      uVar1 = FUN_004f6020(param_1);
      if (*(char *)(param_1 + 0x5b4) == '\0') {
        cVar3 = '\a';
      }
      else {
        cVar3 = *(char *)(param_1 + 0x36c);
        if (cVar3 == '\0') {
          cVar3 = '\x01';
        }
      }
    }
    else {
      cVar3 = *(char *)(param_1 + 0x5b8);
      uVar1 = *(undefined2 *)((int)&DAT_0089b7a5 + (uint)*(byte *)(param_1 + 0x5b7) * 2);
    }
    FUN_00462790(param_1,param_2,9,cVar3,uVar1,0,0);
    return 1;
  }
  return 0;
}
