/* Ghidra 12.1.3 pseudocode; entry 00575390; FUN_00575390.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


undefined1 ** __thiscall FUN_00575390(int *param_1,undefined4 param_2)

{
  int iVar1;
  undefined1 **ppuVar2;
  undefined1 *puStack_2c;
  undefined1 auStack_28 [40];

  puStack_2c = auStack_28;
  ppuVar2 = &puStack_2c;
  iVar1 = (**(code **)(*param_1 + 0x18))(ppuVar2,param_2,0);
  if (iVar1 != 0) {
    return (undefined1 **)0x0;
  }
  return ppuVar2 + 2;
}
