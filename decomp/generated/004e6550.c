/* Ghidra 12.1.3 pseudocode; entry 004e6550; FUN_004e6550.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_004e6550(int param_1,int param_2,undefined4 param_3,undefined4 param_4,undefined4 param_5,
                 undefined1 param_6)

{
  int iVar1;
  int iVar2;
  int *piVar3;
  short *psVar4;
  int iVar5;
  int local_10 [4];

  iVar2 = get_tribe_sub_struct(param_1);
  if (iVar2 != -1) {
    set_sub_struct(param_1,iVar2,0x18,0,0,0,0);
    local_10[0] = param_2;
    local_10[1] = param_3;
    local_10[2] = param_4;
    local_10[3] = param_5;
    iVar5 = 0;
    psVar4 = (short *)(iVar2 * 0x52 + 0x3e + param_1);
    iVar2 = iVar2 * 0x52 + param_1;
    piVar3 = local_10;
    do {
      *psVar4 = -1;
      iVar1 = *piVar3;
      if (iVar1 != -1) {
        *psVar4 = (short)*(char *)(param_1 + 0x476 + iVar1 * 8);
        iVar1 = param_1 + iVar1 * 8;
        psVar4[4] = (short)*(char *)(iVar1 + 0x477);
        *(undefined1 *)(iVar2 + 0x4e + iVar5) = *(undefined1 *)(iVar1 + 0x478);
        *(undefined1 *)(iVar2 + 0x52 + iVar5) = *(undefined1 *)(iVar1 + 0x479);
        *(undefined1 *)(iVar2 + 0x56 + iVar5) = *(undefined1 *)(iVar1 + 0x47a);
        *(undefined1 *)(iVar2 + 0x5a + iVar5) = *(undefined1 *)(iVar1 + 0x47b);
      }
      psVar4 = psVar4 + 1;
      piVar3 = piVar3 + 1;
      iVar5 = iVar5 + 1;
    } while (piVar3 < &stack0x00000000);
    *(undefined1 *)(iVar2 + 0x5f) = 0;
    *(undefined1 *)(iVar2 + 0x60) = param_6;
    *(undefined4 *)(iVar2 + 0x36) = 0xffffffff;
  }
  return;
}
