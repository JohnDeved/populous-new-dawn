/* Ghidra 12.1.3 pseudocode; entry 004bf630; set_unit_footprints.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void set_unit_footprints(int param_1)

{
  undefined4 uVar1;
  int iVar2;
  short sVar3;
  int iVar4;
  undefined4 local_4;

  uVar1 = *(undefined4 *)(param_1 + 0x3d);
  iVar4 = 1;
  do {
    iVar2 = res_5_6_index;
    res_5_6_index = res_5_6_index + 1;
    if (0xffff < res_5_6_index) {
      res_5_6_index = 0;
    }
    set_res_5_6_pos_index(uVar1,iVar2);
    iVar4 = iVar4 + -1;
  } while (iVar4 != 0);
  iVar4 = 1;
  local_4._0_2_ = (short)uVar1;
  sVar3 = (short)local_4;
  local_4._0_2_ = (short)local_4 + -0x10;
  local_4._2_2_ = (short)((uint)uVar1 >> 0x10);
  do {
    iVar2 = res_5_6_index;
    res_5_6_index = res_5_6_index + 1;
    if (0xffff < res_5_6_index) {
      res_5_6_index = 0;
    }
    set_res_5_6_pos_index(local_4,iVar2);
    iVar4 = iVar4 + -1;
  } while (iVar4 != 0);
  iVar4 = 1;
  local_4._2_2_ = local_4._2_2_ + -0x10;
  do {
    iVar2 = res_5_6_index;
    res_5_6_index = res_5_6_index + 1;
    if (0xffff < res_5_6_index) {
      res_5_6_index = 0;
    }
    set_res_5_6_pos_index(local_4,iVar2);
    iVar4 = iVar4 + -1;
  } while (iVar4 != 0);
  iVar4 = 1;
  local_4 = CONCAT22(local_4._2_2_,sVar3);
  do {
    iVar2 = res_5_6_index;
    res_5_6_index = res_5_6_index + 1;
    if (0xffff < res_5_6_index) {
      res_5_6_index = 0;
    }
    set_res_5_6_pos_index(local_4,iVar2);
    iVar4 = iVar4 + -1;
  } while (iVar4 != 0);
  return;
}
