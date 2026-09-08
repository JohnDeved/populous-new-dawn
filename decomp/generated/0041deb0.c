/* Ghidra 12.1.3 pseudocode; entry 0041deb0; add_unit_polygons_globe.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void add_unit_polygons_globe(int param_1)

{
  undefined2 uVar1;
  unit_struct *puVar2;
  undefined2 uVar3;
  union_polygon *puVar4;
  undefined2 uVar5;
  int iVar6;
  short *psVar7;
  short local_b4;
  short sStack_b2;
  undefined1 local_b0 [4];
  undefined1 local_ac [4];
  undefined1 local_a8 [4];
  undefined1 local_a4 [4];
  undefined1 local_a0 [24];
  undefined4 local_88;
  undefined1 local_80 [24];
  undefined4 local_68;
  undefined1 local_60 [24];
  undefined4 local_48;
  undefined1 local_40 [24];
  undefined4 local_28;
  undefined1 local_20 [24];
  undefined4 local_8;

  puVar2 = unit_land_array[*(short *)(param_1 + 6)];
  while ((puVar2 != (unit_struct *)0x0 && (empty_polygon < polypool_mem_end_2))) {
    if ((((puVar2->object).flags & 0x10) == 0) && ((*(byte *)((int)&puVar2->flags_4 + 2) & 2) == 0))
    {
      iVar6 = can_show_unit_icon(puVar2,param_1);
      puVar4 = empty_polygon;
      if (iVar6 != 0) {
        switch(puVar2->unit_class) {
        case 1:
          if ((*(byte *)((int)&puVar2->flags_2 + 2) & 0x80) == 0) {
            empty_polygon = (union_polygon *)&(empty_polygon->field0).point_1_u;
            tex_struct_convert_to_tex_coords
                      ((int)(short)(puVar2->pos).x,(int)(short)(puVar2->pos).y,local_b0,local_ac);
            (puVar4->field0).next = polygons_to_draw[0];
            polygons_to_draw[0] = &puVar4->field0;
            uVar5 = __ftol();
            *(undefined2 *)&(puVar4->field0).point_1_y = uVar5;
            uVar5 = __ftol();
            *(undefined2 *)((int)&(puVar4->field0).point_1_y + 2) = uVar5;
            (puVar4->field0).point_1_x = puVar2;
          }
          break;
        case 3:
          empty_polygon = (union_polygon *)&(empty_polygon->field0).point_1_u;
          convert_globe_coords(puVar2,local_a0);
          local_88 = 0;
          (puVar4->field0).next = polygons_to_draw[3];
          polygons_to_draw[3] = &puVar4->field0;
          uVar5 = __ftol();
          *(undefined2 *)&(puVar4->field0).point_1_y = uVar5;
          uVar5 = __ftol();
          *(undefined2 *)((int)&(puVar4->field0).point_1_y + 2) = uVar5;
          (puVar4->field0).point_1_x = puVar2;
          break;
        case 5:
          if (puVar2->unit_type == '\f') {
            empty_polygon = (union_polygon *)&(empty_polygon->field0).point_1_u;
            tex_struct_convert_to_tex_coords
                      ((int)(short)(puVar2->pos).x,(int)(short)(puVar2->pos).y,local_a8,local_a4);
            (puVar4->field0).next = polygons_to_draw[8];
            polygons_to_draw[8] = &puVar4->field0;
            uVar5 = __ftol();
            *(undefined2 *)&(puVar4->field0).point_1_y = uVar5;
            uVar5 = __ftol();
            *(undefined2 *)((int)&(puVar4->field0).point_1_y + 2) = uVar5;
            (puVar4->field0).point_1_x = puVar2;
          }
          else {
            FUN_0041e3d0(puVar2);
          }
          break;
        case 7:
          switch(puVar2->unit_type) {
          case 2:
            empty_polygon = (union_polygon *)&(empty_polygon->field0).point_1_u;
            convert_globe_coords(puVar2,local_80);
            local_68 = 0;
            (puVar4->field0).next = polygons_to_draw[5];
            polygons_to_draw[5] = &puVar4->field0;
            uVar5 = __ftol();
            *(undefined2 *)&(puVar4->field0).point_1_y = uVar5;
            uVar5 = __ftol();
            *(undefined2 *)((int)&(puVar4->field0).point_1_y + 2) = uVar5;
            (puVar4->field0).point_1_x = puVar2;
            break;
          case 3:
          case 4:
          case 10:
            empty_polygon = (union_polygon *)&(empty_polygon->field0).point_1_u;
            convert_globe_coords(puVar2,local_60);
            local_48 = 0;
            (puVar4->field0).next = polygons_to_draw[6];
            polygons_to_draw[6] = &puVar4->field0;
            uVar5 = __ftol();
            *(undefined2 *)&(puVar4->field0).point_1_y = uVar5;
            uVar5 = __ftol();
            *(undefined2 *)((int)&(puVar4->field0).point_1_y + 2) = uVar5;
            (puVar4->field0).point_1_x = puVar2;
            break;
          case 0x1b:
            empty_polygon = (union_polygon *)&(empty_polygon->field0).point_1_u;
            convert_globe_coords(puVar2,local_40);
            local_28 = 0;
            (puVar4->field0).next = polygons_to_draw[7];
            polygons_to_draw[7] = &puVar4->field0;
            uVar5 = __ftol();
            *(undefined2 *)&(puVar4->field0).point_1_y = uVar5;
            uVar5 = __ftol();
            iVar6 = 5;
            *(undefined2 *)((int)&(puVar4->field0).point_1_y + 2) = uVar5;
            (puVar4->field0).point_1_x = puVar2;
            uVar1 = (puVar2->pos).x;
            uVar3 = (puVar2->pos).y;
            psVar7 = &puVar2->obj_index_anim_prev_2;
            do {
              (puVar2->pos).x = *psVar7 + uVar1;
              (puVar2->pos).y = psVar7[1] + uVar3;
              FUN_0041e4e0(puVar2);
              iVar6 = iVar6 + -1;
              psVar7 = psVar7 + 2;
            } while (iVar6 != 0);
            (puVar2->pos).x = uVar1;
            (puVar2->pos).y = uVar3;
          }
          break;
        case 10:
          if (puVar2->unit_type == '\x03') {
            empty_polygon = (union_polygon *)&(empty_polygon->field0).point_1_u;
            convert_globe_coords(puVar2,local_20);
            local_8 = 0;
            (puVar4->field0).next = polygons_to_draw[4];
            polygons_to_draw[4] = &puVar4->field0;
            uVar5 = __ftol();
            *(undefined2 *)&(puVar4->field0).point_1_y = uVar5;
            uVar5 = __ftol();
            *(undefined2 *)((int)&(puVar4->field0).point_1_y + 2) = uVar5;
            (puVar4->field0).point_1_x = puVar2;
          }
        }
      }
    }
    else if (puVar2->unit_class == '\x01') {
      if (puVar2->unit_type == '\b') {
        add_aod_globe(puVar2);
      }
    }
    else if ((puVar2->unit_class == '\n') && (puVar2->unit_type == '\b')) {
      FUN_0041e460(puVar2);
    }
    puVar2 = unit_land_array[puVar2->next_unit_index];
  }
  return;
}
