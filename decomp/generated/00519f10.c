/* Ghidra 12.1.3 pseudocode; entry 00519f10; FUN_00519f10.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


/* WARNING: Removing unreachable block (ram,0x0051a0b4) */
/* WARNING: Removing unreachable block (ram,0x0051a0be) */

uint FUN_00519f10(int param_1,int param_2)

{
  unit_struct *puVar1;
  char cVar2;
  short sVar3;
  ushort uVar4;
  int iVar5;
  uint uVar6;
  uint uVar7;
  byte bVar8;
  unit_struct *puVar9;

  uVar4 = *(ushort *)(param_1 + 0x76);
  *(ushort *)(param_1 + 0x76) = uVar4 | 8;
  if (*(char *)(param_1 + 0xa9) == '\0') {
    if ((uVar4 & 0x100) != 0) {
      *(undefined1 *)(param_1 + 0x2d) = 0;
      *(uint *)(param_1 + 0xc) = *(uint *)(param_1 + 0xc) | 0x40000000;
      *(ushort *)(param_1 + 0x76) = uVar4 & 0xfeff | 8;
    }
    uVar7 = FUN_0051a2a0(param_1,param_2);
    if ((char)uVar7 == '\0') goto LAB_0051a287;
LAB_0051a27c:
    *(undefined1 *)(param_1 + 0xa9) = 1;
  }
  else {
    *(ushort *)(param_1 + 0x76) = uVar4 & 0xfff7;
    if (*(short *)(param_2 + 4) == 0) {
      ptr_unit_related_20B->field0_0x0 = (uint)*(ushort *)(param_2 + 6);
      ptr_unit_related_20B->field1_0x4 = (uint)*(byte *)(param_2 + 8);
      ptr_unit_related_20B->unit_ptr = (unit_struct *)(uint)*(byte *)(param_2 + 9);
      ptr_unit_related_20B->field3_0xc = 0;
      ptr_unit_related_20B->field4_0x10 = 0;
      ptr_unit_related_20B = ptr_unit_related_20B + 1;
      unit_allocation_flag = 1;
      iVar5 = alloc_unit(10,10,*(undefined1 *)(param_1 + 0x2f),param_1 + 0x3d);
      if (iVar5 != 0) {
        *(undefined2 *)(param_2 + 4) = *(undefined2 *)(iVar5 + 0x24);
      }
    }
    puVar9 = (unit_struct *)0x0;
    if (((*(ushort *)(param_2 + 4) != 0) &&
        (puVar1 = unit_land_array[*(ushort *)(param_2 + 4)], (*(byte *)&puVar1->flags_2 & 1) == 0))
       && (puVar1->unit_class != '\0')) {
      puVar9 = puVar1;
    }
    if (puVar9 == (unit_struct *)0x0) {
      uVar7 = FUN_004d4ee0(param_1);
      goto LAB_0051a27c;
    }
    if ((puVar9->field_0x78 != '\0') &&
       ((*(char *)(param_1 + 0x2b) != '\x06' || (*(char *)(param_1 + 0xb2) == '\0')))) {
      *(undefined1 *)(param_1 + 0xa9) = 0;
      *(byte *)(param_1 + 0x77) = *(byte *)(param_1 + 0x77) | 1;
    }
    uVar7 = (uint)*(byte *)(param_1 + 0xa9);
    if (uVar7 != 1) {
      if (uVar7 == 2) {
        if ((*(ushort *)(param_1 + 0x76) & 0x100) != 0) {
          *(ushort *)(param_1 + 0x76) = *(ushort *)(param_1 + 0x76) & 0xfeff;
          FUN_004d4ee0(param_1);
          uVar7 = (uint)(ushort)((puVar9->pos).x - *(short *)(param_1 + 0x3d));
          uVar6 = (uint)(ushort)((puVar9->pos).y - *(short *)(param_1 + 0x3f));
          if (0x7fff < uVar7) {
            uVar7 = uVar7 - 0x10000;
          }
          if (0x7fff < uVar6) {
            uVar6 = uVar6 - 0x10000;
          }
          sVar3 = calc_angle_quadrant(uVar7,-uVar6);
          uVar4 = sVar3 - 0x200U & 0x7ff;
          if ((*(uint *)(param_1 + 0xc) & 0x80) != 0) {
            *(ushort *)(param_1 + 0x57) = uVar4;
          }
          *(ushort *)(param_1 + 0x5d) = uVar4;
          if ((*(uint *)(param_1 + 0xc) & 0x8000) != 0) {
            uVar4 = uVar4 + 0x400 & 0x7ff;
          }
          *(ushort *)(param_1 + 0x26) = uVar4;
        }
        if ((*(byte *)(param_1 + 0x2e) & 0xf) == 0) {
          sVar3 = puVar9->obj_index_anim_prev_2;
          iVar5 = calc_distance_toroidal(param_1 + 0x3d,&puVar9->pos);
          if (((char)sVar3 + 2) * 0x100 < iVar5) {
            FUN_004e9d80(param_1,&puVar9->pos);
            *(undefined1 *)(param_1 + 0xa9) = 1;
            *(byte *)(param_1 + 0x77) = *(byte *)(param_1 + 0x77) | 1;
          }
        }
        uVar7 = FUN_00432da0(param_1 + 0x3d,6,param_1 + 0x4f,6);
        cVar2 = (char)uVar7;
      }
      else {
        if (uVar7 != 3) goto LAB_0051a287;
        if ((*(ushort *)(param_1 + 0x76) & 0x100) != 0) {
          *(ushort *)(param_1 + 0x76) = *(ushort *)(param_1 + 0x76) & 0xfeff;
          if (*(short *)(param_1 + 0x78) == 0) {
            bVar8 = *(byte *)(unit_type_to_obj_indexes_map + *(byte *)(param_1 + 0x2b) + 0x3f);
            unit_set_object_upper(param_1,bVar8);
            *(undefined1 *)(param_1 + 0x39) = 0;
            *(short *)(param_1 + 0x37) =
                 (short)(char)obj_related_array[*(byte *)(param_1 + 0x3a) + 3].f1;
          }
          else {
            bVar8 = *(byte *)(unit_type_to_obj_indexes_map + *(byte *)(param_1 + 0x2b) + 0x24);
            unit_set_object_upper(param_1,bVar8);
          }
          *(byte *)(param_1 + 0x76) = *(byte *)(param_1 + 0x76) | 0x80;
          *(char *)(param_1 + 0xaa) =
               vstart_related[(short)obj_indexes_table[(uint)bVar8 * 2]].frame_counter *
               (obj_related_array[*(byte *)(param_1 + 0x3a) + 3]._f2 + '\x01');
        }
        cVar2 = *(char *)(param_1 + 0xaa) + -1;
        *(char *)(param_1 + 0xaa) = cVar2;
        if (cVar2 < '\x01') {
          *(undefined1 *)(param_1 + 0xa9) = 2;
          *(byte *)(param_1 + 0x77) = *(byte *)(param_1 + 0x77) | 1;
        }
        uVar7 = FUN_00432da0(param_1 + 0x3d,6,param_1 + 0x4f,6);
        cVar2 = (char)uVar7;
      }
      if (cVar2 != '\0') goto LAB_0051a287;
      goto LAB_0051a27c;
    }
    if ((*(ushort *)(param_1 + 0x76) & 0x100) != 0) {
      *(ushort *)(param_1 + 0x76) = *(ushort *)(param_1 + 0x76) & 0xfeff;
      FUN_004d4f40(param_1);
    }
    uVar6 = (int)*(short *)(param_1 + 0x4f) - (int)*(short *)(param_1 + 0x3d);
    uVar7 = (int)uVar6 >> 0x1f;
    uVar7 = (uVar6 ^ uVar7) - uVar7;
    if ((0xb < (int)uVar7) ||
       (uVar7 = (int)*(short *)(param_1 + 0x51) - (int)*(short *)(param_1 + 0x3f),
       uVar6 = (int)uVar7 >> 0x1f, iVar5 = (uVar7 ^ uVar6) - uVar6,
       uVar7 = CONCAT31((int3)((uint)iVar5 >> 8),1), 0xb < iVar5)) {
      uVar7 = uVar7 & 0xffffff00;
    }
    if ((char)uVar7 == '\0') goto LAB_0051a287;
    *(undefined1 *)(param_1 + 0xa9) = 2;
    *(undefined2 *)(param_1 + 0x5f) = 0;
  }
  *(byte *)(param_1 + 0x77) = *(byte *)(param_1 + 0x77) | 1;
LAB_0051a287:
  if (*(char *)(param_1 + 0x2e) == '\0') {
    uVar7 = FUN_0043d050(param_2);
  }
  return uVar7 & 0xffffff00;
}
