/* Ghidra 12.1.3 pseudocode; entry 00404420; get_building_coords.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void get_building_coords(int param_1,short *param_2)

{
  char cVar1;
  shape_entry *psVar2;
  short sVar3;
  short sVar4;

  psVar2 = shapes_mem;
  cVar1 = (&objs0_mem[*(short *)(param_1 + 0x33)].shapes_index)
          [(short)((int)((int)*(short *)(param_1 + 0x26) +
                        ((int)*(short *)(param_1 + 0x26) >> 0x1f & 0x1ffU)) >> 9)];
  sVar4 = *(short *)(param_1 + 0x7a) + (ushort)(byte)shapes_mem[cVar1].x2 * -0x100;
  *param_2 = sVar4;
  sVar3 = *(short *)(param_1 + 0x7c) + (ushort)(byte)psVar2[cVar1].y2 * -0x100;
  param_2[1] = sVar3;
  *param_2 = (char)psVar2[cVar1].field_0x4 * 0x40 + sVar4;
  param_2[1] = (char)psVar2[cVar1].field_0x5 * 0x40 + sVar3;
  return;
}
