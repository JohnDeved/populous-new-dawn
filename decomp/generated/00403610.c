/* Ghidra 12.1.3 pseudocode; entry 00403610; init_unit_building.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void init_unit_building(unit_struct *param_1)

{
  vector_48b *pvVar1;
  undefined1 uVar2;
  ushort uVar3;
  ushort uVar4;
  uint uVar5;
  uint uVar6;
  uint uVar7;
  int iVar8;
  unit_related_struct_20B *puVar9;

  iVar8 = 0;
  FUN_0040b170(param_1);
  uVar3 = (param_1->pos).y;
  param_1->loc_1_y = uVar3;
  pvVar1 = &param_1->pos;
  uVar4 = pvVar1->x;
  param_1->loc_1_x = uVar4;
  param_1->loc_1_x = uVar4 & 0xfe00;
  param_1->loc_1_y = uVar3 & 0xfe00;
  insert_unit_into_land_tile(param_1,pvVar1);
  uVar5 = param_1->flags_2;
  param_1->flags_2 = uVar5 | 0x8000000;
  param_1->flags_2 = uVar5 | 0x8000040;
  puVar9 = (unit_related_struct_20B *)0x0;
  if ((uVar5 & 0x400) != 0) {
    param_1->flags_2 = uVar5 & 0xfffffbff | 0x8000040;
    ptr_unit_related_20B = ptr_unit_related_20B + -1;
    puVar9 = ptr_unit_related_20B;
  }
  if (puVar9 == (unit_related_struct_20B *)0x0) {
    if ((*(byte *)((int)&param_1->flags_2 + 2) & 0x10) == 0) {
      empty_unit_function(param_1);
      param_1->state = 2;
      init_unit_class(param_1);
    }
  }
  else {
    param_1->maybe_shape_angle = (short)puVar9->field0_0x0 << 9;
    param_1->loc_2_y = (short)puVar9->field1_0x4;
    if (-1 < (int)puVar9->field3_0xc) {
      param_1->index_to_array = (short)puVar9->field3_0xc;
    }
    uVar2 = *(undefined1 *)&puVar9->unit_ptr;
    if ((*(byte *)((int)&param_1->flags_2 + 2) & 0x10) == 0) {
      empty_unit_function(param_1);
      param_1->state = uVar2;
      init_unit_class(param_1);
    }
    FUN_0040afd0(param_1);
    param_1->flags_2 = param_1->flags_2 & 0xf7ffffff;
    FUN_00403d50(param_1);
    landscape_move_1(param_1,1);
    if (param_1->unit_type != '\n') {
      landscape_move_2(param_1);
    }
    iVar8 = puVar9->field4_0x10;
  }
  *(undefined2 *)&param_1->field_0x9e = 0;
  if ((unit_type_array_building[(byte)param_1->unit_type].field_0x49 & 0x80) != 0) {
    param_1->flags_3 = param_1->flags_3 | 0x80;
  }
  uVar5 = game_state.pseudo_random_val;
  if (iVar8 == 0) {
    if (*(short *)&unit_type_array_building[(byte)param_1->unit_type].field_0x3e != 0) {
      uVar7 = game_state.pseudo_random_val * 0x24a1 + 0x24df;
      uVar6 = uVar7 >> 0xd;
      game_state.pseudo_random_val = uVar6 | uVar7 * 0x80000;
      if (9 < ((byte)uVar6 & 0xf)) {
        ptr_unit_related_20B->field0_0x0 = 0xffffffff;
        ptr_unit_related_20B->field1_0x4 = 0xffffffff;
        ptr_unit_related_20B->unit_ptr = param_1;
        ptr_unit_related_20B->field3_0xc = 0;
        ptr_unit_related_20B->field4_0x10 = 0;
        ptr_unit_related_20B = ptr_unit_related_20B + 1;
        unit_allocation_flag = 1;
        iVar8 = alloc_unit(6,9,CONCAT31((int3)(uVar5 >> 8),param_1->tribe_index),pvVar1);
        if ((iVar8 != 0) && (*(undefined2 *)(iVar8 + 0x94) = param_1->unit_index, iVar8 != 0)) {
          param_1->facs0_index = *(short *)(iVar8 + 0x24);
          return;
        }
      }
    }
  }
  else {
    param_1->facs0_index = (short)iVar8;
  }
  return;
}
