/* Ghidra 12.1.3 pseudocode; entry 004615f0; process_tribe_2.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void process_tribe_2(int param_1)

{
  byte bVar1;
  undefined2 uVar2;
  ushort uVar3;
  unit_struct *puVar4;
  char cVar5;
  short sVar6;
  int iVar7;
  int iVar8;
  int iVar9;
  byte *pbVar10;
  uint uVar11;
  undefined2 extraout_var;
  undefined1 uVar12;
  unit_struct *puVar13;
  short *psVar14;
  ushort local_c;
  undefined1 uStack_9;
  undefined4 local_8;
  undefined4 local_4;

  if (*(char *)(param_1 + 0x5bd) != '\0') {
    *(char *)(param_1 + 0x5bd) = *(char *)(param_1 + 0x5bd) + -1;
  }
  iVar7 = FUN_004f20d0(param_1);
  if (iVar7 != 0) {
    iVar7 = 0;
    psVar14 = (short *)(param_1 + 0x540);
    do {
      if ((((*psVar14 != 0) && (sVar6 = *psVar14 + -1, *psVar14 = sVar6, sVar6 == 0)) &&
          ((char)psVar14[-1] != '\0')) &&
         (cVar5 = (char)psVar14[-1] + -1, *(char *)(psVar14 + -1) = cVar5, cVar5 != '\0')) {
        sVar6 = FUN_004f20b0(param_1,iVar7);
        *psVar14 = sVar6;
      }
      psVar14 = psVar14 + 2;
      iVar7 = iVar7 + 1;
    } while (iVar7 < 0x16);
  }
  FUN_00461f90(param_1);
  interpret_script_upper(param_1,*(char *)(param_1 + 0xc22) * 0x3108 + 0x95d7b2);
  iVar7 = *(char *)(param_1 + 0xc22) + game_state.offset_counter_2;
  if ((iVar7 + 0xdU & 0x3f) == 0) {
    if (*(char *)(param_1 + 0x5b4) != '\0') {
      uVar2 = *(undefined2 *)(param_1 + 0x36a);
      iVar7 = *(int *)(param_1 + 0x885);
      local_8 = CONCAT22(local_8._2_2_,uVar2);
      local_4 = 0;
      if (iVar7 != 0) {
        local_8._1_1_ = (byte)((ushort)uVar2 >> 8);
        local_8 = (uint)local_8._1_1_;
        do {
          local_c = CONCAT11((char)((ushort)*(undefined2 *)(iVar7 + 0x3f) >> 8),
                             (char)((ushort)*(undefined2 *)(iVar7 + 0x3d) >> 8)) & 0xfefe;
          iVar8 = FUN_00461d40((char)uVar2,(char)local_c);
          uStack_9 = (undefined1)(local_c >> 8);
          iVar9 = FUN_00461d40(local_8,uStack_9);
          iVar8 = iVar9 * iVar9 + iVar8 * iVar8;
          if (local_4 < iVar8) {
            local_4 = iVar8;
          }
          iVar7 = *(int *)(iVar7 + 8);
        } while (iVar7 != 0);
      }
      iVar7 = fast_sqrt(local_4);
      iVar7 = (iVar7 >> 1) +
              (uint)*(byte *)((int)game_state.start_n1 + *(char *)(param_1 + 0xc22) * 0x30 + -0x22);
      if ((int)(uint)*(byte *)(param_1 + 0x36c) < iVar7) {
        *(char *)(param_1 + 0x36c) = (char)iVar7;
      }
    }
  }
  else if ((iVar7 + 1U & 0x3f) == 0) {
    FUN_004625e0();
  }
  else {
    maybe_ai_func_1(param_1);
  }
  FUN_0045ff30(param_1);
  iVar7 = cast_blast(param_1);
  FUN_004c6760(param_1);
  FUN_004f6c20(param_1);
  FUN_004c6680(param_1);
  if (iVar7 == 0) {
    cast_some_spells(param_1);
  }
  iVar7 = 0;
  pbVar10 = (byte *)(param_1 + 0x74);
  do {
    if ((*pbVar10 & 1) == 0) goto LAB_004617de;
    pbVar10 = pbVar10 + 0x52;
    iVar7 = iVar7 + 1;
  } while (iVar7 < 10);
  iVar7 = -1;
LAB_004617de:
  if (((*(char *)(param_1 + 0xc22) * 2 + game_state.offset_counter_2) - 5U & 0xf) == 0) {
    for (iVar8 = *(int *)(param_1 + 0x881); iVar8 != 0; iVar8 = *(int *)(iVar8 + 8)) {
      iVar9 = FUN_004f39f0(iVar8);
      if (iVar9 != 0) {
        iVar9 = FUN_004f39d0(iVar8);
        if ((iVar9 == 0) && (cVar5 = FUN_004df0e0(iVar8), cVar5 == '\0')) {
          if (((iVar7 != -1) && (iVar9 = FUN_004f7920(param_1,iVar8), iVar9 == 0)) &&
             (iVar9 = FUN_004627f0(param_1,0x11,0), iVar9 != 0)) {
            uVar3 = *(ushort *)(iVar8 + 0x24);
            iVar9 = iVar7 * 0x52 + param_1;
            uVar11 = *(uint *)(iVar9 + 0x74);
            *(uint *)(iVar9 + 0x74) = uVar11 | 1;
            *(uint *)(iVar9 + 0x74) = uVar11 & 0xfffffffd | 1;
            *(undefined1 *)(iVar9 + 0x85) = 0x11;
            *(uint *)(iVar9 + 0x68) = (uint)uVar3;
            *(undefined4 *)(iVar9 + 0x6c) = 0;
            *(undefined4 *)(iVar9 + 0x70) = 0;
            *(undefined2 *)(iVar9 + 0x78) = 0;
            FUN_00462ca0(param_1,iVar7);
            iVar7 = -1;
          }
        }
        else {
          FUN_00436ca0(iVar8);
          FUN_004e9b40(iVar8);
          if ((*(byte *)(iVar8 + 0xe) & 0x10) == 0) {
            *(undefined1 *)(iVar8 + 0x7d) = *(undefined1 *)(iVar8 + 0x2c);
            if ((game_state.level_flags & 2) == 0) {
              bVar1 = *(byte *)(iVar8 + 0x2b);
LAB_004618f9:
              uVar12 = unit_type_array_person[bVar1].next_state;
            }
            else {
              bVar1 = *(byte *)(iVar8 + 0x2b);
              if (bVar1 != 7) goto LAB_004618f9;
              uVar12 = 0x27;
            }
            empty_unit_function(iVar8);
            *(undefined1 *)(iVar8 + 0x2c) = uVar12;
            init_unit_class(iVar8);
          }
          local_8 = *(uint *)(iVar8 + 0x3d);
          local_4._0_2_ = CONCAT11((char)(local_8 >> 0x18),(char)(local_8 >> 8));
          uVar11 = ((ushort)local_4 & 0xfe) * 2 | (ushort)local_4 & 0xfe00;
          if ((*(byte *)((int)&game_state.level_data[0].flags + uVar11 * 4 + 1) & 2) != 0) {
            FUN_004044b0(unit_land_array
                         [(ushort)(&game_state.level_data[0].unit_index_2)[uVar11 * 2] & 0x3ff],
                         &local_8);
          }
          *(uint *)(iVar8 + 0x68) = local_8;
          FUN_00405090((uint *)(iVar8 + 0x68));
          *(byte *)(iVar8 + 0x82) = *(byte *)(iVar8 + 0x82) & 0xf0;
          *(undefined1 *)(iVar8 + 0x82) = 0;
        }
      }
    }
  }
  if (((*(char *)(param_1 + 0xc22) * 2 + game_state.offset_counter_2 + 3U & 0xf) == 0) &&
     (iVar7 = FUN_004627f0(param_1,0x13,0), iVar7 != 0)) {
    iVar7 = 0;
    pbVar10 = (byte *)(param_1 + 0x74);
    do {
      if ((*pbVar10 & 1) == 0) goto LAB_004619f3;
      pbVar10 = pbVar10 + 0x52;
      iVar7 = iVar7 + 1;
    } while (iVar7 < 10);
    iVar7 = -1;
LAB_004619f3:
    if (iVar7 != -1) {
      for (iVar8 = *(int *)(param_1 + 0x881); iVar8 != 0; iVar8 = *(int *)(iVar8 + 8)) {
        uVar3 = *(ushort *)(iVar8 + 0x9f);
        if ((uVar3 != 0) &&
           ((unit_type_related_1_ARRAY_005a6f78[*(byte *)(iVar8 + 0x2c)].field_0x1 & 8) != 0)) {
          puVar13 = (unit_struct *)0x0;
          if ((uVar3 != 0) &&
             ((puVar4 = unit_land_array[uVar3], (*(byte *)&puVar4->flags_2 & 1) == 0 &&
              (puVar4->unit_class != '\0')))) {
            puVar13 = puVar4;
          }
          if ((((puVar13 != (unit_struct *)0x0) && (*(short *)(iVar8 + 0x24) == puVar13->loc_1_x))
              && ('\0' < (char)puVar13->field_0x9e)) &&
             (((*(char *)((int)&puVar13->field81_0xa2 + 1) == '\0' &&
               (iVar9 = FUN_004f2490(puVar13), iVar9 == 0)) &&
              (((puVar13->tex_size_type & 2) == 0 &&
               (iVar9 = landscape_find_ph_not_zero(param_1,puVar13), iVar9 == 0)))))) {
            iVar8 = iVar7 * 0x52 + param_1;
            uVar11 = *(uint *)(iVar7 * 0x52 + 0x74 + param_1);
            *(uint *)(iVar8 + 0x74) = uVar11 | 1;
            *(uint *)(iVar8 + 0x74) = uVar11 & 0xfffffffd | 1;
            *(undefined1 *)(iVar8 + 0x85) = 0x13;
            *(undefined4 *)(iVar8 + 0x68) = 0;
            *(undefined4 *)(iVar8 + 0x6c) = 0;
            *(undefined4 *)(iVar8 + 0x70) = 0;
            *(undefined2 *)(iVar8 + 0x78) = 3;
            FUN_00462ca0(param_1,iVar7);
            *(undefined2 *)(iVar8 + 0x4e) = 0;
            *(undefined2 *)(iVar8 + 0x4c) = puVar13->unit_index;
            break;
          }
        }
      }
    }
  }
  if ((char)(*(char *)(param_1 + 0xc22) * '\x02' + (char)game_state.offset_counter_2) == -0x11) {
    for (iVar7 = *(int *)(param_1 + 0x885); iVar7 != 0; iVar7 = *(int *)(iVar7 + 8)) {
      if (*(char *)(iVar7 + 0x2b) == '\r') {
        local_8 = CONCAT31(local_8._1_3_,(char)((ushort)*(undefined2 *)(iVar7 + 0x7a) >> 8)) &
                  0xfffffffe;
        local_8 = CONCAT22(local_8._2_2_,
                           CONCAT11((char)((ushort)*(undefined2 *)(iVar7 + 0x7c) >> 8),(char)local_8
                                   )) & 0xfffffeff;
        cVar5 = local_8._1_1_;
        uVar2 = local_8._2_2_;
        switch((short)((int)((int)*(short *)(iVar7 + 0x26) +
                            ((int)*(short *)(iVar7 + 0x26) >> 0x1f & 0x1ffU)) >> 9)) {
        case 0:
          local_8._0_2_ = CONCAT11(cVar5 + '\x06',(char)local_8);
          local_8 = CONCAT22(uVar2,(undefined2)local_8);
          break;
        case 1:
          local_8 = CONCAT31(local_8._1_3_,(char)local_8 + '\x06');
          break;
        case 2:
          local_8._0_2_ = CONCAT11(cVar5 + -6,(char)local_8);
          local_8 = CONCAT22(uVar2,(undefined2)local_8);
          break;
        case 3:
          local_8 = CONCAT31(local_8._1_3_,(char)local_8 + -6);
        }
        iVar8 = FUN_004f6fd0(local_8,100);
        if (iVar8 < 100) {
          if (*(char *)(game_state.start_n1 + *(char *)(param_1 + 0xc22) * 0xc + -1) != '\0') {
            FUN_0040a0c0(iVar7,1);
          }
          *(undefined1 *)((int)game_state.start_n1 + *(char *)(param_1 + 0xc22) * 0x30 + -3) = 1;
        }
        break;
      }
    }
  }
  if (((*(byte *)(param_1 + 0x598) & 8) != 0) &&
     (iVar7 = FUN_004f3fa0(param_1,*(undefined2 *)(param_1 + 0x5bf)), iVar7 == 0)) {
    iVar8 = 0;
    pbVar10 = (byte *)(param_1 + 0x74);
    iVar7 = 10;
    do {
      if (((*pbVar10 & 1) != 0) && (pbVar10[0x11] == 0x18)) {
        iVar8 = iVar8 + 1;
      }
      pbVar10 = pbVar10 + 0x52;
      iVar7 = iVar7 + -1;
    } while (iVar7 != 0);
    if (iVar8 < 1) {
      iVar7 = FUN_004f5400(param_1,(int)*(char *)(param_1 + 0xc22),
                           CONCAT22((short)((uint)pbVar10 >> 0x10),*(undefined2 *)(param_1 + 0x5bf))
                           ,4);
      if (4 < iVar7) {
        *(uint *)(param_1 + 0x596) = *(uint *)(param_1 + 0x596) & 0xfff7ffff;
        return;
      }
      local_8 = CONCAT22(local_8._2_2_,*(undefined2 *)(param_1 + 0x5bf));
      FUN_004f1bb0(&local_8,5,CONCAT22(extraout_var,*(undefined2 *)(param_1 + 0x5c1)));
      iVar7 = 0;
      pbVar10 = (byte *)(param_1 + 0x74);
      do {
        if ((*pbVar10 & 1) == 0) goto LAB_00461c7a;
        pbVar10 = pbVar10 + 0x52;
        iVar7 = iVar7 + 1;
      } while (iVar7 < 10);
      iVar7 = -1;
LAB_00461c7a:
      if (iVar7 != -1) {
        *(uint *)(param_1 + 0x596) = *(uint *)(param_1 + 0x596) & 0xfff7ffff;
        iVar8 = iVar7 * 0x52 + param_1;
        uVar11 = *(uint *)(iVar8 + 0x74);
        *(uint *)(iVar8 + 0x74) = uVar11 | 1;
        *(uint *)(iVar8 + 0x74) = uVar11 & 0xfffffffd | 1;
        *(undefined1 *)(iVar8 + 0x85) = 0x18;
        *(undefined4 *)(iVar8 + 0x68) = 0;
        *(undefined4 *)(iVar8 + 0x6c) = 0;
        *(undefined4 *)(iVar8 + 0x70) = 0;
        *(undefined2 *)(iVar8 + 0x78) = 0;
        FUN_00462ca0(param_1,iVar7);
        *(undefined4 *)(iVar8 + 0x3e) = 0xffffffff;
        *(undefined4 *)(iVar8 + 0x42) = 0xffffffff;
        *(undefined2 *)(iVar8 + 0x3e) = 0;
        *(undefined2 *)(iVar8 + 0x46) = 0xffff;
        *(undefined1 *)(iVar8 + 0x4e) = 0;
        *(undefined1 *)(iVar8 + 0x52) = 0;
        *(undefined1 *)(iVar8 + 0x56) = 4;
        *(undefined1 *)(iVar8 + 0x5a) = 0;
        *(undefined1 *)(iVar8 + 0x5f) = 0;
        *(undefined1 *)(iVar8 + 0x60) = 0;
        *(uint *)(iVar8 + 0x36) = local_8 & 0xffff;
        return;
      }
    }
    else {
      *(uint *)(param_1 + 0x596) = *(uint *)(param_1 + 0x596) & 0xfff7ffff;
    }
  }
  return;
}
