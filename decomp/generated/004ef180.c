/* Ghidra 12.1.3 pseudocode; entry 004ef180; FUN_004ef180.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_004ef180(unit_struct *param_1)

{
  char cVar1;
  short sVar2;
  int iVar3;
  unit_struct *puVar4;
  undefined1 uVar5;
  ushort uVar6;
  int iVar7;
  unit_struct *puVar8;
  undefined1 local_4 [4];

  switch(param_1->unit_class) {
  case 0:
    return;
  case 1:
    FUN_004d4b50(param_1);
    return;
  case 2:
    FUN_00403820(param_1);
    return;
  case 3:
    FUN_00448ca0(param_1);
    return;
  case 4:
    FUN_00466190(param_1,local_4);
    cVar1 = param_1->field_0x9e;
    while (cVar1 != '\0') {
      FUN_004659d0(param_1,0,local_4);
      cVar1 = param_1->field_0x9e;
    }
    if ((*(byte *)((int)&param_1->flags_2 + 2) & 2) != 0) {
      FUN_004ee4f0(param_1);
    }
    param_1->unit_class = 0;
    param_1->flags_2 = param_1->flags_2 | 1;
    remove_unit_global_lists(param_1);
    param_1->class_counter = 3;
    sunlight_update_unit(param_1);
    return;
  case 5:
    FUN_004a6e20(param_1);
    return;
  case 6:
    break;
  case 7:
    switch(param_1->unit_type) {
    case 3:
    case 0x33:
    case 0x3d:
    case 0x41:
    case 0x4a:
    case 0x4b:
      if ((unit_array_ptr_4 <= param_1) && (param_1 <= unit_array_ptr_end_2)) {
        if ((*(byte *)((int)&param_1->flags_2 + 2) & 2) != 0) {
          FUN_004ee4f0(param_1);
        }
        DAT_0089c655 = DAT_0089c655 + -1;
        param_1->unit_class = 0;
        FUN_004ed530(param_1);
        sunlight_update_unit(param_1);
        return;
      }
      if ((*(byte *)((int)&param_1->flags_2 + 2) & 2) != 0) {
        FUN_004ee4f0(param_1);
      }
      param_1->unit_class = 0;
      param_1->flags_2 = param_1->flags_2 | 1;
      remove_unit_global_lists(param_1);
      param_1->class_counter = 3;
      sunlight_update_unit(param_1);
      return;
    default:
      if ((*(byte *)((int)&param_1->flags_2 + 2) & 2) != 0) {
        FUN_004ee4f0(param_1);
      }
      param_1->unit_class = 0;
      param_1->flags_2 = param_1->flags_2 | 1;
      remove_unit_global_lists(param_1);
      param_1->class_counter = 3;
      sunlight_update_unit(param_1);
      return;
    case 0xb:
      FUN_0050d150(param_1);
      return;
    case 0x12:
      if ((*(byte *)((int)&param_1->flags_2 + 2) & 2) != 0) {
        FUN_004ee4f0(param_1);
      }
      param_1->unit_class = 0;
      param_1->flags_2 = param_1->flags_2 | 1;
      remove_unit_global_lists(param_1);
      param_1->class_counter = 3;
      sunlight_update_unit(param_1);
      return;
    case 0x15:
      FUN_00510c60(param_1);
      return;
    case 0x1b:
      if ((*(byte *)((int)&param_1->flags_2 + 2) & 2) != 0) {
        FUN_004ee4f0(param_1);
      }
      param_1->unit_class = 0;
      param_1->flags_2 = param_1->flags_2 | 1;
      remove_unit_global_lists(param_1);
      param_1->class_counter = 3;
      sunlight_update_unit(param_1);
      return;
    case 0x20:
      sVar2 = (param_1->object).obj_index;
      if ((sVar2 == 0x21) || (sVar2 == 0x551)) {
        pal0_mem_2_size = 0x10;
        level_flags_1 = level_flags_1 | 8;
      }
      if ((*(byte *)((int)&param_1->flags_2 + 2) & 2) != 0) {
        FUN_004ee4f0(param_1);
      }
      param_1->unit_class = 0;
      param_1->flags_2 = param_1->flags_2 | 1;
      remove_unit_global_lists(param_1);
      param_1->class_counter = 3;
      sunlight_update_unit(param_1);
      return;
    case 0x4f:
      goto switchD_004ef474_caseD_4f;
    }
  default:
    if ((*(byte *)((int)&param_1->flags_2 + 2) & 2) != 0) {
      FUN_004ee4f0(param_1);
    }
    param_1->unit_class = 0;
    param_1->flags_2 = param_1->flags_2 | 1;
    remove_unit_global_lists(param_1);
    param_1->class_counter = 3;
    sunlight_update_unit(param_1);
    return;
  case 9:
    FUN_004ba410(param_1);
    return;
  case 10:
    switch(param_1->unit_type) {
    case 2:
      FUN_00502080(param_1);
      return;
    case 3:
      if ((*(byte *)((int)&param_1->flags_2 + 2) & 2) != 0) {
        FUN_004ee4f0(param_1);
      }
      DAT_0089c655 = DAT_0089c655 + -1;
      param_1->unit_class = 0;
      FUN_004ed530(param_1);
      sunlight_update_unit(param_1);
      return;
    default:
      if ((*(byte *)((int)&param_1->flags_2 + 2) & 2) != 0) {
        FUN_004ee4f0(param_1);
      }
      break;
    case 8:
      FUN_00519c90(param_1);
      return;
    case 0x10:
      FUN_00503080(param_1);
      return;
    }
    param_1->unit_class = 0;
    param_1->flags_2 = param_1->flags_2 | 1;
    remove_unit_global_lists(param_1);
    param_1->class_counter = 3;
    sunlight_update_unit(param_1);
    return;
  }
  cVar1 = param_1->unit_type;
  puVar8 = allocated_units;
  if (cVar1 != '\x02') {
    if (cVar1 == '\x06') {
      if (interface_state != '\x03') {
        while (iVar7 = FUN_004fbfa0(param_1,0), iVar7 != 0) {
          FUN_004a6e20(iVar7);
        }
      }
      if ((*(byte *)((int)&param_1->flags_2 + 2) & 2) != 0) {
        FUN_004ee4f0(param_1);
      }
      param_1->unit_class = 0;
      param_1->flags_2 = param_1->flags_2 | 1;
      remove_unit_global_lists(param_1);
      param_1->class_counter = 3;
      sunlight_update_unit(param_1);
      return;
    }
    if (cVar1 != '\n') {
      if ((*(byte *)((int)&param_1->flags_2 + 2) & 2) != 0) {
        FUN_004ee4f0(param_1);
      }
      param_1->unit_class = 0;
      param_1->flags_2 = param_1->flags_2 | 1;
      remove_unit_global_lists(param_1);
      param_1->class_counter = 3;
      sunlight_update_unit(param_1);
      return;
    }
    puVar8 = (unit_struct *)0x0;
    if (((*(ushort *)&param_1->field_0x78 != 0) &&
        (puVar4 = unit_land_array[*(ushort *)&param_1->field_0x78],
        (*(byte *)&puVar4->flags_2 & 1) == 0)) && (puVar4->unit_class != '\0')) {
      puVar8 = puVar4;
    }
    if (puVar8 != (unit_struct *)0x0) {
      if ((*(byte *)((int)&puVar8->flags_2 + 2) & 2) != 0) {
        FUN_004ee4f0(puVar8);
      }
      puVar8->unit_class = 0;
      puVar8->flags_2 = puVar8->flags_2 | 1;
      remove_unit_global_lists(puVar8);
      puVar8->class_counter = 3;
      sunlight_update_unit(puVar8);
    }
    if ((*(byte *)((int)&param_1->flags_2 + 2) & 2) != 0) {
      FUN_004ee4f0(param_1);
    }
    param_1->unit_class = 0;
    param_1->flags_2 = param_1->flags_2 | 1;
    remove_unit_global_lists(param_1);
    param_1->class_counter = 3;
    sunlight_update_unit(param_1);
    return;
  }
  do {
    if (puVar8 == (unit_struct *)0x0) {
LAB_004ef2fb:
      puVar8 = (unit_struct *)0x0;
      if (((*(ushort *)&param_1->field_0x78 != 0) &&
          (puVar4 = unit_land_array[*(ushort *)&param_1->field_0x78],
          (*(byte *)&puVar4->flags_2 & 1) == 0)) && (puVar4->unit_class != '\0')) {
        puVar8 = puVar4;
      }
      if (puVar8 != (unit_struct *)0x0) {
        if ((*(byte *)((int)&puVar8->flags_2 + 2) & 2) != 0) {
          FUN_004ee4f0(puVar8);
        }
        puVar8->unit_class = 0;
        puVar8->flags_2 = puVar8->flags_2 | 1;
        remove_unit_global_lists(puVar8);
        puVar8->class_counter = 3;
        sunlight_update_unit(puVar8);
      }
      if ((*(byte *)((int)&param_1->flags_2 + 2) & 2) != 0) {
        FUN_004ee4f0(param_1);
      }
      param_1->unit_class = 0;
      param_1->flags_2 = param_1->flags_2 | 1;
      remove_unit_global_lists(param_1);
      param_1->class_counter = 3;
      sunlight_update_unit(param_1);
      return;
    }
    if (((puVar8->unit_class == '\x06') && (puVar8->unit_type == '\n')) &&
       ((*(char *)&puVar8->loc_1_x == *(char *)&param_1->loc_1_y &&
        (iVar7._0_2_ = param_1->obj_index_anim_prev, iVar7._2_2_ = param_1->obj_index_anim_prev_2,
        iVar3._0_2_ = puVar8->obj_index_anim_prev, iVar3._2_2_ = puVar8->obj_index_anim_prev_2,
        iVar3 == iVar7)))) {
      FUN_004ef180(puVar8);
      goto LAB_004ef2fb;
    }
    puVar8 = puVar8->next_unit_1;
  } while( true );
switchD_004ef474_caseD_4f:
  (param_1->object).obj_related_index = 0x28;
  (param_1->object).morph_index = 0;
  *(undefined2 *)&param_1->field_0x6c = 0x10;
  (param_1->object).obj_index = 0x559;
  uVar6 = DAT_005a6cb9;
  (param_1->object).flags = DAT_005a6cb9;
  uVar5 = DAT_005a6cb7;
  (param_1->object).flags = uVar6 | 0x100;
  (param_1->object).palette_index = uVar5;
  if (DAT_005a6cb1 * 4 <= (int)(uint)(ushort)(param_1->object).f1) {
    (param_1->object).f1 = 0;
  }
  if (DAT_005a6cb8 != '\0') {
    (param_1->object).f1 = 0;
    return;
  }
  return;
}
