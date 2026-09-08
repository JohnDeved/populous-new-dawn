/* Ghidra 12.1.3 pseudocode; entry 00462ea0; FUN_00462ea0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_00462ea0(int param_1,uint param_2,uint param_3)

{
  uint uVar1;
  char cVar2;
  int iVar3;
  uint local_10;
  uint local_c;

  cVar2 = *(char *)(param_3 * 0x100 + param_2 + param_1);
  while (cVar2 == '\0') {
    *(undefined1 *)(param_3 * 0x100 + param_2 + param_1) = 1;
    iVar3 = *(int *)(&DAT_00749ee8 + ((param_2 | param_3) & 0xff) * 4);
    uVar1 = (iVar3 - *(int *)(&DAT_00749ee8 + (param_2 & param_3 & 0xff) * 4) >> 0x1f) + 1 +
            iVar3 * 2;
    iVar3 = 1 << ((byte)((int)uVar1 >> 1) & 0x1f);
    if ((uVar1 & 1) == 0) {
      local_10 = param_3 - iVar3 & 0x7f;
      local_c = param_2;
      if ((*(int *)(&DAT_00749ee8 + (param_2 & 0xff | local_10) * 4) -
           *(int *)(&DAT_00749ee8 + (param_2 & local_10) * 4) >> 0x1f) +
          *(int *)(&DAT_00749ee8 + (param_2 & 0xff | local_10) * 4) * 2 != uVar1) {
        local_c = param_2 - iVar3 & 0x7f;
        local_10 = param_3;
      }
    }
    else {
      local_c = param_2 - iVar3 & 0x7f;
      local_10 = param_3 - iVar3 & 0x7f;
      if ((*(int *)(&DAT_00749ee8 + (local_10 | local_c) * 4) -
           *(int *)(&DAT_00749ee8 + (local_10 & local_c) * 4) >> 0x1f) +
          *(int *)(&DAT_00749ee8 + (local_10 | local_c) * 4) * 2 != uVar1) {
        local_c = iVar3 + param_2 & 0x7f;
      }
    }
    FUN_00462ea0(param_1,local_c,local_10);
    iVar3 = *(int *)(&DAT_00749ee8 + ((param_2 | param_3) & 0xff) * 4);
    uVar1 = (iVar3 - *(int *)(&DAT_00749ee8 + (param_2 & param_3 & 0xff) * 4) >> 0x1f) + 1 +
            iVar3 * 2;
    iVar3 = 1 << ((byte)((int)uVar1 >> 1) & 0x1f);
    if ((uVar1 & 1) == 0) {
      local_10 = param_3 + iVar3 & 0x7f;
      local_c = param_2;
      if ((*(int *)(&DAT_00749ee8 + (param_2 & 0xff | local_10) * 4) -
           *(int *)(&DAT_00749ee8 + (param_2 & local_10) * 4) >> 0x1f) +
          *(int *)(&DAT_00749ee8 + (param_2 & 0xff | local_10) * 4) * 2 != uVar1) {
        local_c = iVar3 + param_2 & 0x7f;
        local_10 = param_3;
      }
    }
    else {
      local_c = param_2 - iVar3 & 0x7f;
      local_10 = param_3 + iVar3 & 0x7f;
      if ((*(int *)(&DAT_00749ee8 + (local_10 | local_c) * 4) -
           *(int *)(&DAT_00749ee8 + (local_10 & local_c) * 4) >> 0x1f) +
          *(int *)(&DAT_00749ee8 + (local_10 | local_c) * 4) * 2 != uVar1) {
        local_c = iVar3 + param_2 & 0x7f;
      }
    }
    param_2 = local_c;
    param_3 = local_10;
    cVar2 = *(char *)(local_10 * 0x100 + param_1 + local_c);
  }
  return;
}
