/* Ghidra 12.1.3 pseudocode; entry 00409f90; FUN_00409f90.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_00409f90(int param_1,short *param_2)

{
  char cVar1;
  uint uVar2;
  uint uVar3;
  undefined4 local_8;
  undefined2 local_4;

  uVar3 = local_8;
  switch(*(undefined1 *)(param_1 + 0x2b)) {
  case 0xd:
  case 0xe:
    local_8 = *(ushort *)(param_1 + 0x26) & 0x7ff;
    uVar3 = 0x200;
    break;
  case 0xf:
  case 0x10:
    local_8 = (int)*(short *)(param_1 + 0x26) - 0x200U & 0x7ff;
    uVar3 = 0x500;
  }
  cVar1 = (&objs0_mem[*(short *)(param_1 + 0x33)].shapes_index)
          [(short)((int)((int)*(short *)(param_1 + 0x26) +
                        ((int)*(short *)(param_1 + 0x26) >> 0x1f & 0x1ffU)) >> 9)];
  local_4 = 0;
  uVar2 = local_8;
  local_8._0_2_ =
       ((short)(char)shapes_mem[cVar1].field_0x4 + (ushort)(byte)shapes_mem[cVar1].x2 * -4) * 0x40 +
       *(short *)(param_1 + 0x7a);
  local_8._2_2_ =
       ((short)(char)shapes_mem[cVar1].field_0x5 + (ushort)(byte)shapes_mem[cVar1].y2 * -4) * 0x40 +
       *(short *)(param_1 + 0x7c);
  move_pos_angle_length(&local_8,uVar2,uVar3);
  *param_2 = (short)local_8;
  param_2[1] = local_8._2_2_;
  return;
}
