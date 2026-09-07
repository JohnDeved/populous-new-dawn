/* Ghidra 12.1.3 pseudocode; entry 0046ec80; draw_unit_on_land_pos.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void draw_unit_on_land_pos(uint *param_1)

{
  ushort *puVar1;
  byte bVar2;
  ushort uVar3;
  undefined2 uVar4;
  unit_struct *puVar5;
  unit_struct *puVar6;
  undefined2 uVar7;
  uint uVar8;
  int iVar9;
  short *psVar10;
  short local_8;
  short sStack_6;
  int local_4;

  local_4 = 0;
  do {
    puVar5 = unit_land_array[*(short *)((int)param_1 + 6)];
    while ((puVar5 != (unit_struct *)0x0 && (empty_polygon < polypool_mem_end_2))) {
      uVar3 = (puVar5->object).flags;
      if ((uVar3 & 0x10) != 0) goto switchD_0046ee91_caseD_2;
      bVar2 = (puVar5->object).obj_related_index;
      if (local_4 != 0) {
        switch(obj_related_array[bVar2 + 3].type) {
        case 2:
          (puVar5->object).flags = uVar3 | 1;
          break;
        case 3:
          if ((uVar3 & 1) == 0) {
            if ((((puVar5->unit_class == '\x05') && (puVar5->unit_type != 0)) &&
                ((byte)puVar5->unit_type < 7)) &&
               (uVar8 = add_object_to_rendering_queue_type_3(puVar5), 0 < (int)(uVar8 & 0xfffffffc))
               ) {
              DAT_0087cbbc = DAT_0087cbbc + 1;
            }
            uVar3 = (puVar5->object).flags;
            (puVar5->object).flags = uVar3 | 1;
            if ((uVar3 & 8) != 0) {
              animate_3d_morph(puVar5);
            }
            (*object_to_polygons_ptr)(puVar5);
            if (((puVar5->object).flags & 0x8000) != 0) {
              add_object_to_rendering_queue_different(puVar5,1);
            }
          }
          break;
        case 4:
          (puVar5->object).flags = uVar3 | 1;
          (*object_to_polygons_ptr_2)(puVar5);
          break;
        case 0xb:
          if (puVar5->state_2 == '\x01') {
            (puVar5->object).flags = uVar3 | 1;
            add_object_to_rendering_queue_type_0xb(puVar5);
          }
          break;
        case 0xc:
          (puVar5->object).flags = uVar3 | 1;
          add_object_to_rendering_queue_type_0xc(puVar5);
          if (((puVar5->object).flags & 0x8000) != 0) {
            add_object_to_rendering_queue_different(puVar5,0);
          }
          break;
        case 0xe:
          puVar6 = unit_land_array[(ushort)puVar5->coord_scale_4];
          if ((puVar6 != (unit_struct *)0x0) && (uVar3 = (puVar6->object).flags, (uVar3 & 1) == 0))
          {
            (puVar6->object).flags = uVar3 | 1;
            if ((uVar3 & 8) != 0) {
              animate_3d_morph(puVar6);
            }
            (*object_to_polygons_ptr)(puVar6);
          }
          break;
        case 0xf:
          if ((uVar3 & 1) == 0) {
            (puVar5->object).flags = uVar3 | 1;
            render_object_with_faces(puVar5);
          }
          break;
        case 0x10:
          render_object_type_0x10(param_1,*param_1 & 0x180000,*param_1 & 0x600000,puVar5);
        }
        goto switchD_0046ee91_caseD_2;
      }
      if ((((*(byte *)((int)&puVar5->flags_3 + 1) & 0x80) != 0) &&
          (iVar9 = add_object_to_rendering_queue_type_3(puVar5), iVar9 != -1)) &&
         (DAT_0087cb4c = DAT_0087cb4c + 1, iVar9 < DAT_0074a338)) {
        DAT_0074a338 = iVar9;
      }
      switch(obj_related_array[bVar2 + 3].type) {
      case 1:
        if ((puVar5->object).obj_index != 0x650) {
          next_polygon_type = 1;
          add_object_to_rendering_queue_type_1_10(param_1,puVar5);
          uVar3 = (puVar5->object).flags;
          (puVar5->object).flags = uVar3 | 1;
          if ((uVar3 & 0x8000) != 0) {
            add_object_to_rendering_queue_different(puVar5,0);
          }
        }
      default:
        goto switchD_0046ee91_caseD_2;
      case 5:
        add_object_to_rendering_queue_type_5(param_1,puVar5);
        break;
      case 7:
        add_object_to_rendering_queue_type_7(param_1,puVar5);
        break;
      case 8:
        add_object_to_rendering_queue_type_8(param_1,puVar5);
        break;
      case 9:
        if (puVar5->state_2 != '\b') {
          add_object_to_rendering_queue_type_9(param_1,puVar5);
          break;
        }
        goto switchD_0046ee91_caseD_2;
      case 10:
        next_polygon_type = 0xd;
        add_object_to_rendering_queue_type_1_10(param_1,puVar5);
        uVar3 = (puVar5->object).flags;
        (puVar5->object).flags = uVar3 | 1;
        if ((uVar3 & 0x8000) != 0) {
          add_object_to_rendering_queue_different(puVar5,0);
        }
        goto switchD_0046ee91_caseD_2;
      case 0xd:
        iVar9 = 5;
        add_object_to_rendering_queue_type_0xd(param_1,puVar5);
        uVar4 = (puVar5->pos).x;
        uVar7 = (puVar5->pos).y;
        psVar10 = &puVar5->obj_index_anim_prev_2;
        do {
          (puVar5->pos).x = *psVar10 + uVar4;
          (puVar5->pos).y = psVar10[1] + uVar7;
          add_object_to_rendering_queue_type_0xd(param_1,puVar5);
          iVar9 = iVar9 + -1;
          psVar10 = psVar10 + 2;
        } while (iVar9 != 0);
        (puVar5->pos).x = uVar4;
        (puVar5->pos).y = uVar7;
        break;
      case 0x11:
        add_object_to_rendering_queue_type_0x11
                  (param_1,puVar5,(int)(short)puVar5->coord_scale_4,
                   (int)*(short *)((int)&puVar5->coord_scale_4 + 2));
        uVar3 = (puVar5->object).flags;
        (puVar5->object).flags = uVar3 | 1;
        if ((uVar3 & 0x8000) != 0) {
          add_object_to_rendering_queue_different(puVar5,0);
        }
        goto switchD_0046ee91_caseD_2;
      case 0x12:
        add_object_to_rendering_queue_type_0x12(puVar5);
        break;
      case 0x13:
        add_object_to_rendering_queue_type_0x13(param_1,puVar5);
      }
      puVar1 = &(puVar5->object).flags;
      *(byte *)puVar1 = (byte)*puVar1 | 1;
switchD_0046ee91_caseD_2:
      puVar5 = unit_land_array[puVar5->next_unit_index];
    }
    local_4 = local_4 + 1;
    if (1 < local_4) {
      return;
    }
  } while( true );
}
