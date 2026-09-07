/* Ghidra 12.1.3 pseudocode; entry 0040a980; FUN_0040a980.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


/* WARNING: Removing unreachable block (ram,0x0040aa08) */
/* WARNING: Removing unreachable block (ram,0x0040aa12) */

void FUN_0040a980(int param_1,int param_2)

{
  char cVar1;
  ushort uVar2;
  uint uVar3;
  uint uVar4;

  cVar1 = (&objs0_mem[*(short *)(param_2 + 0x33)].shapes_index)
          [(short)((int)((int)*(short *)(param_2 + 0x26) +
                        ((int)*(short *)(param_2 + 0x26) >> 0x1f & 0x1ffU)) >> 9)];
  uVar4 = (uint)(ushort)((((short)(char)shapes_mem[cVar1].field_0x4 +
                          (ushort)(byte)shapes_mem[cVar1].x2 * -4) * 0x40 -
                         *(short *)(param_1 + 0x3d)) + *(short *)(param_2 + 0x7a));
  uVar3 = (uint)(ushort)((((short)(char)shapes_mem[cVar1].field_0x5 +
                          (ushort)(byte)shapes_mem[cVar1].y2 * -4) * 0x40 -
                         *(short *)(param_1 + 0x3f)) + *(short *)(param_2 + 0x7c));
  if (0x7fff < uVar4) {
    uVar4 = uVar4 - 0x10000;
  }
  if (0x7fff < uVar3) {
    uVar3 = uVar3 - 0x10000;
  }
  uVar2 = calc_angle_quadrant(uVar4,-uVar3);
  uVar2 = uVar2 & 0x7ff;
  if ((*(uint *)(param_1 + 0xc) & 0x80) != 0) {
    *(ushort *)(param_1 + 0x57) = uVar2;
  }
  *(ushort *)(param_1 + 0x5d) = uVar2;
  if ((*(uint *)(param_1 + 0xc) & 0x8000) == 0) {
    *(ushort *)(param_1 + 0x26) = uVar2;
  }
  else {
    *(ushort *)(param_1 + 0x26) = uVar2 + 0x400 & 0x7ff;
  }
  update_gs_unit_related_array_item(param_1);
  *(ushort *)(param_1 + 0x57) = uVar2;
  uVar4 = *(uint *)(param_1 + 0xc);
  *(uint *)(param_1 + 0xc) = uVar4 | 0x80;
  *(uint *)(param_1 + 0xc) = uVar4 | 0x1080;
  return;
}
