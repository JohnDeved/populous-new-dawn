/* Ghidra 12.1.3 pseudocode; entry 004d9650; FUN_004d9650.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


uint FUN_004d9650(int param_1)

{
  undefined1 uVar1;
  char cVar2;
  byte bVar3;
  int iVar4;
  uint uVar5;
  uint3 uVar8;
  undefined4 uVar6;
  uint uVar7;
  bool bVar9;
  undefined1 local_8;
  undefined1 local_7;
  undefined1 local_4;
  undefined1 local_3;

  bVar9 = false;
  if ((*(byte *)(param_1 + 0x2e) & 7) == 0) {
    if ((game_state.tribes_array[*(char *)(param_1 + 0x2f)].field_0x941 & 0x40) == 0) {
      iVar4 = (-(uint)(game_state.tribes_array[*(char *)(param_1 + 0x2f)].field_0xc1f == '\x02') &
              0xfffffe00) + 0x360;
    }
    else {
      iVar4 = 0x20;
    }
    if (*(short *)(param_1 + 0x70) < iVar4) {
      *(short *)(param_1 + 0x70) = *(short *)(param_1 + 0x70) + 7;
    }
    else if ((load_level_flags._3_1_ & 4) == 0) {
      *(short *)(param_1 + 0x6e) = *(short *)(param_1 + 0x6e) + -0x38;
    }
  }
  uVar7 = (uint)*(byte *)(param_1 + 0x2d);
  switch(uVar7) {
  case 0:
    bVar3 = *(byte *)(param_1 + 0x30);
    if ((unit_related_struct_26B_ARRAY_005a7b90[bVar3].field_0x18 & 8) == 0) {
      iVar4 = (uint)*(byte *)(param_1 + 0x3e) + (uint)*(byte *)(param_1 + 0x40) * 0x100;
      bVar9 = (*(byte *)(game_state._841980_4_ + (iVar4 >> 3)) & '\x01' << ((byte)iVar4 & 7)) == 0;
    }
    else {
      iVar4 = FUN_0044f750(param_1 + 0x3d);
      bVar9 = *(short *)&unit_related_struct_26B_ARRAY_005a7b90[bVar3].field_0x10 < iVar4;
    }
    if (bVar9) {
      if ((game_state.level_flags & 2) == 0) {
        bVar3 = *(byte *)(param_1 + 0x2b);
      }
      else {
        bVar3 = *(byte *)(param_1 + 0x2b);
        if (bVar3 == 7) {
          uVar1 = 0x27;
          goto LAB_004d980a;
        }
      }
      uVar1 = unit_type_array_person[bVar3].next_state;
LAB_004d980a:
      *(undefined1 *)(param_1 + 0x2c) = uVar1;
      *(uint *)(param_1 + 0xc) = *(uint *)(param_1 + 0xc) | 0x100000;
      init_unit_class(param_1);
      uVar7 = *(uint *)(param_1 + 0xc);
      uVar5 = uVar7 & 0xffefffff;
      *(uint *)(param_1 + 0xc) = uVar5;
      *(uint *)(param_1 + 0xc) = uVar5 | 0x80000;
      return uVar7 & 0xffefff00 | 0x80000;
    }
    iVar4 = get_adjacent_unit(param_1,0);
    if (iVar4 == 0) {
      *(undefined1 *)(param_1 + 0x2d) = 1;
      *(uint *)(param_1 + 0xc) = *(uint *)(param_1 + 0xc) | 0x40000000;
      return 0;
    }
    if ((game_state.level_flags & 2) == 0) {
      bVar3 = *(byte *)(param_1 + 0x2b);
    }
    else {
      bVar3 = *(byte *)(param_1 + 0x2b);
      if (bVar3 == 7) {
        uVar1 = 0x27;
        goto LAB_004d979b;
      }
    }
    uVar1 = unit_type_array_person[bVar3].next_state;
LAB_004d979b:
    *(undefined1 *)(param_1 + 0x2c) = uVar1;
    *(uint *)(param_1 + 0xc) = *(uint *)(param_1 + 0xc) | 0x100000;
    init_unit_class(param_1);
    uVar7 = *(uint *)(param_1 + 0xc);
    *(undefined2 *)(param_1 + 0x61) = 0;
    uVar5 = uVar7 & 0xffefffff;
    *(uint *)(param_1 + 0xc) = uVar5;
    *(uint *)(param_1 + 0xc) = uVar5 | 0x800;
    *(uint *)(param_1 + 0xc) = uVar5 | 0x20000800;
    return uVar7 & 0xffefff00 | 0x20000800;
  case 1:
    uVar7 = *(uint *)(param_1 + 0xc);
    if ((uVar7 & 0x40000000) != 0) {
      *(undefined1 *)(param_1 + 0xaa) = 0;
      *(undefined1 *)(param_1 + 0xa8) = 4;
      uVar7 = uVar7 & 0xbfffffff;
      *(uint *)(param_1 + 0xc) = uVar7;
    }
    uVar8 = (uint3)(uVar7 >> 8);
    if ('\0' < *(char *)(param_1 + 0xaa)) {
      *(char *)(param_1 + 0xaa) = *(char *)(param_1 + 0xaa) + -1;
      return (uint)uVar8 << 8;
    }
    cVar2 = *(char *)(param_1 + 0xa8) + -1;
    *(char *)(param_1 + 0xa8) = cVar2;
    if (cVar2 == '\0') {
      *(undefined1 *)(param_1 + 0x2d) = 2;
      *(uint *)(param_1 + 0xc) = *(uint *)(param_1 + 0xc) | 0x40000000;
      return (uint)uVar8 << 8;
    }
    *(undefined1 *)(param_1 + 0xaa) = 8;
    local_4 = (undefined1)((ushort)*(undefined2 *)(param_1 + 0x3d) >> 8);
    local_3 = (undefined1)((ushort)*(undefined2 *)(param_1 + 0x3f) >> 8);
    local_8 = (undefined1)((ushort)*(undefined2 *)(param_1 + 0x4f) >> 8);
    local_7 = (undefined1)((ushort)*(undefined2 *)(param_1 + 0x51) >> 8);
    uVar7 = FUN_004ea920(param_1,&local_4,&local_8,cVar2);
    *(uint *)(param_1 + 0xc) = *(uint *)(param_1 + 0xc) & 0x7fffffff;
    iVar4 = (int)(short)uVar7;
    if (iVar4 == 0) goto switchD_004d96d4_caseD_4;
    update_gs_unit_related_array_item(param_1);
    clear_gc_unit_related_coords(iVar4);
    link_unit_to_gs_unit_related_array(param_1,iVar4);
    if ((game_state.level_flags & 2) == 0) {
      bVar3 = *(byte *)(param_1 + 0x2b);
    }
    else {
      bVar3 = *(byte *)(param_1 + 0x2b);
      if (bVar3 == 7) {
        uVar1 = 0x27;
        goto LAB_004d991a;
      }
    }
    uVar1 = unit_type_array_person[bVar3].next_state;
LAB_004d991a:
    *(undefined1 *)(param_1 + 0x2c) = uVar1;
    uVar7 = init_unit_class(param_1);
    return uVar7 & 0xffffff00;
  case 2:
    uVar7 = *(uint *)(param_1 + 0xc);
    if ((uVar7 & 0x40000000) != 0) {
      *(undefined1 *)(param_1 + 0xaa) = 0;
      *(undefined1 *)(param_1 + 0xa8) = 1;
      *(uint *)(param_1 + 0xc) = uVar7 & 0xbfffffff;
      uVar5 = uVar7 & 0x80;
      uVar7 = uVar7 & 0xbfffffff;
      if ((uVar5 != 0) ||
         (uVar7 = *(char *)(param_1 + 0x2f) * 0xb,
         (game_state.tribes_array[*(char *)(param_1 + 0x2f)].field_0x93d & 0x20) == 0)) {
        bVar9 = true;
      }
    }
    if (bVar9) {
LAB_004d9a73:
      bVar9 = true;
    }
    else {
      cVar2 = *(char *)(param_1 + 0xaa) + -1;
      uVar7 = CONCAT31((int3)(uVar7 >> 8),cVar2);
      *(char *)(param_1 + 0xaa) = cVar2;
      bVar9 = false;
      if (cVar2 < '\x01') {
        local_4 = (undefined1)((ushort)*(undefined2 *)(param_1 + 0x3d) >> 8);
        local_3 = (undefined1)((ushort)*(undefined2 *)(param_1 + 0x3f) >> 8);
        local_8 = (undefined1)((ushort)*(undefined2 *)(param_1 + 0x4f) >> 8);
        local_7 = (undefined1)((ushort)*(undefined2 *)(param_1 + 0x51) >> 8);
        uVar6 = FUN_004ea920(param_1,&local_4,&local_8,*(undefined1 *)(param_1 + 0xa8));
        *(uint *)(param_1 + 0xc) = *(uint *)(param_1 + 0xc) & 0x7fffffff;
        iVar4 = (int)(short)uVar6;
        if (iVar4 == 0) {
          *(undefined1 *)(param_1 + 0xaa) = 8;
          bVar3 = *(char *)(param_1 + 0xa8) + 1;
          uVar7 = CONCAT31((int3)((uint)uVar6 >> 8),bVar3);
          *(byte *)(param_1 + 0xa8) = bVar3;
          if (8 < bVar3) goto LAB_004d9a73;
        }
        else {
          update_gs_unit_related_array_item(param_1);
          clear_gc_unit_related_coords(iVar4);
          link_unit_to_gs_unit_related_array(param_1,iVar4);
          if ((game_state.level_flags & 2) == 0) {
            bVar3 = *(byte *)(param_1 + 0x2b);
LAB_004d9a45:
            uVar1 = unit_type_array_person[bVar3].next_state;
          }
          else {
            bVar3 = *(byte *)(param_1 + 0x2b);
            if (bVar3 != 7) goto LAB_004d9a45;
            uVar1 = 0x27;
          }
          *(undefined1 *)(param_1 + 0x2c) = uVar1;
          uVar7 = init_unit_class(param_1);
        }
      }
    }
    if (bVar9) {
      *(undefined1 *)(param_1 + 0x2d) = 3;
      *(uint *)(param_1 + 0xc) = *(uint *)(param_1 + 0xc) | 0x40000000;
      return uVar7 & 0xffffff00;
    }
    goto switchD_004d96d4_caseD_4;
  case 3:
    break;
  default:
    goto switchD_004d96d4_caseD_4;
  }
  if ((*(byte *)(param_1 + 0x2e) & 0x7f) != 0) goto switchD_004d96d4_caseD_4;
  local_4 = (undefined1)((ushort)*(undefined2 *)(param_1 + 0x3d) >> 8);
  local_3 = (undefined1)((ushort)*(undefined2 *)(param_1 + 0x3f) >> 8);
  local_8 = (undefined1)((ushort)*(undefined2 *)(param_1 + 0x4f) >> 8);
  local_7 = (undefined1)((ushort)*(undefined2 *)(param_1 + 0x51) >> 8);
  uVar7 = FUN_004ea920(param_1,&local_4,&local_8,0);
  *(uint *)(param_1 + 0xc) = *(uint *)(param_1 + 0xc) & 0x7fffffff;
  iVar4 = (int)(short)uVar7;
  if (iVar4 == 0) goto switchD_004d96d4_caseD_4;
  update_gs_unit_related_array_item(param_1);
  clear_gc_unit_related_coords(iVar4);
  link_unit_to_gs_unit_related_array(param_1,iVar4);
  if ((game_state.level_flags & 2) == 0) {
    bVar3 = *(byte *)(param_1 + 0x2b);
LAB_004d9b24:
    uVar1 = unit_type_array_person[bVar3].next_state;
  }
  else {
    bVar3 = *(byte *)(param_1 + 0x2b);
    if (bVar3 != 7) goto LAB_004d9b24;
    uVar1 = 0x27;
  }
  *(undefined1 *)(param_1 + 0x2c) = uVar1;
  uVar7 = init_unit_class(param_1);
switchD_004d96d4_caseD_4:
  return uVar7 & 0xffffff00;
}
