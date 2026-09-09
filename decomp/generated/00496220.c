/* Ghidra 12.1.3 pseudocode; entry 00496220; FUN_00496220.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


undefined1 FUN_00496220(int param_1)

{
  uint *puVar1;
  byte bVar2;
  undefined2 uVar3;
  undefined2 uVar5;
  unit_struct *puVar4;
  bool bVar6;
  char cVar7;
  char cVar8;
  short sVar9;
  uint uVar10;
  int iVar11;
  uint uVar12;
  undefined1 uVar13;
  int *piVar14;
  ushort local_352;
  undefined2 local_350;
  undefined2 local_34e;
  char local_34c;
  char cStack_34b;
  ushort local_34a;
  short local_348;
  ushort uStack_346;
  uint local_344;
  int local_340;
  short local_33c;
  short local_33a;
  int local_338;
  int local_334;
  int local_330;
  undefined1 local_32c [4];
  undefined1 local_328 [4];
  unit_struct *local_324;
  int local_320 [200];

  local_340 = param_1 + 0x83;
  if ((*(uint *)(param_1 + 0xc) & 0x40000000) != 0) {
    *(undefined1 *)(param_1 + 0xa8) = 4;
    *(byte *)(param_1 + 0x76) = *(byte *)(param_1 + 0x76) | 0x10;
    *(uint *)(param_1 + 0xc) = *(uint *)(param_1 + 0xc) & 0xbfffffff;
  }
  switch(*(undefined1 *)(param_1 + 0xa8)) {
  case 4:
    if ((*(byte *)(param_1 + 0x76) & 0x10) != 0) {
      *(undefined2 *)(param_1 + 0x70) = 0xc;
    }
    cVar7 = FUN_004391a0(param_1);
    if (cVar7 == '\0') {
      return 0;
    }
LAB_004966ff:
    *(undefined1 *)(param_1 + 0xa8) = 0xe;
    break;
  case 5:
    if ((*(byte *)(param_1 + 0x76) & 0x10) != 0) {
      *(undefined2 *)(param_1 + 0x70) = 0x10;
    }
    if ((*(byte *)(param_1 + 0x2e) & 7) == 0) {
      uVar10 = game_state.pseudo_random_val * 0x24a1 + 0x24df;
      game_state.pseudo_random_val = uVar10 >> 0xd | uVar10 * 0x80000;
      local_344 = game_state.pseudo_random_val;
      update_gs_unit_related_array_item(param_1);
      uVar10 = *(uint *)(param_1 + 0xc);
      *(uint *)(param_1 + 0xc) = uVar10 | 0x80;
      *(uint *)(param_1 + 0xc) = uVar10 | 0x1080;
      *(ushort *)(param_1 + 0x57) = (ushort)local_344 & 0x7ff;
    }
    cVar7 = FUN_004391a0(param_1);
    if (cVar7 == '\0') {
      return 0;
    }
    *(undefined1 *)(param_1 + 0xa8) = 0x10;
    break;
  default:
    goto switchD_00496279_caseD_6;
  case 0xe:
    if ((*(byte *)(param_1 + 0x2e) & 7) != 0) {
      return 0;
    }
    puVar4 = unit_land_array[*(ushort *)(param_1 + 0x89)];
    FUN_004b9d50(CONCAT22((short)((uint)&local_338 >> 0x10),(ushort)(byte)puVar4->field_0x9b),
                 (short)puVar4->coord_scale_4,local_320,&local_338);
    local_334 = 0;
    bVar6 = false;
    cVar7 = puVar4->tribe_index;
    if (0 < local_338) {
      piVar14 = local_320;
      do {
        if (bVar6) goto LAB_00496407;
        for (local_324 = unit_land_array[*(short *)(*piVar14 + 6)]; local_324 != (unit_struct *)0x0;
            local_324 = unit_land_array[local_324->next_unit_index]) {
          if (((local_324->unit_class == '\x01') && (local_324->tribe_index == cVar7)) &&
             (((local_324->state != '\n' ||
               ((local_324->unit_type == '\x04' && (local_324->field36_0x5f == 0)))) ||
              (cVar8 = FUN_004df1c0(local_324), cVar8 != '\0')))) {
            bVar6 = true;
            break;
          }
        }
        piVar14 = piVar14 + 2;
        local_334 = local_334 + 1;
      } while (local_334 < local_338);
    }
    if (!bVar6) {
      return 2;
    }
LAB_00496407:
    uVar3 = (local_324->pos).x;
    uVar5 = (local_324->pos).y;
    _local_348 = CONCAT22((uVar5 & 0xfe00) + 0x100,(uVar3 & 0xfe00) + 0x100);
    FUN_004e9d80(param_1,&local_348);
    *(undefined1 *)(param_1 + 0xa8) = 0xf;
    break;
  case 0xf:
    cVar7 = FUN_00439480(param_1);
    if (cVar7 == '\0') {
      return 0;
    }
    *(undefined1 *)(param_1 + 0xa8) = 5;
    break;
  case 0x10:
    uVar10 = (int)*(short *)(param_1 + 0x4f) - (int)*(short *)(param_1 + 0x3d);
    uVar12 = (int)uVar10 >> 0x1f;
    uVar12 = (uVar10 ^ uVar12) - uVar12;
    if ((0x237 < (int)uVar12) ||
       (uVar10 = (int)*(short *)(param_1 + 0x51) - (int)*(short *)(param_1 + 0x3f),
       uVar12 = (int)uVar10 >> 0x1f, iVar11 = (uVar10 ^ uVar12) - uVar12,
       uVar12 = CONCAT31((int3)((uint)iVar11 >> 8),1), 0x237 < iVar11)) {
      uVar12 = uVar12 & 0xffffff00;
    }
    if ((char)uVar12 == '\0') goto LAB_004966ff;
    cVar7 = get_empty_indexed_xy
                      (2,CONCAT22((short)(uVar12 >> 0x10),*(undefined2 *)(param_1 + 0x5d)),0,0x10);
    if (cVar7 != '\0') {
      bVar6 = false;
      local_34a = CONCAT11((char)((ushort)*(undefined2 *)(param_1 + 0x3f) >> 8),
                           (char)((ushort)*(undefined2 *)(param_1 + 0x3d) >> 8)) & 0xfefe;
      do {
        cVar8 = get_indexed_xy(cVar7,local_328,local_32c);
        if (cVar8 == '\0') goto LAB_0049655f;
        local_34c = (char)local_34a;
        cStack_34b = (char)(local_34a >> 8);
        local_350 = CONCAT11(local_32c[0] * '\x02' + cStack_34b,local_328[0] * '\x02' + local_34c);
        iVar11 = ((local_350 & 0xfe) * 2 | local_350 & 0xfe00) * 4;
      } while (((*(byte *)((int)&game_state.level_data[0].flags + iVar11 + 1) & 4) != 0) ||
              (cVar8 = FUN_004d55a0(iVar11 + 0x8a03e4), cVar8 == '\0'));
      bVar6 = true;
LAB_0049655f:
      clear_indexed_xy(cVar7);
      if ((bVar6) && (sVar9 = FUN_00436c20(), sVar9 != 0)) {
        local_352 = local_350 & 0xfefe;
        local_33c = ((local_350 & 0xfe) + 1) * 0x100;
        local_33a = ((local_352 >> 8) + 1) * 0x100;
        FUN_00438730(sVar9,3,&local_33c,0x20);
        local_34e = CONCAT11((char)((ushort)*(undefined2 *)(param_1 + 0x3f) >> 8),
                             (char)((ushort)*(undefined2 *)(param_1 + 0x3d) >> 8));
        uVar10 = (local_34e & 0xfe) * 2 | local_34e & 0xfe00;
        puVar1 = &game_state.level_data[0].flags + uVar10;
        *puVar1 = *puVar1 | 0x4000;
        local_330 = (int)(char)unit_land_array[*(ushort *)(local_340 + 6)]->tribe_index;
        for (puVar4 = unit_land_array[(short)(&game_state.level_data[0].unit_index)[uVar10 * 2]];
            puVar4 != (unit_struct *)0x0; puVar4 = unit_land_array[puVar4->next_unit_index]) {
          if ((((puVar4->unit_class == '\x01') && ((char)puVar4->tribe_index == local_330)) &&
              ((puVar4->state != '\n' ||
               (((puVar4->unit_type == '\x04' && (puVar4->field36_0x5f == 0)) ||
                (cVar7 = FUN_004df1c0(puVar4), cVar7 != '\0')))))) &&
             ((*(byte *)((int)&puVar4->flags_2 + 3) & 1) == 0)) {
            FUN_00436ca0(puVar4);
            FUN_00436d00(puVar4,sVar9,0);
            FUN_004e9b40(puVar4);
            if ((*(byte *)((int)&puVar4->flags_2 + 2) & 0x10) == 0) {
              *(undefined1 *)((int)&puVar4->loc_1_y + 1) = puVar4->state;
              if ((game_state.level_flags & 2) == 0) {
                bVar2 = puVar4->unit_type;
LAB_004966c5:
                uVar13 = unit_type_array_person[bVar2].next_state;
              }
              else {
                bVar2 = puVar4->unit_type;
                if (bVar2 != 7) goto LAB_004966c5;
                uVar13 = 0x27;
              }
              empty_unit_function(puVar4);
              puVar4->state = uVar13;
              init_unit_class(puVar4);
            }
          }
        }
      }
    }
    *(undefined1 *)(param_1 + 0xa8) = 4;
  }
  *(byte *)(param_1 + 0x76) = *(byte *)(param_1 + 0x76) | 0x10;
switchD_00496279_caseD_6:
  return 0;
}
