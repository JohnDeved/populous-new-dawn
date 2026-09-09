/* Ghidra 12.1.3 pseudocode; entry 00484a10; load_level2.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


undefined4 load_level2(uint param_1)

{
  char cVar1;
  char cVar2;
  char cVar3;
  unit_struct *puVar4;
  unit_struct *puVar5;
  unit_related_struct_20B *puVar6;
  byte bVar7;
  int iVar8;
  char *pcVar9;
  undefined4 uVar10;
  undefined4 uVar11;
  int *piVar12;
  int iVar13;
  land_pos *plVar14;
  undefined2 *puVar15;
  undefined2 *puVar16;
  undefined4 *puVar17;
  uint uVar18;
  undefined4 uVar19;
  short *psVar20;
  unit_struct *puVar21;
  undefined4 local_25c;
  int local_258;
  undefined2 uStack_254;
  undefined2 uStack_252;
  undefined2 uStack_250;
  int iStack_24c;
  int iStack_248;
  int local_244 [5];
  int aiStack_230 [4];
  char local_220 [272];
  undefined1 local_110 [272];

  local_244[0] = 0;
  local_244[1] = 0;
  local_244[2] = 0;
  local_244[3] = 0;
  local_258 = 0;
  if (level_number_3 == param_1) {
    load_level_flags = load_level_flags | 0x200;
  }
  else {
    load_level_flags = load_level_flags & 0xfffffdff;
  }
  iVar8 = 0;
  do {
    aiStack_230[iVar8] = iVar8;
    iVar8 = iVar8 + 1;
  } while (iVar8 < 4);
  clear_level2_params();
  get_global_file_path(local_110,s_LEVELS_0059cd2c,0);
  _sprintf(local_220,s__s__s_03d__s_00599838,local_110,s_LEVL2_00599848,param_1,s_DAT_00599850);
  reset_global_palettes();
  no_file_message();
  file_name_validation(global_string_buffer,local_220);
  iVar8 = open_file(&local_25c,global_string_buffer,0x80000001);
  if (iVar8 != 0) {
    memcpy_1(local_110,s_LEVELS_0059cd2c,0);
    _sprintf(local_220,s__s__s_03d__s_00599838,local_110,s_LEVL2_00599848,param_1,s_DAT_00599850);
    reset_global_palettes();
    no_file_message();
    file_name_validation(global_string_buffer,local_220);
    iVar8 = open_file(&local_25c,global_string_buffer,0x80000001);
    if (iVar8 != 0) {
      return 0;
    }
  }
  _sprintf(local_220,s__s__s_03d__s_00599838,local_110,s_LEVL2_00599848,param_1,s_VER_00599834);
  bVar7 = read_level2_hdr(local_220);
  if (bVar7 == 0) {
    close_handle(local_25c);
    return 0;
  }
  if (bVar7 < 10) {
    no_file_message();
    read_file(local_25c,big_temp_buffer,0x8000,&local_258);
    if (local_258 != 0x8000) {
      close_handle(local_25c);
      return 0;
    }
    iVar13 = 0x4000;
    pcVar9 = big_temp_buffer;
    iVar8 = 0x8a03e4;
    do {
      *(undefined2 *)(iVar8 + 4) = *(undefined2 *)pcVar9;
      pcVar9 = pcVar9 + 2;
      iVar13 = iVar13 + -1;
      iVar8 = iVar8 + 0x10;
    } while (iVar13 != 0);
    land_level_processing_1(0,0x40,1);
    close_handle(local_25c);
    sunlight_init_default();
    return 1;
  }
  no_file_message();
  read_file(local_25c,big_temp_buffer,0x8000,&local_258);
  if (local_258 != 0x8000) {
    close_handle(local_25c);
    return 0;
  }
  iVar13 = 0x4000;
  iVar8 = 0x8a03e4;
  pcVar9 = big_temp_buffer;
  do {
    *(undefined2 *)(iVar8 + 4) = *(undefined2 *)pcVar9;
    pcVar9 = pcVar9 + 2;
    iVar13 = iVar13 + -1;
    iVar8 = iVar8 + 0x10;
  } while (iVar13 != 0);
  land_level_processing_1(0,0x40,0);
  FUN_00422a60(0,0x40);
  no_file_message();
  read_file(local_25c,big_temp_buffer,0x4000,&local_258);
  if (local_258 != 0x4000) {
    close_handle(local_25c);
    return 0;
  }
  no_file_message();
  read_file(local_25c,big_temp_buffer,0x4000,&local_258);
  if (local_258 != 0x4000) {
    close_handle(local_25c);
    return 0;
  }
  no_file_message();
  read_file(local_25c,big_temp_buffer,0x4000,&local_258);
  if (local_258 != 0x4000) {
    close_handle(local_25c);
    return 0;
  }
  plVar14 = game_state.level_data;
  iVar8 = 0x4000;
  pcVar9 = big_temp_buffer;
  do {
    if (*pcVar9 != '\0') {
      plVar14->flags = plVar14->flags | 4;
    }
    plVar14 = plVar14 + 1;
    pcVar9 = pcVar9 + 1;
    iVar8 = iVar8 + -1;
  } while (iVar8 != 0);
  no_file_message();
  read_file(local_25c,big_temp_buffer,0x40,&local_258);
  if (local_258 != 0x40) {
    close_handle(local_25c);
    return 0;
  }
  puVar15 = &game_state.tribes_array[0].tribe_index_1;
  pcVar9 = big_temp_buffer;
  do {
    puVar16 = (undefined2 *)((int)puVar15 + 0xc65);
    *puVar15 = *(undefined2 *)pcVar9;
    puVar15[1] = *(undefined2 *)(pcVar9 + 2);
    puVar15 = puVar16;
    pcVar9 = pcVar9 + 0x10;
  } while (puVar16 < (undefined2 *)((int)&game_state.level_data[0x81].unit_index_2 + 1));
  no_file_message();
  read_file(local_25c,big_temp_buffer,3,&local_258);
  if (local_258 != 3) {
    close_handle(local_25c);
    return 0;
  }
  iVar13 = 1;
  game_state.sunlight[0] = big_temp_buffer[2];
  sunlight_init();
  iStack_248 = 0x14;
  iVar8 = iStack_24c;
  do {
    iStack_24c = iVar8;
    no_file_message();
    read_file(local_25c,big_temp_buffer,0x157c,&local_258);
    if (local_258 != 0x157c) {
      close_handle(local_25c);
      return 0;
    }
    iStack_24c = 100;
    pcVar9 = big_temp_buffer + 1;
    do {
      if (*pcVar9 != '\0') {
        uStack_254 = *(undefined2 *)(pcVar9 + 2);
        uStack_252 = *(undefined2 *)(pcVar9 + 4);
        uStack_250 = 0;
        cVar1 = pcVar9[1];
        if ((int)cVar1 < (int)(uint)(byte)game_state._858439_1_) {
          if ((*pcVar9 == '\a') && (pcVar9[-1] == 'Q')) {
            pcVar9[1] = '\0';
          }
          if ((*pcVar9 == '\x06') && (pcVar9[-1] == '\x06')) {
            pcVar9[1] = '\0';
          }
          cVar2 = pcVar9[1];
          if (cVar2 != -1) {
            local_244[cVar2] = local_244[cVar2] + 1;
          }
          cVar3 = *pcVar9;
          if ((((cVar3 != '\x03') || (((byte)land_flags_1 & 8) == 0)) && (cVar3 != '\t')) &&
             (((cVar3 != '\x06' || (pcVar9[-1] != '\t')) && ((cVar3 != '\a' || (pcVar9[-1] != 'S')))
              ))) {
            if (cVar3 == '\x02') {
              uVar18 = *(int *)(pcVar9 + 6) >> 0x1f & 0x1ff;
              ptr_unit_related_20B->field0_0x0 = (int)(*(int *)(pcVar9 + 6) + uVar18) >> 9;
              ptr_unit_related_20B->field1_0x4 = 0;
              ptr_unit_related_20B->unit_ptr = (unit_struct *)0x2;
              ptr_unit_related_20B->field3_0xc = 0xffffffff;
              puVar6 = ptr_unit_related_20B;
              ptr_unit_related_20B->field4_0x10 = 0;
              ptr_unit_related_20B = ptr_unit_related_20B + 1;
              unit_allocation_flag = 1;
              uVar19 = CONCAT31((int3)(uVar18 >> 8),pcVar9[1]);
              uVar11 = CONCAT31((int3)((uint)puVar6 >> 8),pcVar9[-1]);
              uVar10 = CONCAT31((int3)((uint)&uStack_254 >> 8),*pcVar9);
            }
            else {
              if (cVar3 == '\x01') {
                if (pcVar9[-1] == '\a') {
                  pcVar9[1] = (char)aiStack_230[cVar2];
                }
                else if (((byte)land_flags_1 & 8) != 0) {
                  pcVar9[1] = -1;
                  pcVar9[-1] = '\x01';
                }
              }
              uVar19 = CONCAT31(cVar1 >> 7,pcVar9[1]);
              uVar11 = CONCAT31((int3)((uint)(pcVar9 + -1) >> 8),pcVar9[-1]);
              uVar10 = CONCAT31((int3)((uint)&uStack_254 >> 8),*pcVar9);
            }
            iVar8 = alloc_unit(uVar10,uVar11,uVar19,&uStack_254);
            if (iVar8 != 0) {
              if (*(char *)(iVar8 + 0x2a) == '\0') {
                pcVar9[-1] = '\x03';
              }
              load_level_unit_post_processing(iVar8,pcVar9 + -1);
              *(int *)(iVar8 + 8) = iVar13;
            }
          }
        }
      }
      iVar13 = iVar13 + 1;
      pcVar9 = pcVar9 + 0x37;
      iStack_24c = iStack_24c + -1;
    } while (iStack_24c != 0);
    iStack_248 = iStack_248 + -1;
    iVar8 = 0;
  } while (iStack_248 != 0);
  load_level_units_post_processing_triggers();
  for (puVar4 = allocated_units; puVar4 != (unit_struct *)0x0; puVar4 = puVar4->next_unit_1) {
    puVar4->next_unit = (unit_struct *)0x0;
  }
  load_level_units_post_processing_2();
  load_level_init_units();
  for (puVar4 = allocated_units; puVar5 = allocated_units, puVar21 = unit_array_ptr_1,
      puVar4 != (unit_struct *)0x0; puVar4 = puVar4->next_unit_1) {
    puVar4->flags_4 = puVar4->flags_4 & 0xbfffffff;
  }
  for (; unit_array_ptr_1 = puVar21, puVar5 != (unit_struct *)0x0; puVar5 = puVar5->next_unit_1) {
    if ((puVar5->unit_class == '\x06') && (puVar5->unit_type == '\x06')) {
      psVar20 = &puVar5->coord_scale_2;
      iVar8 = 10;
      do {
        if (*psVar20 != 0) {
          unit_land_array[(ushort)*psVar20]->flags_4 =
               unit_land_array[(ushort)*psVar20]->flags_4 | 0x40000000;
        }
        psVar20 = psVar20 + 1;
        iVar8 = iVar8 + -1;
      } while (iVar8 != 0);
    }
    puVar21 = unit_array_ptr_1;
  }
  if (puVar21 < unit_array_ptr_end_1) {
    do {
      if ((((puVar21->unit_class == '\a') && (puVar21->unit_type == 'Y')) &&
          (interface_state != '\x03')) && ((puVar21->flags_4 & 0x40000000) == 0)) {
        process_convert_wild(puVar21);
      }
      puVar21 = puVar21 + 1;
    } while (puVar21 < unit_array_ptr_end_1);
  }
  set_landscape_c_4_and_texture(0,0x40);
  piVar12 = local_244;
  puVar17 = &game_state.tribes_array[0].f_949;
  do {
    if (*piVar12 == 0) {
      *puVar17 = 0x61;
    }
    puVar17 = (undefined4 *)((int)puVar17 + 0xc65);
    piVar12 = piVar12 + 1;
  } while (piVar12 < local_244 + 4);
  if (10 < bVar7) {
    no_file_message();
    read_file(local_25c,big_temp_buffer,0x96,&local_258);
    if (local_258 != 0x96) {
      close_handle(local_25c);
      return 0;
    }
  }
  close_handle(local_25c);
  return 1;
}
