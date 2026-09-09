/* Ghidra 12.1.3 pseudocode; entry 00409dd0; FUN_00409dd0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_00409dd0(int param_1,short *param_2)

{
  char cVar1;
  shape_entry *psVar2;
  short sVar3;
  short extraout_var;
  short sVar4;
  short sVar5;
  short local_8;
  short local_6;
  undefined2 local_4;

  psVar2 = shapes_mem;
  if (*(char *)(param_1 + 0x2a) == '\t') {
    FUN_004b9fc0(param_1,param_2);
    sVar3 = extraout_var;
  }
  else {
    sVar3 = (short)((int)((int)*(short *)(param_1 + 0x26) +
                         ((int)*(short *)(param_1 + 0x26) >> 0x1f & 0x1ffU)) >> 9);
    cVar1 = (&objs0_mem[*(short *)(param_1 + 0x33)].shapes_index)[sVar3];
    sVar3 = sVar3 >> 0xf;
    sVar5 = *(short *)(param_1 + 0x7a) + (ushort)(byte)shapes_mem[cVar1].x2 * -0x100;
    *param_2 = sVar5;
    sVar4 = *(short *)(param_1 + 0x7c) + (ushort)(byte)psVar2[cVar1].y2 * -0x100;
    param_2[1] = sVar4;
    *param_2 = (char)psVar2[cVar1].field6_0x6 * 0x40 + sVar5;
    param_2[1] = (char)psVar2[cVar1].field7_0x7 * 0x40 + sVar4;
  }
  local_8 = *param_2;
  local_4 = 0;
  local_6 = param_2[1];
  move_pos_angle_length
            (&local_8,CONCAT22(sVar3,*(short *)(param_1 + 0x26) + 0x200) & 0xffff07ff,0x200);
  *param_2 = local_8;
  param_2[1] = local_6;
  return;
}
