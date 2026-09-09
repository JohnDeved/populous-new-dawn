/* Ghidra 12.1.3 pseudocode; entry 00403d50; FUN_00403d50.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_00403d50(int param_1)

{
  short sVar1;
  short sVar2;
  undefined2 uVar3;
  int iVar4;
  undefined2 extraout_var;
  undefined2 extraout_var_00;
  short sVar5;
  short sVar6;
  shape_entry *psVar7;
  short sVar8;
  short local_10;
  short sStack_e;
  int local_8;
  int local_4;

  sVar1 = *(short *)(param_1 + 0x33);
  iVar4 = (int)(short)((int)((int)*(short *)(param_1 + 0x26) +
                            ((int)*(short *)(param_1 + 0x26) >> 0x1f & 0x1ffU)) >> 9);
  psVar7 = shapes_mem + (char)(&objs0_mem[sVar1].shapes_index)[iVar4];
  sVar8 = local_10;
  switch(iVar4) {
  case 0:
    local_10 = objs0_mem[sVar1].f11 - objs0_mem[sVar1].f4;
    sVar8 = objs0_mem[sVar1].f13 - objs0_mem[sVar1].f6;
    break;
  case 1:
    local_10 = objs0_mem[sVar1].f13 - objs0_mem[sVar1].f6;
    sVar8 = (objs0_mem[sVar1].f4 - objs0_mem[sVar1].f11) + 0x200;
    break;
  case 2:
    local_10 = (objs0_mem[sVar1].f4 - objs0_mem[sVar1].f11) + 0x200;
    sVar8 = (objs0_mem[sVar1].f6 - objs0_mem[sVar1].f13) + 0x200;
    break;
  case 3:
    local_10 = (objs0_mem[sVar1].f6 - objs0_mem[sVar1].f13) + 0x200;
    sVar8 = objs0_mem[sVar1].f11 - objs0_mem[sVar1].f4;
  }
  sVar5 = *(short *)(param_1 + 0x7a) + local_10;
  sVar6 = *(short *)(param_1 + 0x7c) + sVar8;
  local_4 = (uint)(byte)psVar7->x1 * 2 + -6;
  local_8 = (uint)(byte)psVar7->y1 * 2 + -6;
  sVar1 = (byte)psVar7->x2 - 2;
  sVar2 = (byte)psVar7->y2 - 2;
  switch(iVar4) {
  case 0:
    local_10 = -sVar1;
    goto LAB_00403e90;
  case 1:
    local_10 = -sVar1;
    sVar8 = (short)local_8 - sVar2;
    break;
  case 2:
    local_10 = (short)local_4 - sVar1;
    sVar8 = (short)local_8 - sVar2;
    break;
  case 3:
    local_10 = (short)local_4 - sVar1;
LAB_00403e90:
    sVar8 = -sVar2;
  }
  _local_10 = CONCAT22(sVar6 + sVar8 * 0x100,sVar5 + local_10 * 0x100);
  add_unit_to_cell(param_1,&local_10);
  uVar3 = calc_point_height(CONCAT22(extraout_var_00,*(undefined2 *)(param_1 + 0x3d)),
                            CONCAT22(extraout_var,*(undefined2 *)(param_1 + 0x3f)));
  *(undefined2 *)(param_1 + 0x41) = uVar3;
  *(uint *)(param_1 + 0x10) = *(uint *)(param_1 + 0x10) & 0xfffffbff;
  return;
}
