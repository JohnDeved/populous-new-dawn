/* Ghidra 12.1.3 pseudocode; entry 0044f220; FUN_0044f220.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


undefined4 FUN_0044f220(undefined2 param_1,short param_2,undefined4 param_3)

{
  ushort uVar1;
  bool bVar2;
  ushort uVar3;
  undefined4 in_EAX;
  uint uVar4;
  uint uVar5;
  int iVar6;
  int iVar7;
  undefined2 local_4;
  undefined2 local_2;

  bVar2 = true;
  local_4._0_1_ = (char)param_1;
  local_4._0_1_ = (char)local_4 + -2;
  local_4._1_1_ = (char)((ushort)param_1 >> 8);
  local_4 = CONCAT11(local_4._1_1_ + -2,(char)local_4);
  iVar7 = 3;
  uVar5 = CONCAT22((short)((uint)in_EAX >> 0x10),local_4);
  local_2 = local_4;
  do {
    if (!bVar2) break;
    iVar6 = 3;
    do {
      if (bVar2 == false) break;
      uVar4 = (local_2 & 0xfe) * 2 | local_2 & 0xfe00;
      uVar1 = (&game_state.level_data[0].unit_index_2)[uVar4 * 2];
      uVar3 = uVar1 & 0x3ff;
      uVar5 = uVar1 & 0xffff03ff;
      if ((uVar3 != 0) && (uVar5 = (uint)uVar3, (int)param_2 != uVar5)) {
        if ((*(byte *)((int)&game_state.level_data[0].flags + uVar4 * 4 + 1) & 2) == 0) {
          uVar5 = FUN_004baaf0(unit_land_array[uVar5],param_3);
          if ((char)uVar5 != '\0') goto LAB_0044f2bb;
        }
        bVar2 = false;
      }
LAB_0044f2bb:
      local_2 = CONCAT11(local_2._1_1_,(char)local_2 + '\x02');
      iVar6 = iVar6 + -1;
    } while (iVar6 != 0);
    iVar7 = iVar7 + -1;
    uVar5 = CONCAT31((int3)(uVar5 >> 8),(char)local_4);
    local_2 = CONCAT11(local_2._1_1_ + '\x02',(char)local_4);
  } while (iVar7 != 0);
  return CONCAT31((int3)(uVar5 >> 8),bVar2);
}
