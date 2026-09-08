/* Ghidra 12.1.3 pseudocode; entry 0042c210; FUN_0042c210.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */

void FUN_0042c210(void)

{
  int iVar1;
  undefined2 *puVar2;
  int iVar3;
  int iVar4;
  uint uVar5;
  int local_38;
  undefined2 local_34;
  undefined2 local_32;
  int local_2c;
  int local_28;
  int local_24 [9];

  iVar4 = 0;
  iVar3 = 1;
  _DAT_00895ed9 = 0;
  do {
    iVar1 = iVar4 * 4;
    iVar3 = iVar3 + 1;
    iVar4 = iVar4 + iVar3;
    (&pnts0_mem_end)[iVar3] = &DAT_00895efd + iVar1;
  } while (iVar3 < 9);
  local_24[0] = 0;
  local_24[1] = 0;
  local_24[2] = 0x50;
  local_24[3] = 100;
  local_24[4] = 0x78;
  local_24[5] = 0x82;
  local_24[6] = 0x8c;
  local_24[7] = 0x96;
  local_24[8] = 0xa0;
  local_38 = 1;
  iVar3 = 4;
  do {
    uVar5 = 0;
    local_2c = (int)(0x800 / (longlong)local_38);
    if (3 < iVar3) {
      iVar4 = *(int *)((int)local_24 + iVar3);
      local_28 = local_38;
      puVar2 = *(undefined2 **)(&DAT_00895ed9 + iVar3);
      do {
        local_34 = 0;
        local_32 = 0;
        if (iVar4 != 0) {
          move_pos_angle_length(&local_34,uVar5,iVar4);
        }
        puVar2[2] = local_34;
        uVar5 = uVar5 + local_2c & 0x7ff;
        puVar2[3] = local_32;
        local_28 = local_28 + -1;
        puVar2 = puVar2 + 2;
      } while (local_28 != 0);
    }
    iVar3 = iVar3 + 4;
    local_38 = local_38 + 1;
  } while (iVar3 < 0x21);
  return;
}
