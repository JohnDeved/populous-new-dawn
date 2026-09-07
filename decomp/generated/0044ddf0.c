/* Ghidra 12.1.3 pseudocode; entry 0044ddf0; land_level_processing_1.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */

void land_level_processing_1(undefined4 param_1,undefined4 param_2,undefined4 param_3)

{
  int iVar1;
  byte bVar2;
  int iVar3;
  int iVar4;
  byte bStack_9;
  char local_8;
  char cStack_7;
  undefined2 local_6;

  local_8 = (char)param_1;
  cStack_7 = (char)((uint)param_1 >> 8);
  bVar2 = cStack_7 + (char)param_2 * -2;
  iVar1 = (short)param_2 * 2 + 1;
  for (iVar3 = iVar1; local_6 = CONCAT11(bVar2,local_8 + (char)param_2 * -2), iVar3 != 0;
      iVar3 = iVar3 + -1) {
    if (iVar1 != 0) {
      iVar4 = iVar1;
      do {
        _DAT_0068c6d0 = _DAT_0068c6d0 + 1;
        bStack_9 = (byte)((ushort)local_6 >> 8);
        if (*(char *)((int)update_landscape_block_array +
                     (bVar2 & 0xfffffffe) * 0x40 + (uint)((byte)local_6 >> 1)) == '\0') {
          *(undefined2 *)((int)land_coord_array + level_land_counter_1 * 2) = local_6;
          *(undefined1 *)((int)land_conditional_array + level_land_counter_1) = (undefined1)param_3;
          level_land_counter_1 = level_land_counter_1 + 1;
          *(undefined1 *)
           ((int)update_landscape_block_array +
           (uint)((byte)local_6 >> 1) + (bStack_9 & 0xfffffffe) * 0x40) = 1;
        }
        else {
          _level_land_counter_2 = _level_land_counter_2 + 1;
        }
        if (level_land_counter_1 == 0x400) {
          level_land_processing_2();
        }
        local_6 = CONCAT11(bStack_9,(byte)local_6 + 2);
        iVar4 = iVar4 + -1;
      } while (iVar4 != 0);
    }
    bVar2 = local_6._1_1_ + 2;
  }
  if (((short)param_2 == 0x40) && (level_land_processing_2(), recursion_once == '\0')) {
    recursion_once = 1;
    land_level_processing_1(param_1,param_2,param_3);
    recursion_once = '\0';
  }
  return;
}
