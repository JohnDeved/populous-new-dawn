/* Ghidra 12.1.3 pseudocode; entry 004c2e00; FUN_004c2e00.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


int FUN_004c2e00(int param_1,undefined4 param_2)

{
  int iVar1;

  iVar1 = FUN_004c2e30(param_1,*(undefined1 *)(param_1 + 0x2f),param_2);
  return (int)(iVar1 + (iVar1 >> 0x1f & 0x1ffU)) >> 9;
}
