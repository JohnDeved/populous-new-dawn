/* Ghidra 12.1.3 pseudocode; entry 00518390; FUN_00518390.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_00518390(int param_1)

{
  uint uVar1;
  byte bVar2;
  char cVar3;
  char cVar4;
  unit_struct *puVar5;
  bool bVar6;
  int iVar7;

  if ((*(short *)(param_1 + 0x9f) == 0) || (bVar6 = true, (*(byte *)(param_1 + 0x13) & 2) == 0)) {
    bVar6 = false;
  }
  if (!bVar6) {
    *(undefined2 *)(param_1 + 0x5f) = 0;
  }
  if ((*(byte *)(param_1 + 0xe) & 0x80) != 0) {
    iVar7 = get_adjacent_unit(param_1,4);
    if (iVar7 != 0) {
      bVar2 = *(byte *)(unit_type_to_obj_indexes_map + *(byte *)(param_1 + 0x2b) + 0x75);
      unit_set_object_upper(param_1,(ushort)bVar2);
      *(undefined2 *)(param_1 + 0x37) = 1;
      cVar3 = vstart_related[(short)obj_indexes_table[(uint)(ushort)bVar2 * 2]].frame_counter;
      cVar4 = obj_related_array[*(byte *)(param_1 + 0x3a) + 3]._f2;
      *(byte *)(param_1 + 0x35) = *(byte *)(param_1 + 0x35) | 2;
      *(char *)(param_1 + 0x39) = cVar3 * (cVar4 + '\x01') + -1;
      return;
    }
  }
  if (*(ushort *)(param_1 + 0x9f) != 0) {
    puVar5 = unit_land_array[*(ushort *)(param_1 + 0x9f)];
    uVar1._0_1_ = puVar5->num_points;
    uVar1._1_1_ = puVar5->tex_size_type;
    uVar1._2_2_ = puVar5->facs0_index;
    uVar1 = uVar1 | 2;
    puVar5->num_points = (char)uVar1;
    puVar5->tex_size_type = (char)(uVar1 >> 8);
    puVar5->facs0_index = (short)(uVar1 >> 0x10);
    *(ushort *)(param_1 + 0x76) = *(ushort *)(param_1 + 0x76) & 0xfdff;
    FUN_004d3ff0(param_1,(*(short *)(param_1 + 0x78) == 0) - 1U & 4);
    return;
  }
  FUN_004d4da0(param_1,8);
  return;
}
