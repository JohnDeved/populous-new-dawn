/* Ghidra 12.1.3 pseudocode; entry 005090f0; FUN_005090f0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_005090f0(int param_1,undefined4 param_2,unit_struct *param_3,undefined4 *param_4)

{
  vector_48b *pvVar1;
  ushort uVar2;
  short sVar3;
  undefined2 uVar4;
  undefined2 uVar5;
  undefined2 uVar7;
  undefined2 uVar8;
  unit_struct *puVar6;
  int iVar9;
  int iVar10;
  unit_struct *puVar11;
  undefined4 uVar12;
  uint uVar13;
  ushort local_c;
  ushort uStack_a;
  short local_8;
  ushort local_4;
  ushort local_2;

  pvVar1 = &param_3->pos;
  puVar11 = (unit_struct *)0x0;
  uVar4 = pvVar1->x;
  uVar7 = pvVar1->y;
  local_8 = (param_3->pos).z;
  local_c = uVar4;
  uStack_a = uVar7;
  if (param_3->unit_class == '\x02') {
    puVar6 = param_3;
    if (param_3->unit_type == '\x13') {
      uVar5 = pvVar1->x;
      uVar8 = pvVar1->y;
      local_8 = (param_3->pos).z;
      local_c = (uVar5 & 0xfe00) + 0x100;
      uVar12 = CONCAT22(uVar8,local_c);
      uStack_a = (uVar8 & 0xfe00) + 0x100;
      uVar13 = CONCAT22(local_8,uStack_a);
LAB_005091c9:
      local_8 = calc_point_height(uVar12,uVar13);
      puVar6 = puVar11;
    }
LAB_005091d6:
    puVar11 = puVar6;
    if (puVar11 == (unit_struct *)0x0) goto LAB_00509267;
  }
  else {
    puVar6 = puVar11;
    if (param_3->unit_class != '\t') goto LAB_005091d6;
    uVar2._0_1_ = param_3->num_points;
    uVar2._1_1_ = param_3->tex_size_type;
    puVar11 = (unit_struct *)0x0;
    if (((uVar2 != 0) && (puVar6 = unit_land_array[uVar2], (*(byte *)&puVar6->flags_2 & 1) == 0)) &&
       (puVar6->unit_class != '\0')) {
      puVar11 = puVar6;
    }
    if (puVar11 == (unit_struct *)0x0) {
      FUN_004ba130(param_3,&local_4);
      local_8 = 0;
      local_c = local_4;
      uVar12 = CONCAT22(uStack_a,local_4);
      uStack_a = local_2;
      uVar13 = (uint)local_2;
      goto LAB_005091c9;
    }
  }
  iVar9 = FUN_00404540(puVar11,unit_type_array_building[(byte)puVar11->unit_type].field_0x33,
                       &local_c);
  if (iVar9 == 0) {
    get_building_coords(puVar11,&local_4);
    local_8 = 0;
    local_c = local_4;
    uVar12 = CONCAT22(uStack_a,local_4);
    uStack_a = local_2;
    local_8 = calc_point_height(uVar12,local_2);
  }
  else if (puVar11->state == '\x01') {
    iVar10 = (char)puVar11->field_0x78 * iVar9;
    local_8 = local_8 + ((short)((int)(iVar10 + (iVar10 >> 0x1f & 3U)) >> 2) - (short)iVar9);
  }
LAB_00509267:
  sVar3 = *(short *)(param_1 + 8);
  *param_4 = CONCAT22(uStack_a,local_c);
  *(short *)(param_4 + 1) = local_8 + sVar3;
  return;
}
