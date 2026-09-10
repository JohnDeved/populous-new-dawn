/* Ghidra 12.1.3 pseudocode; entry 00425060; FUN_00425060.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_00425060(int param_1)

{
  int iVar1;
  char cVar2;
  int iVar3;
  int iVar4;
  uint local_10 [4];

  cVar2 = *(char *)(param_1 + 0x9c);
  iVar3 = 0;
  do {
    iVar4 = iVar3 + 1;
    *(uint *)(&stack0xffffffec + iVar4 * 4) = iVar3 - cVar2 & 3;
    iVar3 = iVar4;
  } while (iVar4 < 4);
  iVar3 = param_1 + local_10[0] * 4;
  iVar4 = param_1 + local_10[1] * 4;
  *(undefined4 *)(iVar3 + 0x7c) = 0x200;
  iVar1 = param_1 + local_10[2] * 4;
  *(undefined4 *)(iVar4 + 0x7c) = 0x400;
  param_1 = param_1 + local_10[3] * 4;
  *(undefined4 *)(iVar1 + 0x7c) = 0x800;
  *(undefined4 *)(param_1 + 0x7c) = 0x100;
  *(undefined4 *)(iVar3 + 0x8c) = 0x1300;
  *(undefined4 *)(iVar4 + 0x8c) = 0x2600;
  *(undefined4 *)(iVar1 + 0x8c) = 0x4c00;
  *(undefined4 *)(param_1 + 0x8c) = 0x8900;
  return;
}
