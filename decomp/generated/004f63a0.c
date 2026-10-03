/* Ghidra 12.1.3 pseudocode; entry 004f63a0; FUN_004f63a0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


bool FUN_004f63a0(int param_1,int param_2)

{
  int iVar1;

  if ((*(uint *)(param_1 + 0x596) & 2) != 0) {
    return ((param_2 - param_1) + -0x36) / 0x52 == (uint)*(byte *)(param_1 + 0x5b3);
  }
  if (*(char *)(param_2 + 0x4f) == '\x14') {
    *(uint *)(param_1 + 0x596) = *(uint *)(param_1 + 0x596) | 2;
    *(char *)(param_1 + 0x5b3) = (char)(((param_2 - param_1) + -0x36) / 0x52);
    return true;
  }
  iVar1 = FUN_004f2290(param_1,param_2);
  if (iVar1 != 0) {
    return false;
  }
  *(uint *)(param_1 + 0x596) = *(uint *)(param_1 + 0x596) | 2;
  *(char *)(param_1 + 0x5b3) = (char)(((param_2 - param_1) + -0x36) / 0x52);
  return true;
}
