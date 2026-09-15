/* Ghidra 12.1.3 pseudocode; entry 00406600; FUN_00406600.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_00406600(int param_1)

{
  byte *pbVar1;
  byte bVar2;
  unit_struct *puVar3;
  uint uVar4;
  undefined4 uVar5;
  bool bVar6;
  char cVar7;
  undefined2 uVar8;
  short sVar9;
  ushort uVar10;
  int iVar11;
  undefined2 extraout_var;
  uint uVar12;
  unit_struct *puVar13;
  ushort *puVar14;
  undefined2 extraout_var_00;
  int iVar15;
  int *piVar16;
  bool bVar17;
  ushort local_396;
  undefined4 local_394;
  int local_390;
  undefined2 local_38c;
  undefined2 local_38a;
  short local_388;
  short local_386;
  undefined4 local_384;
  uint local_380;
  int local_37c;
  int local_378;
  int local_374;
  undefined4 local_370;
  int local_36c;
  undefined4 local_368;
  uint local_364;
  uint local_360;
  undefined4 local_35c;
  short local_358;
  short sStack_356;
  undefined2 local_354;
  undefined4 local_350;
  undefined2 local_34c;
  short local_348;
  short local_346;
  undefined2 local_344;
  short local_340;
  short local_33e;
  undefined2 local_33c;
  int local_338 [6];
  undefined1 local_320 [4];
  ushort uStack_31c;
  ushort local_31a [397];

  iVar15 = 0;
  local_378 = 0;
  local_390 = -1;
  *(ushort *)(param_1 + 0x9c) = *(ushort *)(param_1 + 0x9c) & 0xffdf;
  local_374 = 0;
  if (*(ushort *)(param_1 + 0x84) != 0) {
    puVar3 = unit_land_array[*(ushort *)(param_1 + 0x84)];
    puVar13 = (unit_struct *)0x0;
    if (((*(byte *)&puVar3->flags_2 & 1) == 0) && (puVar3->unit_class != '\0')) {
      puVar13 = puVar3;
    }
    if (puVar13 == (unit_struct *)0x0) {
      *(undefined2 *)(param_1 + 0x84) = 0;
    }
  }
  if (*(char *)(param_1 + 0xa6) != '\0') {
    piVar16 = local_338;
    puVar14 = (ushort *)(param_1 + 0x86);
    local_36c = 6;
    do {
      uVar10 = *puVar14;
      if (uVar10 != 0) {
        puVar3 = unit_land_array[uVar10];
        puVar13 = (unit_struct *)0x0;
        if (((*(byte *)&puVar3->flags_2 & 1) == 0) && (puVar3->unit_class != '\0')) {
          puVar13 = puVar3;
        }
        if (puVar13 == (unit_struct *)0x0) {
          remove_person_from_hut(param_1,unit_land_array[(short)uVar10]);
        }
        else {
          if (puVar13->field_0xa9 == '\0') {
            local_378 = local_378 + 1;
            if (local_390 < 0) {
              local_390 = iVar15;
            }
          }
          else {
            local_374 = local_374 + 1;
          }
          *piVar16 = (int)puVar13;
          piVar16 = piVar16 + 1;
          iVar15 = iVar15 + 1;
        }
      }
      puVar14 = puVar14 + 1;
      local_36c = local_36c + -1;
    } while (local_36c != 0);
  }
  if (iVar15 != 0) {
    *(byte *)(param_1 + 0x9c) = *(byte *)(param_1 + 0x9c) | 0x20;
    bVar17 = (*(uint *)&unit_type_array_building[*(byte *)(param_1 + 0x2b)].field_0x48 & 0x200) == 0
    ;
    if (iVar15 < 2) {
      if ((*(char *)(local_338[0] + 0xa9) == '\0') &&
         (local_390 = 0, 0x4f < *(short *)(local_338[0] + 0x70))) {
        *(undefined1 *)(local_338[0] + 0xa8) = 0x1f;
        *(byte *)(local_338[0] + 0x76) = *(byte *)(local_338[0] + 0x76) | 0x10;
      }
    }
    else {
      if (local_374 < (iVar15 + 1) / 2) {
        iVar15 = local_338[local_390];
        *(undefined1 *)(iVar15 + 0xa8) = 0x1f;
        pbVar1 = (byte *)(iVar15 + 0x76);
        *pbVar1 = *pbVar1 | 0x10;
      }
      if (((local_378 != 0) && (*(short *)(param_1 + 0xa4) != 0)) &&
         (*(short *)(param_1 + 0x84) == 0)) {
        switch(*(undefined1 *)(param_1 + 0x2b)) {
        case 0xd:
        case 0xe:
          local_368 = 0x200;
          local_364 = *(ushort *)(param_1 + 0x26) & 0x7ff;
          break;
        case 0xf:
        case 0x10:
          local_368 = 0x500;
          local_364 = (int)*(short *)(param_1 + 0x26) - 0x200U & 0x7ff;
        }
        cVar7 = (&objs0_mem[*(short *)(param_1 + 0x33)].shapes_index)
                [(short)((int)((int)*(short *)(param_1 + 0x26) +
                              ((int)*(short *)(param_1 + 0x26) >> 0x1f & 0x1ffU)) >> 9)];
        local_346 = ((short)(char)shapes_mem[cVar7].field_0x5 +
                    (ushort)(byte)shapes_mem[cVar7].y2 * -4) * 0x40 + *(short *)(param_1 + 0x7c);
        local_348 = ((short)(char)shapes_mem[cVar7].field_0x4 +
                    (ushort)(byte)shapes_mem[cVar7].x2 * -4) * 0x40 + *(short *)(param_1 + 0x7a);
        local_344 = 0;
        move_pos_angle_length(&local_348,local_364,local_368);
        local_388 = local_348;
        local_386 = local_346;
        sStack_356 = local_346;
        local_354 = 0;
        bVar2 = *(byte *)(param_1 + 0x2b);
        local_358 = local_348;
        ptr_unit_related_20B->field0_0x0 = (uint)(byte)unit_type_array_building[bVar2].unit_type1;
        ptr_unit_related_20B->field1_0x4 = 0;
        ptr_unit_related_20B->unit_ptr = (unit_struct *)0x0;
        ptr_unit_related_20B->field3_0xc = 0;
        ptr_unit_related_20B->field4_0x10 = 0;
        ptr_unit_related_20B = ptr_unit_related_20B + 1;
        unit_allocation_flag = 1;
        iVar15 = alloc_unit(6,7,CONCAT31((int3)((uint)bVar2 * 9 >> 8),
                                         *(undefined1 *)(param_1 + 0x2f)),&local_358);
        if (iVar15 != 0) {
          *(undefined2 *)(param_1 + 0x84) = *(undefined2 *)(iVar15 + 0x24);
        }
      }
    }
    iVar15 = 0;
    if ((-1 < local_390) &&
       (*(short *)&unit_type_array_vehicle
                   [(byte)unit_type_array_building[*(byte *)(param_1 + 0x2b)].unit_type1].field_0x13
        <= *(short *)(param_1 + 0xa4))) {
      iVar11 = (int)(char)(&objs0_mem[*(short *)(param_1 + 0x33)].shapes_index)
                          [(short)((int)((int)*(short *)(param_1 + 0x26) +
                                        ((int)*(short *)(param_1 + 0x26) >> 0x1f & 0x1ffU)) >> 9)];
      uVar10 = CONCAT11((char)((ushort)*(undefined2 *)(param_1 + 0x7c) >> 8),
                        (char)((ushort)*(undefined2 *)(param_1 + 0x7a) >> 8));
      local_394._2_2_ = uVar10 & 0xfefe;
      local_394._0_1_ = (char)local_394._2_2_;
      local_394._1_1_ = (char)(local_394._2_2_ >> 8);
      local_394._0_2_ =
           CONCAT11(local_394._1_1_ - shapes_mem[iVar11].y2,(char)local_394 - shapes_mem[iVar11].x2)
      ;
      local_394 = CONCAT22(uVar10,(undefined2)local_394) & 0xfefeffff;
      FUN_004b9ef0(iVar11,local_394,local_320,&local_37c);
      bVar6 = false;
      if (0 < local_37c) {
        puVar14 = local_31a;
        do {
          if ((*puVar14 & 0x10) != 0) {
            bVar6 = true;
            break;
          }
          puVar14 = puVar14 + 4;
          iVar15 = iVar15 + 1;
        } while (iVar15 < local_37c);
      }
      if (bVar6) {
        *(undefined2 *)(param_1 + 0xa4) = 0;
        if (bVar17) {
          switch(*(undefined1 *)(param_1 + 0x2b)) {
          case 0xd:
          case 0xe:
            local_35c = 0x200;
            local_360 = *(ushort *)(param_1 + 0x26) & 0x7ff;
            break;
          case 0xf:
          case 0x10:
            local_35c = 0x500;
            local_360 = (int)*(short *)(param_1 + 0x26) - 0x200U & 0x7ff;
          }
          cVar7 = (&objs0_mem[*(short *)(param_1 + 0x33)].shapes_index)
                  [(short)((int)((int)*(short *)(param_1 + 0x26) +
                                ((int)*(short *)(param_1 + 0x26) >> 0x1f & 0x1ffU)) >> 9)];
          local_33e = ((short)(char)shapes_mem[cVar7].field_0x5 +
                      (ushort)(byte)shapes_mem[cVar7].y2 * -4) * 0x40 + *(short *)(param_1 + 0x7c);
          local_340 = ((short)(char)shapes_mem[cVar7].field_0x4 +
                      (ushort)(byte)shapes_mem[cVar7].x2 * -4) * 0x40 + *(short *)(param_1 + 0x7a);
          local_33c = 0;
          move_pos_angle_length(&local_340,local_360,local_35c);
          local_358 = local_340;
          sStack_356 = local_33e;
          local_354 = 0;
        }
        else {
          local_396 = (&uStack_31c)[iVar15 * 4] & 0xfefe;
          local_358 = (((&uStack_31c)[iVar15 * 4] & 0xfe) + 1) * 0x100;
          uVar5 = CONCAT22(sStack_356,local_358);
          sStack_356 = ((local_396 >> 8) + 1) * 0x100;
          local_354 = calc_point_height(uVar5,CONCAT22(local_354,sStack_356));
        }
        local_388 = local_358;
        local_386 = sStack_356;
        init_boat_hut(param_1,&local_388);
        iVar15 = local_338[local_390];
        ptr_unit_related_20B->field0_0x0 = 1;
        ptr_unit_related_20B->field1_0x4 = 0;
        ptr_unit_related_20B->unit_ptr = (unit_struct *)0x0;
        ptr_unit_related_20B->field3_0xc = 0;
        ptr_unit_related_20B->field4_0x10 = 0;
        ptr_unit_related_20B = ptr_unit_related_20B + 1;
        unit_allocation_flag = 1;
        iVar11 = alloc_unit(4,CONCAT31((int3)((uint)*(byte *)(param_1 + 0x2b) * 0x13 >> 8),
                                       unit_type_array_building[*(byte *)(param_1 + 0x2b)].
                                       unit_type1),*(undefined1 *)(param_1 + 0x2f),&local_358);
        if (iVar11 != 0) {
          if (*(short *)(param_1 + 0x84) != 0) {
            FUN_004ef180(unit_land_array[*(short *)(param_1 + 0x84)]);
            *(undefined2 *)(param_1 + 0x84) = 0;
          }
          add_unit_to_cell(iVar11,&local_358);
          uVar8 = calc_point_height(CONCAT22(extraout_var_00,*(undefined2 *)(iVar11 + 0x3d)),
                                    CONCAT22(extraout_var,*(undefined2 *)(iVar11 + 0x3f)));
          *(undefined2 *)(iVar11 + 0x41) = uVar8;
          *(uint *)(iVar11 + 0x10) = *(uint *)(iVar11 + 0x10) & 0xfffffbff;
          *(undefined2 *)(iVar11 + 0x43) = 0;
          *(undefined2 *)(iVar11 + 0x47) = 0;
          *(undefined2 *)(iVar11 + 0x45) = 0;
          if (bVar17) {
            *(short *)(iVar11 + 0x41) =
                 *(short *)(iVar11 + 0x41) +
                 *(short *)&unit_type_array_building[*(byte *)(param_1 + 0x2b)].field_0x26;
          }
          sVar9 = FUN_00465580(iVar11 + 0x3d,*(undefined2 *)(iVar11 + 0x26));
          uVar10 = sVar9 + 0x400U & 0x7ff;
          if ((*(byte *)(iVar11 + 0xc) & 0x80) != 0) {
            *(ushort *)(iVar11 + 0x57) = uVar10;
          }
          *(ushort *)(iVar11 + 0x5d) = uVar10;
          if ((*(byte *)(iVar11 + 0xd) & 0x80) != 0) {
            uVar10 = uVar10 + 0x400 & 0x7ff;
          }
          *(ushort *)(iVar11 + 0x26) = uVar10;
          uVar4 = *(uint *)(iVar11 + 0x92);
          *(uint *)(iVar11 + 0x92) = uVar4 | 4;
          *(uint *)(iVar11 + 0x92) = uVar4 | 0x8004;
          remove_person_from_hut(param_1,iVar15);
          FUN_004657d0(iVar15,iVar11);
          *(undefined1 *)(iVar15 + 0x7e) = 0;
          FUN_00465ea0(iVar11);
          *(undefined2 *)(iVar15 + 0x43) = 0;
          *(undefined2 *)(iVar15 + 0x47) = 0;
          *(undefined2 *)(iVar15 + 0x45) = 0;
          if (bVar17) {
            local_350 = CONCAT22(sStack_356,local_358);
            local_34c = local_354;
            uVar12 = game_state.pseudo_random_val * 0x24a1 + 0x24df;
            uVar4 = uVar12 >> 0xd;
            uVar12 = uVar12 * 0x80000;
            game_state.pseudo_random_val = uVar4 | uVar12;
            local_380 = game_state.pseudo_random_val;
            move_pos_angle_length(&local_350,uVar4 & 0xffff07ff | uVar12,0xc00);
            local_38c = (undefined2)local_350;
            local_38a = local_350._2_2_;
            FUN_00464ae0(iVar11,&local_38c,&local_384,0);
          }
          else {
            cVar7 = FUN_00464ae0(iVar11,iVar11 + 0x3d,&local_384,iVar15);
            if (cVar7 == '\0') {
              local_350 = CONCAT22(sStack_356,local_358);
              local_34c = local_354;
              move_pos_angle_length
                        (&local_350,
                         CONCAT22((short)((uint)&local_350 >> 0x10),*(undefined2 *)(param_1 + 0x26))
                         ,0xc00);
              local_38c = (undefined2)local_350;
              local_38a = local_350._2_2_;
              FUN_00464ce0(iVar11,&local_38c,&local_384);
            }
          }
          sVar9 = FUN_00436c20();
          if (sVar9 != 0) {
            local_370 = local_384;
            FUN_00438730(sVar9,3,&local_370,0x20);
            FUN_00436ca0(iVar15);
            FUN_00436d00(iVar15,sVar9,*(undefined1 *)(iVar15 + 0xa6));
            *(uint *)(iVar15 + 0xc) = *(uint *)(iVar15 + 0xc) | 0x10;
          }
        }
        if (game_state.tribes_array[*(char *)(param_1 + 0x2f)].field_0xc1f == '\x01') {
          cVar7 = *(char *)(param_1 + 0xa6);
          while (cVar7 != '\0') {
            iVar15 = remove_person_from_hut(param_1,0);
            if (iVar15 != 0) {
              FUN_00436ca0(iVar15);
            }
            cVar7 = *(char *)(param_1 + 0xa6);
          }
        }
      }
    }
  }
  return;
}
