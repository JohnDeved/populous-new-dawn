/* Ghidra 12.1.3 pseudocode; entry 004f3280; FUN_004f3280.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_004f3280(int param_1)

{
  int iVar1;
  uint uVar2;
  char *pcVar3;
  ushort local_6;
  short local_4;
  ushort local_2;

  if (*(char *)(param_1 + 0x5b4) == '\0') {
    local_2 = *(ushort *)(param_1 + 0x5a2);
  }
  else {
    local_2 = *(ushort *)(param_1 + 0x36a);
  }
  local_6 = local_2 & 0xfffe;
  local_4 = local_6 << 8;
  local_2 = local_2 & 0xfe00;
  for (iVar1 = *(int *)(param_1 + 0x881); iVar1 != 0; iVar1 = *(int *)(iVar1 + 8)) {
    if ((*(char *)(iVar1 + 0x2c) == '\n') || (*(char *)(iVar1 + 0x2c) == '!')) {
      pcVar3 = (char *)0x0;
      uVar2 = (uint)*(ushort *)(iVar1 + 0x9b);
      if ((uVar2 != 0) ||
         (uVar2 = (uint)*(ushort *)(iVar1 + 0x8b + (uint)*(byte *)(iVar1 + 0xa6) * 2), uVar2 != 0))
      {
        pcVar3 = &DAT_00938830 + uVar2 * 10;
      }
      if (((pcVar3 != (char *)0x0) && ((pcVar3[1] & 1U) == 0)) && (*pcVar3 == '\x1e')) {
        FUN_0043b2a0(iVar1,&local_4);
      }
    }
  }
  return;
}
