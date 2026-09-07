/* Ghidra 12.1.3 pseudocode; entry 004fa9e0; FUN_004fa9e0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_004fa9e0(int param_1)

{
  undefined2 uVar1;
  undefined2 extraout_var;
  short sVar2;
  undefined2 extraout_var_00;
  short local_8;
  short sStack_6;

  sVar2 = local_8;
  switch(*(undefined1 *)(param_1 + 0x7e)) {
  case 0:
    local_8 = -objs0_mem[*(short *)(param_1 + 0x33)].f4;
    sVar2 = -objs0_mem[*(short *)(param_1 + 0x33)].f6;
    break;
  case 1:
    local_8 = -objs0_mem[*(short *)(param_1 + 0x33)].f6;
    sVar2 = objs0_mem[*(short *)(param_1 + 0x33)].f4 + 0x200;
    break;
  case 2:
    local_8 = objs0_mem[*(short *)(param_1 + 0x33)].f4 + 0x200;
    sVar2 = objs0_mem[*(short *)(param_1 + 0x33)].f6 + 0x200;
    break;
  case 3:
    local_8 = objs0_mem[*(short *)(param_1 + 0x33)].f6 + 0x200;
    sVar2 = -objs0_mem[*(short *)(param_1 + 0x33)].f4;
  }
  _local_8 = CONCAT22(*(short *)(param_1 + 0x7c) + sVar2,*(short *)(param_1 + 0x7a) + local_8);
  add_unit_to_cell(param_1,&local_8);
  uVar1 = calc_point_height(CONCAT22(extraout_var_00,*(undefined2 *)(param_1 + 0x3d)),
                            CONCAT22(extraout_var,*(undefined2 *)(param_1 + 0x3f)));
  *(undefined2 *)(param_1 + 0x41) = uVar1;
  *(uint *)(param_1 + 0x10) = *(uint *)(param_1 + 0x10) & 0xfffffbff;
  return;
}
