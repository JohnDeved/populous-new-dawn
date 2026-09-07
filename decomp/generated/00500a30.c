/* Ghidra 12.1.3 pseudocode; entry 00500a30; init_unit_type_10.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void init_unit_type_10(unit_struct *param_1)

{
  byte *pbVar1;
  vector_48b *pvVar2;
  ushort *puVar3;
  undefined2 uVar4;
  ushort uVar5;
  undefined4 uVar6;
  uint uVar7;
  uint uVar8;
  unit_related_struct_20B *puVar9;
  int iVar10;
  int iVar11;
  int *piVar12;
  int *piVar13;

  switch(param_1->unit_type) {
  case 1:
    if ((*(byte *)((int)&param_1->flags_2 + 2) & 0x10) == 0) {
      empty_unit_function(param_1);
      param_1->state = 1;
      init_unit_class(param_1);
    }
    param_1->next_unit = game_state.tribes_array[(char)param_1->tribe_index].formation_units;
    game_state.tribes_array[(char)param_1->tribe_index].formation_units = param_1;
    uVar8 = game_state.pseudo_random_val * 0x24a1 + 0x24df;
    uVar7 = uVar8 >> 0xd;
    game_state.pseudo_random_val = uVar7 | uVar8 * 0x80000;
    *(ushort *)&param_1->field_0x61 = ((ushort)uVar7 & 0x1f) + 0x20;
    return;
  case 2:
    update_after_unit_alloc(param_1);
    return;
  case 3:
    insert_unit_into_land_tile(param_1,&param_1->pos);
    unit_set_object(&param_1->object,9,0);
    if ((*(byte *)((int)&param_1->flags_2 + 2) & 0x10) == 0) {
      empty_unit_function(param_1);
      param_1->state = 3;
      init_unit_class(param_1);
    }
    if ((param_1->flags_2 & 0x400) == 0) {
      puVar9 = (unit_related_struct_20B *)0x0;
    }
    else {
      param_1->flags_2 = param_1->flags_2 & 0xfffffbff;
      ptr_unit_related_20B = ptr_unit_related_20B + -1;
      puVar9 = ptr_unit_related_20B;
    }
    if (puVar9 != (unit_related_struct_20B *)0x0) {
      *(short *)&param_1->coord_scale_4 = (short)puVar9->field0_0x0;
      return;
    }
    break;
  case 4:
    update_after_unit_alloc(param_1);
    return;
  case 5:
    iVar11 = 1;
    insert_unit_into_land_tile(param_1,&param_1->pos);
    if ((*(byte *)((int)&param_1->flags_2 + 2) & 0x10) == 0) {
      empty_unit_function(param_1);
      param_1->state = 5;
      init_unit_class(param_1);
    }
    if ((param_1->flags_2 & 0x400) == 0) {
      puVar9 = (unit_related_struct_20B *)0x0;
    }
    else {
      param_1->flags_2 = param_1->flags_2 & 0xfffffbff;
      ptr_unit_related_20B = ptr_unit_related_20B + -1;
      puVar9 = ptr_unit_related_20B;
    }
    if (puVar9 != (unit_related_struct_20B *)0x0) {
      iVar11 = puVar9->field0_0x0;
    }
    unit_set_object_upper
              (param_1,CONCAT22((short)((uint)puVar9 >> 0x10),unit_type_to_obj_indexes_map[iVar11]))
    ;
    pbVar1 = (byte *)((int)&(param_1->object).flags + 1);
    *pbVar1 = *pbVar1 | 0x20;
    return;
  case 6:
    update_after_unit_alloc(param_1);
    return;
  case 7:
    FUN_00502460(param_1);
    return;
  case 8:
    FUN_005185d0(param_1);
    return;
  case 10:
    FUN_005027e0(param_1);
    return;
  case 0xb:
    update_after_unit_alloc(param_1);
    return;
  case 0xc:
    FUN_00502910(param_1);
    return;
  case 0xe:
    update_after_unit_alloc(param_1);
    return;
  case 0xf:
    update_after_unit_alloc(param_1);
    return;
  case 0x10:
    if ((*(byte *)((int)&param_1->flags_2 + 2) & 0x10) == 0) {
      empty_unit_function(param_1);
      param_1->state = 0xf;
      init_unit_class(param_1);
    }
    pvVar2 = &param_1->pos;
    pvVar2->x = (pvVar2->x & 0xfe00) + 0x100;
    (param_1->pos).y = ((param_1->pos).y & 0xfe00) + 0x100;
    insert_unit_into_land_tile(param_1,pvVar2);
    unit_set_object(&param_1->object,2,7);
    sunlight_update_unit_landscape(param_1,3,4,0);
    puVar3 = &(param_1->object).flags;
    *(byte *)puVar3 = (byte)*puVar3 | 0x80;
    param_1->coord_scale_3 = 0;
    param_1->coord_scale_1 = 0;
    DAT_0089c65d = DAT_0089c65d + 1;
    FUN_005030c0(param_1);
    return;
  case 0x11:
    update_after_unit_alloc(param_1);
    return;
  case 0x12:
    if ((*(byte *)((int)&param_1->flags_2 + 2) & 0x10) == 0) {
      empty_unit_function(param_1);
      param_1->state = 0x11;
      init_unit_class(param_1);
    }
    FUN_005032a0(param_1);
    return;
  case 0x13:
    if ((param_1->flags_2 & 0x400) == 0) {
      puVar9 = (unit_related_struct_20B *)0x0;
    }
    else {
      param_1->flags_2 = param_1->flags_2 & 0xfffffbff;
      ptr_unit_related_20B = ptr_unit_related_20B + -1;
      puVar9 = ptr_unit_related_20B;
    }
    if (puVar9 != (unit_related_struct_20B *)0x0) {
      iVar11 = puVar9->field0_0x0;
      param_1->maybe_shape_angle = *(undefined2 *)(iVar11 + 0x26);
      uVar6 = *(undefined4 *)(iVar11 + 0x33);
      (param_1->object).obj_index = (short)uVar6;
      (param_1->object).flags = (short)((uint)uVar6 >> 0x10);
      uVar6 = *(undefined4 *)(iVar11 + 0x37);
      (param_1->object).f1 = (short)uVar6;
      (param_1->object).f2 = (char)((uint)uVar6 >> 0x10);
      (param_1->object).obj_related_index = (char)((uint)uVar6 >> 0x18);
      uVar4 = *(undefined2 *)(iVar11 + 0x3b);
      (param_1->object).morph_index = (char)uVar4;
      (param_1->object).palette_index = (char)((ushort)uVar4 >> 8);
      piVar12 = (int *)(iVar11 + 0x68);
      piVar13 = &param_1->coord_scale_4;
      for (iVar10 = 0x12; iVar10 != 0; iVar10 = iVar10 + -1) {
        *piVar13 = *piVar12;
        piVar12 = piVar12 + 1;
        piVar13 = piVar13 + 1;
      }
      uVar5 = (param_1->object).flags;
      param_1->flags_3 = param_1->flags_3 | 0x200000;
      (param_1->object).flags = uVar5 & 0xffdf;
      param_1->state_2 = 0;
      param_1->field_0xa7 = 0x50;
      (param_1->object).flags = uVar5 & 0xff5f;
      DAT_0089ce61 = 2;
      insert_unit_into_land_tile(param_1,&param_1->pos);
      FUN_00401b10(param_1,0x12);
      return;
    }
    update_after_unit_alloc(param_1);
  }
  return;
}
