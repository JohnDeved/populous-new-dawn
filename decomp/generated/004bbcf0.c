/* Ghidra 12.1.3 pseudocode; entry 004bbcf0; FUN_004bbcf0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_004bbcf0(int param_1)

{
  int iVar1;
  unit_struct *puVar2;
  undefined4 *puVar3;
  bool bVar4;
  undefined2 uVar5;
  short sVar6;
  undefined2 extraout_var;
  uint uVar7;
  undefined2 extraout_var_00;
  undefined2 extraout_var_01;
  undefined2 extraout_var_02;
  unit_related_struct_20B *puVar8;
  bool bVar9;
  undefined2 local_10;
  undefined2 local_e;
  int local_c;
  undefined4 local_8;
  undefined2 local_4;

  bVar4 = false;
  puVar8 = (unit_related_struct_20B *)0x0;
  if ((*(uint *)(param_1 + 0xc) & 0x400) != 0) {
    *(uint *)(param_1 + 0xc) = *(uint *)(param_1 + 0xc) & 0xfffffbff;
    ptr_unit_related_20B = ptr_unit_related_20B + -1;
    puVar8 = ptr_unit_related_20B;
  }
  if (puVar8 != (unit_related_struct_20B *)0x0) {
    unit_set_object(param_1 + 0x33,0x1d,0x460);
    *(undefined2 *)(param_1 + 0x5f) = 0x200;
    *(ushort *)(param_1 + 0x35) = *(ushort *)(param_1 + 0x35) & 0xbfff;
    local_c = puVar8->field0_0x0;
    iVar1 = puVar8->field1_0x4;
    puVar2 = puVar8->unit_ptr;
    puVar3 = (undefined4 *)puVar8->field3_0xc;
    bVar9 = puVar3 != (undefined4 *)0x0;
    if (bVar9) {
      local_8 = *puVar3;
      local_4 = *(undefined2 *)(puVar3 + 1);
    }
    if ((iVar1 != 0) && ((puVar2 != (unit_struct *)0x0 || (bVar9)))) {
      *(undefined2 *)(param_1 + 0x26) = *(undefined2 *)(iVar1 + 0x5d);
      *(undefined2 *)(param_1 + 0x88) = *(undefined2 *)(iVar1 + 0x24);
      if (puVar2 != (unit_struct *)0x0) {
        *(undefined2 *)(param_1 + 0x8a) = puVar2->unit_index;
        if (puVar2->unit_class == '\x02') {
          get_building_coords(puVar2,&local_10);
          *(undefined2 *)(param_1 + 0x7a) = 0;
          *(undefined2 *)(param_1 + 0x76) = local_10;
          *(undefined2 *)(param_1 + 0x78) = local_e;
          uVar5 = calc_point_height(CONCAT22(extraout_var_01,local_10),
                                    CONCAT22(extraout_var,local_e));
          *(undefined2 *)(param_1 + 0x7a) = uVar5;
        }
        else {
          *(undefined4 *)(param_1 + 0x76) = *(undefined4 *)&puVar2->pos;
          *(undefined2 *)(param_1 + 0x7a) = (puVar2->pos).z;
        }
        *(short *)(param_1 + 0x7a) = *(short *)(param_1 + 0x7a) + puVar2->mid2 + 0x10;
      }
      if (bVar9) {
        *(undefined4 *)(param_1 + 0x76) = local_8;
        *(undefined2 *)(param_1 + 0x7a) = local_4;
      }
      if (local_c == 0) {
        uVar7 = (int)*(short *)(param_1 + 0x26) - 0x200;
      }
      else {
        uVar7 = (int)*(short *)(param_1 + 0x26) + 0x200;
      }
      puVar3 = (undefined4 *)(param_1 + 0x3d);
      move_pos_angle_length(puVar3,uVar7 & 0x7ff,0x60);
      sVar6 = calc_point_height(CONCAT22(extraout_var_02,*(undefined2 *)puVar3),
                                CONCAT22(extraout_var_00,*(undefined2 *)(param_1 + 0x3f)));
      if (*(short *)(param_1 + 0x41) < sVar6) {
        *(short *)(param_1 + 0x41) = sVar6;
      }
      *(short *)(param_1 + 0x41) = *(short *)(param_1 + 0x41) + *(short *)(iVar1 + 0x1c) + 0x10;
      insert_unit_into_land_tile(param_1,puVar3);
      *(undefined4 *)(param_1 + 0x70) = *puVar3;
      *(undefined2 *)(param_1 + 0x74) = *(undefined2 *)(param_1 + 0x41);
      if (local_c != 0) {
        sunlight_update_unit_landscape(param_1,2,4,0);
        if (puVar2 != (unit_struct *)0x0) {
          *(undefined1 *)(param_1 + 0x7c) = 1;
        }
        if (bVar9) {
          *(undefined1 *)(param_1 + 0x7c) = 2;
        }
      }
      if ((*(byte *)(iVar1 + 0x11) & 8) != 0) {
        *(uint *)(param_1 + 0x10) = *(uint *)(param_1 + 0x10) | 0x800;
      }
      if ((*(byte *)(param_1 + 0xe) & 0x10) == 0) {
        empty_unit_function(param_1);
        *(undefined1 *)(param_1 + 0x2c) = 6;
        init_unit_class(param_1);
      }
      FUN_0048a050(param_1,0xa1,0);
      *(byte *)(param_1 + 0x36) = *(byte *)(param_1 + 0x36) | 0x80;
      *(uint *)(param_1 + 0x14) = *(uint *)(param_1 + 0x14) | 0x100;
      goto LAB_004bbf0d;
    }
  }
  bVar4 = true;
LAB_004bbf0d:
  if (bVar4) {
    update_after_unit_alloc(param_1);
  }
  return;
}
