/* Ghidra 12.1.3 pseudocode; entry 005199f0; FUN_005199f0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_005199f0(int param_1,int *param_2,uint *param_3,undefined1 *param_4)

{
  char cVar1;
  int iVar2;
  uint uVar3;
  byte local_8 [8];

  uVar3 = 0;
  local_8[4] = 0;
  local_8[5] = 0;
  local_8[6] = 0;
  local_8[7] = 0;
  cVar1 = *(char *)(param_1 + 0x68);
  local_8[0] = 0;
  local_8[1] = 0;
  local_8[2] = 0;
  local_8[3] = 0;
  if ('\x02' < cVar1) {
    iVar2 = *param_2;
    if (0 < cVar1) {
      do {
        param_2 = param_2 + 1;
        local_8[*(char *)(iVar2 + 0x2f) + 4] = local_8[*(char *)(iVar2 + 0x2f) + 4] + 1;
        local_8[*(char *)(iVar2 + 0x2f)] = (byte)uVar3;
        uVar3 = uVar3 + 1;
        iVar2 = *param_2;
      } while ((int)uVar3 < (int)cVar1);
    }
    iVar2 = (int)*(char *)(param_1 + 0x69);
    if (1 < local_8[iVar2 + 4]) {
      iVar2 = (int)*(char *)(param_1 + 0x6a);
    }
    uVar3 = (uint)local_8[iVar2];
  }
  *param_4 = (char)uVar3;
  *param_3 = (uint)*(ushort *)(param_1 + 0x70 + uVar3 * 2);
  return;
}
