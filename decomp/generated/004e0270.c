/* Ghidra 12.1.3 pseudocode; entry 004e0270; FUN_004e0270.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


/* WARNING: Removing unreachable block (ram,0x004e0542) */
/* WARNING: Removing unreachable block (ram,0x004e054c) */

void FUN_004e0270(unit_struct *param_1,int param_2)

{
  char cVar1;
  char cVar2;
  unit_struct *puVar3;
  char cVar4;
  char cVar5;
  ushort uVar6;
  ushort uVar7;
  ushort uVar8;
  ushort uVar9;
  uint uVar10;
  uint uVar11;
  int iVar12;
  undefined4 local_50;
  int *local_4c;
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

  if (((param_1->class_counter & 7) == 0) && (param_1->unit_type == '\a')) {
    local_48._0_2_ =
         CONCAT11((char)((ushort)(param_1->pos).y >> 8),(char)((ushort)(param_1->pos).x >> 8)) &
         0xfefe;
    local_50._0_1_ = (char)(ushort)local_48;
    cVar5 = (char)local_50;
    cVar4 = (char)((ushort)local_48 >> 8);
    cVar1 = cVar4 + '\x02';
    local_50._0_2_ = CONCAT11(cVar1,(char)local_50 + -2);
    uVar9 = (ushort)local_50;
    local_44 = (ushort)local_50;
    local_3c = CONCAT11(cVar1,cVar5);
    cVar2 = cVar5 + '\x02';
    local_34 = CONCAT11(cVar1,cVar2);
    local_50._0_2_ = CONCAT11(cVar4,cVar2);
    uVar6 = (ushort)local_50;
    local_2c = (ushort)local_50;
    cVar1 = cVar4 + -2;
    local_50._0_2_ = CONCAT11(cVar1,cVar2);
    uVar7 = (ushort)local_50;
    local_24 = (ushort)local_50;
    local_1c = CONCAT11(cVar1,cVar5);
    local_14 = CONCAT11(cVar1,cVar5 + -2);
    local_50._0_2_ = CONCAT11(cVar4,cVar5 + -2);
    uVar8 = (ushort)local_50;
    local_c = (ushort)local_50;
    local_4 = (ushort)local_48;
    local_50 = (uint)(ushort)local_48;
    local_40 = ((local_3c & 0xfe) * 2 | local_3c & 0xfe00) * 4 + 0x8a03e4;
    local_38 = ((local_34 & 0xfe) * 2 | local_34 & 0xfe00) * 4 + 0x8a03e4;
    local_30 = ((uVar6 & 0xfe) * 2 | uVar6 & 0xfe00) * 4 + 0x8a03e4;
    local_28 = ((uVar7 & 0xfe) * 2 | uVar7 & 0xfe00) * 4 + 0x8a03e4;
    local_20 = ((local_1c & 0xfe) * 2 | local_1c & 0xfe00) * 4 + 0x8a03e4;
    local_18 = ((local_14 & 0xfe) * 2 | local_14 & 0xfe00) * 4 + 0x8a03e4;
    local_10 = ((uVar8 & 0xfe) * 2 | uVar8 & 0xfe00) * 4 + 0x8a03e4;
    iVar12 = 0;
    cVar1 = param_1->tribe_index;
    local_8 = (((ushort)local_48 & 0xfe) * 2 | local_50 & 0xfe00) * 4 + 0x8a03e4;
    local_4c = &local_48;
    local_48 = ((uVar9 & 0xfe) * 2 | uVar9 & 0xfe00) * 4 + 0x8a03e4;
    do {
      if (param_2 <= iVar12) {
        return;
      }
      for (puVar3 = unit_land_array[*(short *)(*local_4c + 6)]; puVar3 != (unit_struct *)0x0;
          puVar3 = unit_land_array[puVar3->next_unit_index]) {
        if ((((puVar3->unit_class == '\x01') && (puVar3->tribe_index == cVar1)) &&
            (puVar3 != param_1)) &&
           ((puVar3->state == '\x13' &&
            (((cVar2 = puVar3->state_2, cVar2 == '\x05' || (cVar2 == '\a')) || (cVar2 == '\b'))))))
        {
          puVar3->state_2 = 9;
          puVar3->flags_2 = puVar3->flags_2 | 0x40000000;
          uVar11 = (uint)(ushort)((param_1->pos).x - (puVar3->pos).x);
          uVar10 = (uint)(ushort)((param_1->pos).y - (puVar3->pos).y);
          if (0x7fff < uVar11) {
            uVar11 = uVar11 - 0x10000;
          }
          if (0x7fff < uVar10) {
            uVar10 = uVar10 - 0x10000;
          }
          iVar12 = iVar12 + 1;
          uVar9 = calc_angle_quadrant(uVar11,-uVar10);
          update_gs_unit_related_array_item(puVar3);
          uVar11 = puVar3->flags_2;
          puVar3->flags_2 = uVar11 | 0x80;
          puVar3->flags_2 = uVar11 | 0x1080;
          puVar3->pos_x1 = uVar9 & 0x7ff;
          if (param_2 <= iVar12) break;
        }
      }
      local_4c = local_4c + 2;
    } while (local_4c < &stack0x00000000);
  }
  return;
}
