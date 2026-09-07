/* Ghidra 12.1.3 pseudocode; entry 004f5c80; FUN_004f5c80.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_004f5c80(int param_1,int param_2,undefined2 param_3)

{
  int iVar1;
  bool bVar2;

  if ((*(uint *)(param_1 + 0x596) & 2) == 0) {
    if (*(char *)(param_2 + 0x4f) == '\x14') {
      *(uint *)(param_1 + 0x596) = *(uint *)(param_1 + 0x596) | 2;
    }
    else {
      iVar1 = FUN_004f2290(param_1,param_2);
      bVar2 = false;
      if (iVar1 != 0) goto LAB_004f5cfb;
      *(uint *)(param_1 + 0x596) = *(uint *)(param_1 + 0x596) | 2;
    }
    *(char *)(param_1 + 0x5b3) = (char)(((param_2 - param_1) + -0x36) / 0x52);
    bVar2 = true;
  }
  else {
    bVar2 = ((param_2 - param_1) + -0x36) / 0x52 == (uint)*(byte *)(param_1 + 0x5b3);
  }
LAB_004f5cfb:
  if (bVar2) {
    *(undefined2 *)(param_2 + 0x42) = param_3;
  }
  return;
}
