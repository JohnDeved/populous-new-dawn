/* Ghidra 12.1.3 pseudocode; entry 00498140; FUN_00498140.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_00498140(int param_1)

{
  unit_struct *puVar1;
  unit_struct *puVar2;
  int iVar3;
  int iVar4;
  undefined2 local_a;
  undefined1 auStack_8 [2];
  undefined2 local_6;

  if (*(ushort *)(param_1 + 0x82) != 0) {
    puVar1 = unit_land_array[*(ushort *)(param_1 + 0x82)];
    puVar2 = (unit_struct *)0x0;
    if (((*(byte *)&puVar1->flags_2 & 1) == 0) && (puVar1->unit_class != '\0')) {
      puVar2 = puVar1;
    }
    if (puVar2 != (unit_struct *)0x0) goto LAB_004982a8;
  }
  *(undefined2 *)(param_1 + 0x82) = 0;
  iVar4 = (int)(short)((int)((int)*(short *)(param_1 + 0x26) +
                            ((int)*(short *)(param_1 + 0x26) >> 0x1f & 0x1ffU)) >> 9);
  iVar3 = (int)(char)(&objs0_mem[*(short *)(param_1 + 0x33)].shapes_index)[iVar4];
  local_6 = *(undefined2 *)(param_1 + 0x7c);
  local_a = CONCAT11((char)((ushort)local_6 >> 8),
                     (char)((ushort)*(undefined2 *)(param_1 + 0x7a) >> 8)) & 0xfefe;
  local_a = CONCAT11((char)(local_a >> 8) - shapes_mem[iVar3].y2,
                     (char)local_a - shapes_mem[iVar3].x2);
  ptr_unit_related_20B->field0_0x0 = iVar3;
  ptr_unit_related_20B->field1_0x4 = (uint)local_a;
  ptr_unit_related_20B->unit_ptr = (unit_struct *)(uint)*(byte *)(param_1 + 0x2b);
  ptr_unit_related_20B->field3_0xc = iVar4;
  ptr_unit_related_20B->field4_0x10 = 0;
  ptr_unit_related_20B = ptr_unit_related_20B + 1;
  unit_allocation_flag = 1;
  iVar3 = alloc_unit(9,1,*(undefined1 *)(param_1 + 0x2f),auStack_8);
  if (iVar3 != 0) {
    *(undefined2 *)(param_1 + 0x82) = *(undefined2 *)(iVar3 + 0x24);
    *(undefined2 *)(iVar3 + 0x92) = *(undefined2 *)(param_1 + 0x24);
    *(undefined2 *)(iVar3 + 0x96) =
         *(undefined2 *)&unit_type_array_building[*(byte *)(param_1 + 0x2b)].field_0x1a;
    if ((*(byte *)(iVar3 + 0xe) & 0x10) == 0) {
      empty_unit_function(iVar3);
      *(undefined1 *)(iVar3 + 0x2c) = 2;
    }
  }
LAB_004982a8:
  if (((*(short *)(param_1 + 0x82) != 0) && (*(char *)(param_1 + 0x2c) == '\x02')) &&
     ((*(byte *)(param_1 + 0xe) & 0x10) == 0)) {
    empty_unit_function(param_1);
    *(undefined1 *)(param_1 + 0x2c) = 1;
    init_unit_class(param_1);
  }
  return;
}
