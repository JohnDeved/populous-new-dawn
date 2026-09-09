/* Ghidra 12.1.3 pseudocode; entry 004ba260; FUN_004ba260.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_004ba260(int param_1,int *param_2,int *param_3,int *param_4)

{
  int iVar1;
  uint uVar2;

  for (uVar2 = (uint)*(byte *)(param_1 + 0x9a); uVar2 != 0; uVar2 = uVar2 - 1) {
    iVar1 = *param_2;
    if (*(char *)(iVar1 + 0x2c) == '\n') {
      if (*(byte *)(iVar1 + 0x2d) == 2) {
        if (*(char *)(iVar1 + 0xaa) == '\0') {
          param_3[2] = param_3[2] + 1;
          *param_4 = *param_2;
          param_4 = param_4 + 1;
        }
        else {
          *param_3 = *param_3 + 1;
        }
      }
      else {
        param_3[*(byte *)(iVar1 + 0x2d)] = param_3[*(byte *)(iVar1 + 0x2d)] + 1;
      }
    }
    param_2 = param_2 + 1;
  }
  return;
}
