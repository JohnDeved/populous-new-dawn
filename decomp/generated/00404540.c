/* Ghidra 12.1.3 pseudocode; entry 00404540; FUN_00404540.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


/* WARNING: Type propagation algorithm not settling */

int FUN_00404540(int param_1,char param_2,short *param_3)

{
  char cVar1;
  shape_entry *psVar2;
  undefined1 *puVar3;
  short sVar4;
  int iVar5;
  short sVar6;
  undefined4 local_8;
  short local_4;

  psVar2 = shapes_mem;
  local_8 = (int)(short)((int)((int)*(short *)(param_1 + 0x26) +
                              ((int)*(short *)(param_1 + 0x26) >> 0x1f & 0x1ffU)) >> 9);
  cVar1 = (&objs0_mem[*(short *)(param_1 + 0x33)].shapes_index)[local_8];
  sVar4 = *(short *)(param_1 + 0x7a) + (ushort)(byte)shapes_mem[cVar1].x2 * -0x100;
  *param_3 = sVar4;
  sVar6 = *(short *)(param_1 + 0x7c) + (ushort)(byte)psVar2[cVar1].y2 * -0x100;
  param_3[1] = sVar6;
  puVar3 = &psVar2[cVar1].x1 + param_2 * 3;
  *param_3 = (ushort)(byte)puVar3[8] * 0x20 + sVar4;
  param_3[1] = (ushort)(byte)puVar3[10] * 0x20 + sVar6;
  iVar5 = (uint)(byte)puVar3[9] * 0x10;
  if (param_2 < '\x03') {
    use_smoke((int)*(short *)(param_1 + 0x33),local_8,(int)param_2,&local_8);
    *param_3 = *param_3 + (short)local_8;
    param_3[1] = param_3[1] + local_4;
    puVar3 = (undefined1 *)(int)local_8._2_2_;
    iVar5 = iVar5 + (int)puVar3;
  }
  sVar4 = calc_point_height(*param_3,CONCAT22((short)((uint)puVar3 >> 0x10),param_3[1]));
  param_3[2] = sVar4;
  param_3[2] = param_3[2] + (short)iVar5;
  return iVar5;
}
