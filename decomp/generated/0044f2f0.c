/* Ghidra 12.1.3 pseudocode; entry 0044f2f0; FUN_0044f2f0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_0044f2f0(byte param_1,undefined4 param_2,undefined4 param_3,char param_4)

{
  undefined4 *puVar1;
  unit_struct *puVar2;
  uint *puVar3;
  char cVar4;
  byte bVar5;
  ushort uVar6;
  short sVar7;
  uint uVar8;
  uint uVar9;
  int iVar10;
  int iVar11;
  uint uVar12;
  int iVar13;
  uint *puVar14;
  char local_3e;
  char cStack_3d;
  undefined2 local_3c;
  undefined2 local_3a;
  int local_2c;
  uint local_20;
  ushort local_1c;
  int local_18;
  ushort local_14;
  int local_10;
  ushort local_c;
  int local_8;
  ushort local_4;

  uVar12 = 0;
  bVar5 = param_1 & 1;
  if (bVar5 != 0) {
    uVar12 = 4;
    set_landscape_flags_2_flag_2();
  }
  param_1 = param_1 & 2;
  if (param_1 != 0) {
    uVar12 = uVar12 | 8;
  }
  local_3e = (char)param_2;
  cStack_3d = (char)((uint)param_2 >> 8);
  cStack_3d = cStack_3d + (char)param_3 * -2;
  iVar11 = (short)param_3 * 2 + 1;
  for (iVar13 = iVar11; local_3c = CONCAT11(cStack_3d,local_3e + (char)param_3 * -2),
      local_2c = iVar11, iVar13 != 0; iVar13 = iVar13 + -1) {
    for (; local_2c != 0; local_2c = local_2c + -1) {
      uVar9 = (local_3c & 0xfe) * 2 | local_3c & 0xfe00;
      for (puVar2 = unit_land_array[(short)(&game_state.level_data[0].unit_index)[uVar9 * 2]];
          puVar2 != (unit_struct *)0x0; puVar2 = unit_land_array[puVar2->next_unit_index]) {
        uVar8 = puVar2->flags_2 | uVar12;
        puVar2->flags_2 = uVar8;
        if ((param_1 != 0) && (puVar2->unit_class == '\x01')) {
          if ((puVar2->unit_type == '\a') && (puVar2->tribe_index == param_4)) {
            puVar2->flags_2 = uVar8 & 0xfffffff7;
          }
          else {
            FUN_004da0d0(puVar2,param_4);
          }
        }
      }
      local_3a._0_1_ = (char)local_3c;
      cVar4 = (char)local_3a;
      local_3a = CONCAT11(local_3c._1_1_ + -2,(char)local_3a);
      local_14 = local_3a;
      local_1c = local_3c;
      local_3a._0_1_ = (char)local_3a + -2;
      local_3a = CONCAT11(local_3c._1_1_ + -2,(char)local_3a);
      uVar6 = local_3a;
      local_c = local_3a;
      local_3a = CONCAT11(local_3c._1_1_,(char)local_3a);
      local_4 = local_3a;
      local_20 = uVar9 * 4 + 0x8a03e4;
      local_18 = ((local_14 & 0xfe) * 2 | local_14 & 0xfe00) * 4 + 0x8a03e4;
      local_10 = ((uVar6 & 0xfe) * 2 | uVar6 & 0xfe00) * 4 + 0x8a03e4;
      puVar14 = &local_20;
      local_8 = ((local_3a & 0xfe) * 2 | local_3a & 0xfe00) * 4 + 0x8a03e4;
      do {
        puVar3 = (uint *)*puVar14;
        uVar6 = (ushort)puVar3[2] & 0x3ff;
        if (uVar6 != 0) {
          puVar2 = unit_land_array[uVar6];
          if ((*puVar3 & 0x200) != 0) {
            if (bVar5 != 0) {
              *puVar3 = *puVar3 | 0x20000;
            }
            if (param_1 != 0) {
              FUN_00408d00(puVar2,param_4);
            }
          }
          puVar1 = &puVar2->flags_2;
          *puVar1 = *puVar1 | uVar12;
        }
        puVar14 = puVar14 + 2;
      } while (puVar14 < &stack0x00000000);
      local_3c = CONCAT11(local_3c._1_1_,cVar4 + '\x02');
    }
    cStack_3d = local_3c._1_1_ + '\x02';
  }
  if (bVar5 != 0) {
    iVar13 = 0x89d1c8;
    FUN_00422a60(param_2,param_3);
    uVar6 = (ushort)param_2;
    local_20._0_2_ = uVar6 & 0xfefe;
    iVar11 = 0;
    sVar7 = (((ushort)local_20 >> 8) + 1) * 0x100;
    local_20 = CONCAT22(sVar7,uVar6) & 0xfffffefe;
    do {
      if ((((*(char *)(iVar13 + 0xc20) != '\0') && (*(int *)(iVar13 + 0x949) == 0)) &&
          (uVar12 = (int)(short)(((uVar6 & 0xfe) + 1) * 0x100) - (int)*(short *)(iVar13 + 0x911),
          uVar9 = (int)uVar12 >> 0x1f, iVar10 = ((short)param_3 + 6) * 0x200,
          (int)((uVar12 ^ uVar9) - uVar9) < iVar10)) &&
         (uVar12 = (int)sVar7 - (int)*(short *)(iVar13 + 0x913), uVar9 = (int)uVar12 >> 0x1f,
         (int)((uVar12 ^ uVar9) - uVar9) < iVar10)) {
        game_state.start_24[iVar11] = 1;
      }
      iVar11 = iVar11 + 1;
      iVar13 = iVar13 + 0xc65;
    } while (iVar11 < 4);
    FUN_004951b0(param_2,param_3);
  }
  return;
}
