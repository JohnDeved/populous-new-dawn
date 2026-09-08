/* Ghidra 12.1.3 pseudocode; entry 004a9030; FUN_004a9030.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_004a9030(int param_1,char param_2)

{
  char cVar1;
  char cVar2;
  byte bVar3;
  int iVar4;
  unit_struct *puVar5;
  unit_type_scenery *puVar6;
  char cVar7;
  ushort uVar8;
  ushort uVar9;
  ushort uVar10;
  ushort uVar11;
  ushort uVar12;
  ushort uVar13;
  char cVar14;
  ushort uVar15;
  ushort uVar16;
  uint uVar17;
  unit_struct *puVar18;
  int *piVar19;
  undefined2 local_4a;
  int local_48;
  ushort local_44;
  int local_40;
  ushort local_3c;
  int local_38;
  ushort local_34;
  int local_30;
  ushort local_2c;
  int local_28;
  ushort local_24;
  int local_20;
  ushort local_1c;
  int local_18;
  ushort local_14;
  int local_10;
  ushort local_c;
  int local_8;
  ushort local_4;

  local_48._0_2_ =
       CONCAT11((char)((ushort)*(undefined2 *)(param_1 + 0x3f) >> 8),
                (char)((ushort)*(undefined2 *)(param_1 + 0x3d) >> 8)) & 0xfefe;
  uVar15 = (ushort)local_48;
  local_4a._0_1_ = (char)(ushort)local_48;
  cVar7 = (char)local_4a;
  local_4a._1_1_ = (char)((ushort)local_48 >> 8);
  cVar14 = local_4a._1_1_;
  local_4a._1_1_ = local_4a._1_1_ + '\x02';
  local_4a = CONCAT11(local_4a._1_1_,(char)local_4a + -2);
  uVar16 = local_4a;
  local_44 = local_4a;
  local_4a = CONCAT11(local_4a._1_1_,cVar7);
  uVar8 = local_4a;
  local_3c = local_4a;
  cVar1 = cVar7 + '\x02';
  local_4a = CONCAT11(local_4a._1_1_,cVar1);
  uVar9 = local_4a;
  local_34 = local_4a;
  local_4a = CONCAT11(cVar14,cVar1);
  uVar10 = local_4a;
  local_2c = local_4a;
  cVar2 = cVar14 + -2;
  local_4a = CONCAT11(cVar2,cVar1);
  uVar11 = local_4a;
  local_24 = local_4a;
  local_4a = CONCAT11(cVar2,cVar7);
  uVar12 = local_4a;
  local_1c = local_4a;
  local_4a = CONCAT11(cVar2,cVar7 + -2);
  uVar13 = local_4a;
  local_14 = local_4a;
  local_4a = CONCAT11(cVar14,cVar7 + -2);
  local_c = local_4a;
  local_4 = (ushort)local_48;
  local_48 = ((uVar16 & 0xfe) * 2 | uVar16 & 0xfe00) * 4 + 0x8a03e4;
  local_40 = ((uVar8 & 0xfe) * 2 | uVar8 & 0xfe00) * 4 + 0x8a03e4;
  local_38 = ((uVar9 & 0xfe) * 2 | uVar9 & 0xfe00) * 4 + 0x8a03e4;
  local_30 = ((uVar10 & 0xfe) * 2 | uVar10 & 0xfe00) * 4 + 0x8a03e4;
  local_28 = ((uVar11 & 0xfe) * 2 | uVar11 & 0xfe00) * 4 + 0x8a03e4;
  local_20 = ((uVar12 & 0xfe) * 2 | uVar12 & 0xfe00) * 4 + 0x8a03e4;
  local_18 = ((uVar13 & 0xfe) * 2 | uVar13 & 0xfe00) * 4 + 0x8a03e4;
  piVar19 = &local_48;
  local_10 = ((local_4a & 0xfe) * 2 | local_4a & 0xfe00) * 4 + 0x8a03e4;
  local_8 = ((uVar15 & 0xfe) * 2 | uVar15 & 0xfe00) * 4 + 0x8a03e4;
  do {
    iVar4 = *piVar19;
    uVar16 = *(ushort *)(iVar4 + 8) & 0x3ff;
    if (uVar16 == 0) {
LAB_004a92d4:
      if (param_2 == '\0') {
        for (puVar5 = unit_land_array[*(short *)(iVar4 + 6)]; puVar5 != (unit_struct *)0x0;
            puVar5 = unit_land_array[puVar5->next_unit_index]) {
          if ((((puVar5->unit_class == '\x05') && (bVar3 = puVar5->unit_type, bVar3 != 0xb)) &&
              ((*(byte *)&puVar5->loc_4_z & 4) == 0)) &&
             ((puVar6 = unit_type_array_scenery + bVar3, uVar17._0_1_ = puVar6->flags_1,
              uVar17._1_1_ = puVar6->flags, uVar17._2_1_ = puVar6->field14_0x16,
              uVar17._3_1_ = puVar6->field15_0x17, (uVar17 & 0x20) != 0 &&
              (puVar5->unit_class == '\x05')))) {
            if (bVar3 == 10) {
              puVar5->loc_1_y = 0;
              *(byte *)&puVar5->loc_4_z = *(byte *)&puVar5->loc_4_z | 4;
            }
            else if ((*(byte *)((int)&puVar5->flags_2 + 2) & 0x10) == 0) {
              empty_unit_function(puVar5);
              puVar5->state = 5;
              init_unit_class(puVar5);
            }
          }
        }
      }
    }
    else {
      puVar5 = unit_land_array[uVar16];
      puVar18 = (unit_struct *)0x0;
      if (((*(byte *)&puVar5->flags_2 & 1) == 0) && (puVar5->unit_class != '\0')) {
        puVar18 = puVar5;
      }
      if (puVar18 == (unit_struct *)0x0) goto LAB_004a92d4;
      if ((*(byte *)(iVar4 + 1) & 2) != 0) {
        uVar17 = (uint)*(ushort *)&unit_type_array_building[(byte)puVar18->unit_type].field_0x2e;
        if (param_2 != '\0') {
          uVar17 = (int)uVar17 >> 2;
        }
        FUN_00409200(puVar18,uVar17,0xffffffff);
        goto LAB_004a92d4;
      }
      if (param_2 == '\0') {
        FUN_004ba410(puVar18);
        goto LAB_004a92d4;
      }
    }
    piVar19 = piVar19 + 2;
    if (&stack0x00000000 <= piVar19) {
      return;
    }
  } while( true );
}
