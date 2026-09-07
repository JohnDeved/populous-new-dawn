/* Ghidra 12.1.3 pseudocode; entry 0049c1a0; read_levels_const.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


int read_levels_const(void)

{
  int iVar1;
  byte bVar2;
  uint uVar3;
  level_const *plVar4;
  char cVar5;
  byte *pbVar6;
  int iVar7;
  byte *pbVar8;
  int iVar9;
  char *pcVar10;
  level_const *plVar11;
  bool bVar12;
  int local_230;
  byte *local_22c;
  int local_228;
  byte *local_224;
  undefined1 local_220 [272];
  char local_110 [272];

  pbVar6 = big_temp_buffer;
  iVar7 = 0;
  local_228 = 0;
  if ((load_level_flags._2_1_ & 0x40) == 0) {
    get_global_file_path(local_220,s_LEVELS_0059cd2c,0);
    _sprintf(local_110,s__s__s_00599b34,local_220,s_constant_dat_005ca910);
    reset_global_palettes();
    no_file_message();
    file_name_validation(global_string_buffer,local_110);
    iVar1 = read_file_to_mem(global_string_buffer,pbVar6,0xfffffff,&local_230);
    if (iVar1 != 0) {
      memcpy_1(local_220,s_LEVELS_0059cd2c,0);
      _sprintf(local_110,s__s__s_00599b34,local_220,s_constant_dat_005ca910);
      reset_global_palettes();
      no_file_message();
      file_name_validation(global_string_buffer,local_110);
      read_file_to_mem(global_string_buffer,pbVar6,0xfffffff,&local_230);
    }
    if (local_230 != 0) {
      if ((*pbVar6 == 0x40) && (pbVar6[1] == 0x7e)) {
        cVar5 = '\0';
        for (pbVar8 = pbVar6; pbVar8 < pbVar6 + local_230; pbVar8 = pbVar8 + 1) {
          bVar2 = cVar5 - 3;
          cVar5 = cVar5 + '\x01';
          *pbVar8 = ~('\x01' << (bVar2 & 7) ^ *pbVar8);
        }
        *pbVar6 = 0x20;
        pbVar6[1] = 0x20;
      }
      for (pbVar8 = pbVar6; pbVar8 < pbVar6 + local_230; pbVar8 = pbVar8 + 1) {
        if (*pbVar8 == 10) {
          *pbVar8 = 0;
        }
      }
      pbVar8 = (byte *)((uint)(pbVar6 + local_230 + 0x20) & 0xfffffff0);
      uVar3 = 0xffffffff;
      local_224 = pbVar6 + local_230;
      pcVar10 = s_P3CONST__005ca904;
      do {
        if (uVar3 == 0) break;
        uVar3 = uVar3 - 1;
        cVar5 = *pcVar10;
        pcVar10 = pcVar10 + 1;
      } while (cVar5 != '\0');
      local_22c = pbVar8;
      for (; pbVar6 < local_224; pbVar6 = pbVar6 + 1) {
        iVar1 = _iswctype((ushort)*pbVar6,8);
        while (iVar1 != 0) {
          pbVar6 = pbVar6 + 1;
          iVar1 = _iswctype((ushort)*pbVar6,8);
        }
        if ((((((*pbVar6 != 0x23) && (*pbVar6 == 0x50)) && (pbVar6[1] == 0x33)) &&
             ((pbVar6[2] == 0x43 && (pbVar6[3] == 0x4f)))) &&
            ((pbVar6[4] == 0x4e && ((pbVar6[5] == 0x53 && (pbVar6[6] == 0x54)))))) &&
           (pbVar6[7] == 0x5f)) {
          pbVar6 = pbVar6 + (~uVar3 - 1);
          iVar1 = _sscanf((char *)pbVar6,s__s____ld_005ca8f8,pbVar8,pbVar8 + 0x19);
          if (iVar1 == 2) {
            pbVar8[0x18] = 0;
            iVar7 = iVar7 + 1;
            pbVar8 = pbVar8 + 0x1d;
          }
        }
        bVar2 = *pbVar6;
        while (bVar2 != 0) {
          pbVar6 = pbVar6 + 1;
          bVar2 = *pbVar6;
        }
      }
      plVar4 = level_const_ARRAY_005aa5f0;
      cVar5 = level_const_ARRAY_005aa5f0[0].name[0];
      while (cVar5 != '\0') {
        iVar1 = 0;
        plVar4->flags = plVar4->flags & 0xfb;
        pbVar6 = local_22c;
        plVar11 = plVar4;
        pbVar8 = local_22c;
        if (0 < iVar7) {
LAB_0049c3e0:
          do {
            bVar2 = *pbVar6;
            bVar12 = bVar2 < (byte)plVar11->name[0];
            if (bVar2 == plVar11->name[0]) {
              if (bVar2 != 0) {
                bVar2 = pbVar6[1];
                bVar12 = bVar2 < (byte)plVar11->name[1];
                if (bVar2 != plVar11->name[1]) goto LAB_0049c400;
                pbVar6 = pbVar6 + 2;
                plVar11 = (level_const *)(plVar11->name + 2);
                if (bVar2 != 0) goto LAB_0049c3e0;
              }
              iVar9 = 0;
            }
            else {
LAB_0049c400:
              iVar9 = (1 - (uint)bVar12) - (uint)(bVar12 != 0);
            }
            if (iVar9 == 0) {
              cVar5 = plVar4->const_size_bytes;
              if (cVar5 == '\x01') {
                *(byte *)plVar4->val_ptr = pbVar8[0x19];
              }
              else if (cVar5 == '\x02') {
                *(short *)plVar4->val_ptr = (short)*(undefined4 *)(pbVar8 + 0x19);
              }
              else if (cVar5 == '\x04') {
                *plVar4->val_ptr = *(undefined4 *)(pbVar8 + 0x19);
              }
              plVar4->flags = plVar4->flags | 4;
              local_228 = local_228 + 1;
              break;
            }
            iVar1 = iVar1 + 1;
            pbVar6 = pbVar8 + 0x1d;
            plVar11 = plVar4;
            pbVar8 = pbVar6;
          } while (iVar1 < iVar7);
        }
        plVar4 = plVar4 + 1;
        cVar5 = plVar4->name[0];
      }
    }
  }
  plVar4 = level_const_ARRAY_005aa5f0;
  cVar5 = level_const_ARRAY_005aa5f0[0].name[0];
  while (cVar5 != '\0') {
    if ((plVar4->flags & 4) != 0) {
      if ((plVar4->flags & 1) != 0) {
        cVar5 = plVar4->const_size_bytes;
        if (cVar5 == '\x01') {
          *(byte *)plVar4->val_ptr = (byte)(((uint)*(byte *)plVar4->val_ptr << 8) / 100);
        }
        else if (cVar5 == '\x02') {
          *(ushort *)plVar4->val_ptr = (ushort)(((uint)*(ushort *)plVar4->val_ptr << 8) / 100);
        }
        else if (cVar5 == '\x04') {
          *plVar4->val_ptr = (uint)(*plVar4->val_ptr << 8) / 100;
        }
      }
      if (((plVar4->flags & 2) != 0) && (-1 < unit_related_struct_26B_ARRAY_005a7b90[0].field0_0x0))
      {
        pbVar6 = &unit_related_struct_26B_ARRAY_005a7b90[0].field_0x18;
        do {
          if ((*pbVar6 & 1) != 0) {
            *(short *)(pbVar6 + -8) = (short)land_const_1;
          }
          pbVar8 = pbVar6 + 2;
          pbVar6 = pbVar6 + 0x1a;
        } while (-1 < *(short *)pbVar8);
      }
    }
    plVar4 = plVar4 + 1;
    cVar5 = plVar4->name[0];
  }
  pbVar6 = &unit_type_array_building[1].field_0x48;
  do {
    if ((*pbVar6 & 1) != 0) {
      pbVar6[-0x28] = *(byte *)&unit_type_array_person[pbVar6[-0x17]].conv;
    }
    pbVar6 = pbVar6 + 0x4c;
  } while (pbVar6 < &unit_type_array_building[0x13].field_0x49);
  DAT_005aa448 = DAT_005aa440;
  if (DAT_005aa440 <= DAT_005aa43c) {
    DAT_005aa448 = DAT_005aa43c;
  }
  if (DAT_005aa448 <= DAT_005aa444) {
    DAT_005aa448 = DAT_005aa444;
  }
  return local_228;
}
