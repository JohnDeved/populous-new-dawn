/* Ghidra 12.1.3 pseudocode; entry 0050b740; FUN_0050b740.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


/* WARNING: Removing unreachable block (ram,0x0050b965) */
/* WARNING: Removing unreachable block (ram,0x0050b96f) */

void FUN_0050b740(int param_1)

{
  undefined2 *puVar1;
  unit_struct *puVar2;
  bool bVar3;
  ushort uVar4;
  char cVar5;
  char cVar6;
  ushort uVar7;
  uint uVar8;
  undefined4 uVar9;
  uint uVar10;
  int iVar11;
  short sVar12;
  bool bVar13;
  bool local_23;
  ushort local_22;
  undefined2 local_20;
  char local_1e;
  char cStack_1d;
  undefined4 local_18;
  undefined4 local_14;
  int local_10;
  uint local_c;
  int local_8;
  int local_4;

  local_18 = 0;
  local_14 = 0;
  bVar13 = false;
  local_8 = 0;
  local_4 = DAT_005aa5b8;
  cVar5 = get_empty_indexed_xy(2,0,0,*(undefined2 *)(param_1 + 0x70));
  if (cVar5 != '\0') {
    uVar4 = CONCAT11((char)((ushort)*(undefined2 *)(param_1 + 0x3f) >> 8),
                     (char)((ushort)*(undefined2 *)(param_1 + 0x3d) >> 8));
    local_22 = uVar4 & 0xfefe;
    cVar6 = get_indexed_xy(cVar5,&local_18,&local_14);
    while (cVar6 != '\0') {
      local_1e = (char)local_22;
      cStack_1d = (char)(local_22 >> 8);
      local_20 = CONCAT11((char)local_14 * '\x02' + cStack_1d,(char)local_18 * '\x02' + local_1e);
      uVar8 = (local_20 & 0xfe) * 2 | local_20 & 0xfe00;
      local_10 = uVar8 * 4 + 0x8a03e4;
      uVar8 = (uint)(short)(&game_state.level_data[0].unit_index)[uVar8 * 2];
      puVar2 = unit_land_array[uVar8];
      while (puVar2 != (unit_struct *)0x0) {
        if ((*(byte *)((int)&puVar2->flags_4 + 1) & 1) != 0) {
          bVar3 = true;
          local_23 = false;
          uVar9 = FUN_00416d70(puVar2,param_1);
          bVar13 = (char)uVar9 != '\0';
          cVar6 = puVar2->unit_class;
          uVar8 = CONCAT31((int3)((uint)uVar9 >> 8),cVar6);
          if (cVar6 == '\x01') {
            if ((puVar2->unit_type == '\a') && (puVar2->tribe_index == *(char *)(param_1 + 0x2f))) {
              bVar3 = false;
            }
            if (puVar2->unit_type == '\b') {
              bVar3 = false;
            }
            if ((*(char *)(param_1 + 0x7b) == '\0') && (bVar13)) {
              bVar3 = false;
            }
            if (puVar2->unit_land_array_index != 0) {
              bVar3 = false;
            }
            local_23 = (*(byte *)((int)&puVar2->flags_3 + 2) & 2) != 0;
            if (local_23) {
              bVar3 = false;
            }
            local_23 = !local_23;
            uVar8 = 0;
            if (bVar13) {
              if (*(int *)(param_1 + 0x68) == 1) {
                if (local_8 < local_4) {
                  local_8 = local_8 + 1;
                }
                else {
                  bVar3 = false;
                  local_23 = false;
                }
              }
              else {
                bVar3 = false;
                local_23 = false;
              }
            }
          }
          else if (cVar6 == '\x04') {
            uVar8 = FUN_00466f00(puVar2,*(undefined1 *)(param_1 + 0x2f),DAT_005aa510);
          }
          if ((*(byte *)((int)&puVar2->flags_3 + 1) & 0x80) != 0) {
            bVar3 = false;
            local_23 = false;
          }
          if (bVar3) {
            if ((((*(byte *)(param_1 + 0x7a) & 1) != 0) && (puVar2->unit_class == '\x01')) &&
               (puVar2->state != '\x1a')) {
              if ((*(byte *)((int)&puVar2->flags_2 + 2) & 0x10) == 0) {
                *(undefined1 *)((int)&puVar2->loc_1_y + 1) = puVar2->state;
                empty_unit_function(puVar2);
                puVar2->state = 0x1a;
                init_unit_class(puVar2);
              }
              puVar2->field_0xa4 = 0x18;
            }
            uVar8 = puVar2->flags_2;
            puVar2->flags_2 = uVar8 | 0x2000;
            puVar2->flags_2 = uVar8 | 0x82000;
            if (*(char *)(param_1 + 0x7c) == '\0') {
              puVar2->flags_3 = puVar2->flags_3 | 8;
            }
            uVar8 = (uint)(ushort)(*(short *)(param_1 + 0x3d) - (puVar2->pos).x);
            uVar10 = (uint)(ushort)(*(short *)(param_1 + 0x3f) - (puVar2->pos).y);
            if (0x7fff < uVar8) {
              uVar8 = uVar8 - 0x10000;
            }
            if (0x7fff < uVar10) {
              uVar10 = uVar10 - 0x10000;
            }
            uVar7 = calc_angle_quadrant(uVar8,-uVar10);
            iVar11 = calc_distance_toroidal(&puVar2->pos,param_1 + 0x3d);
            if (iVar11 < 0) {
              iVar11 = 0;
            }
            if (*(int *)(param_1 + 0x6c) < iVar11) {
              iVar11 = *(int *)(param_1 + 0x6c);
            }
            FUN_004e93f0(&puVar2->vec2,&puVar2->pos,
                         ((int)*(short *)(param_1 + 0x74) * (*(int *)(param_1 + 0x6c) - iVar11)) /
                         *(int *)(param_1 + 0x6c),(uVar7 & 0x7ff) + 0x400 & 0x7ff);
            uVar8 = ((int)*(short *)(param_1 + 0x78) * (*(int *)(param_1 + 0x6c) - iVar11)) /
                    *(int *)(param_1 + 0x6c);
            puVar1 = &(puVar2->vec2).y;
            *puVar1 = *puVar1 + (short)uVar8;
            if ((puVar2->unit_class == '\x01') && (puVar2->state == '\x1a')) {
              puVar2->flags_4 = puVar2->flags_4 | 0x2000;
            }
          }
          if ((local_23) && (uVar8 = FUN_004d3ea0(puVar2), !bVar13)) {
            if ((*(char *)(param_1 + 0x7d) != '\0') &&
               ((local_20 == local_22 && (puVar2->tribe_index != -1)))) {
              uVar10 = game_state.pseudo_random_val * 0x24a1 + 0x24df;
              uVar8 = uVar10 >> 0xd;
              local_c = uVar8 | uVar10 * 0x80000;
              game_state.pseudo_random_val = local_c;
              puVar2->field_0xa4 = ((byte)uVar8 & 0xf) + 0x10;
            }
            iVar11 = DAT_005aa510;
            if ((load_level_flags._3_1_ & 4) != 0) {
              iVar11 = *(short *)&puVar2->field_0x6e + 1;
            }
            uVar8 = FUN_004da080(puVar2,*(undefined1 *)(param_1 + 0x2f),iVar11,0);
            if (((*(byte *)((int)&puVar2->flags_4 + 1) & 8) != 0) &&
               (uVar8 = CONCAT22((short)(uVar8 >> 0x10),uVar4) & 0xfffffefe, local_20 == local_22))
            {
              uVar8 = FUN_004ef180(puVar2);
            }
          }
        }
        cVar6 = puVar2->unit_class;
        uVar8 = CONCAT31((int3)(uVar8 >> 8),cVar6);
        if ((cVar6 == '\x02') ||
           ((cVar6 == '\x05' &&
            (uVar8 = (uint)(byte)puVar2->unit_type,
            (unit_type_array_scenery[uVar8].field14_0x16 & 4) != 0)))) {
          if (puVar2->field40_0x65 == '\0') {
            puVar2->field40_0x65 = 1;
            uVar8 = CONCAT22((short)(uVar8 >> 0x10),uVar4) & 0xfffffefe;
            *(ushort *)&puVar2->field_0x61 = local_22;
          }
          if (((*(char *)(param_1 + 0x7c) == '\0') && (puVar2->unit_class == '\x02')) && (!bVar13))
          {
            FUN_00409200(puVar2,DAT_005aa50c,
                         CONCAT31((int3)(uVar8 >> 8),*(undefined1 *)(param_1 + 0x2f)));
          }
        }
        uVar8 = (uint)puVar2->next_unit_index;
        puVar2 = unit_land_array[uVar8];
      }
      uVar7 = *(ushort *)(local_10 + 8) & 0x3ff;
      if ((uVar7 != 0) && ((*(byte *)(local_10 + 1) & 2) != 0)) {
        puVar2 = unit_land_array[uVar7];
        if (puVar2->field40_0x65 == '\0') {
          puVar2->field40_0x65 = 1;
          *(ushort *)&puVar2->field_0x61 = local_22;
        }
        if ((*(char *)(param_1 + 0x7c) == '\0') &&
           (cVar6 = FUN_00416d70(puVar2,param_1), cVar6 == '\0')) {
          FUN_00409200(puVar2,DAT_005aa50c,*(undefined1 *)(param_1 + 0x2f));
        }
      }
      cVar6 = get_indexed_xy(cVar5,&local_18,&local_14);
    }
    clear_indexed_xy(cVar5);
  }
  *(undefined1 *)(param_1 + 0x7c) = 1;
  iVar11 = *(int *)(param_1 + 0x68) + -1;
  *(int *)(param_1 + 0x68) = iVar11;
  if (iVar11 < 1) {
    update_after_unit_alloc(param_1);
  }
  else {
    sVar12 = *(short *)(param_1 + 0x76) + *(short *)(param_1 + 0x70);
    *(short *)(param_1 + 0x70) = sVar12;
    if (*(short *)(param_1 + 0x72) < sVar12) {
      *(short *)(param_1 + 0x70) = *(short *)(param_1 + 0x72);
      return;
    }
  }
  return;
}
