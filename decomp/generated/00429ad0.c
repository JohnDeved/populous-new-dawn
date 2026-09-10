/* Ghidra 12.1.3 pseudocode; entry 00429ad0; FUN_00429ad0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_00429ad0(void)

{
  int iVar1;
  undefined2 *puVar2;
  int iVar3;
  int iVar4;
  int local_18;
  int local_14;
  undefined2 local_10;
  undefined2 local_e;
  int local_8;
  int local_4;

  local_14 = 0;
  local_18 = 3;
  local_8 = 0x1c0;
  do {
    iVar4 = 0;
    iVar3 = 0;
    local_4 = (int)(0x11c / (longlong)(local_18 + -1));
    if (0 < local_18) {
      iVar1 = 1;
      puVar2 = (undefined2 *)(&DAT_00974048 + local_14 * 4);
      do {
        if ((undefined2 *)0x97410f < puVar2) break;
        if (iVar1 < 0) {
          iVar4 = iVar4 + local_4;
        }
        iVar3 = iVar3 + 1;
        local_10 = 0;
        local_e = 0;
        move_pos_angle_length(&local_10,iVar1 * iVar4 & 0x7ff,-(short)local_8);
        local_14 = local_14 + 1;
        *puVar2 = local_10;
        puVar2[1] = local_e;
        iVar1 = -iVar1;
        puVar2 = puVar2 + 2;
      } while (iVar3 < local_18);
    }
    local_18 = local_18 + 2;
    local_8 = local_8 + 0x100;
    if (0x31 < local_14) {
      return;
    }
  } while( true );
}
