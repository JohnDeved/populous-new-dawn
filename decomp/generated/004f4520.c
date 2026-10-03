/* Ghidra 12.1.3 pseudocode; entry 004f4520; FUN_004f4520.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_004f4520(int param_1,int param_2)

{
  undefined2 *puVar1;
  int iVar2;
  int iVar3;
  int iVar4;

  puVar1 = (undefined2 *)((int)&DAT_0089b7a5 + param_2 * 2);
  iVar2 = FUN_004f5680(param_1,*puVar1,1);
  if (iVar2 == 0) {
    iVar2 = FUN_004f7dc0(param_1,4,4,0xffffffff,1,*puVar1,0x47);
    if (iVar2 != 0) {
      iVar3 = FUN_00462730(param_1);
      if (iVar3 != -1) {
        iVar4 = FUN_004627f0(param_1,0xb,0);
        if (iVar4 != 0) {
          FUN_00462790(param_1,iVar3,0xb,*(undefined2 *)(iVar2 + 0x24),*puVar1,0,4);
          *(undefined4 *)(iVar3 * 0x52 + 0x36 + param_1) = 0;
        }
      }
    }
  }
  return;
}
