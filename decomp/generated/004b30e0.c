/* Ghidra 12.1.3 pseudocode; entry 004b30e0; read_rddata_2.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


/* WARNING: Removing unreachable block (ram,0x004b357f) */
/* WARNING: Removing unreachable block (ram,0x004b3588) */
/* WARNING: Removing unreachable block (ram,0x004b3591) */
/* WARNING: Removing unreachable block (ram,0x004b359f) */

bool read_rddata_2(undefined4 param_1)

{
  byte bVar1;
  bool bVar2;
  bool bVar3;
  bool bVar4;
  char cVar5;
  int iVar6;
  byte *pbVar7;
  uint uVar8;
  int iVar9;
  byte *_Src;
  char *pcVar10;
  undefined4 *puVar11;
  int local_30c;
  undefined4 local_308;
  undefined1 local_304 [4];
  char local_300 [256];
  char local_200 [256];
  undefined1 local_100 [256];

  _Src = big_temp_buffer;
  bVar3 = false;
  DAT_0098f669 = '\0';
  DAT_0098f668 = -1;
  _sprintf(local_200,s_RD_s_03d__s_005ce0a4,&DAT_005ce0b0,param_1,s_DAT_00599850);
  FUN_00500070(local_100,s_RDDATA_005ce058,local_200,0);
  reset_global_palettes();
  no_file_message();
  file_name_validation(global_string_buffer,local_100);
  iVar6 = read_file_to_mem(global_string_buffer,_Src,0xfffffff,&local_30c);
  if ((iVar6 == 0) && (local_30c != 0)) {
    for (pbVar7 = _Src; pbVar7 < _Src + local_30c; pbVar7 = pbVar7 + 1) {
      if (*pbVar7 == 10) {
        *pbVar7 = 0;
      }
    }
    pbVar7 = _Src + local_30c;
    uVar8 = 0xffffffff;
    pcVar10 = s_MONTYPE__005ce098;
    do {
      if (uVar8 == 0) break;
      uVar8 = uVar8 - 1;
      cVar5 = *pcVar10;
      pcVar10 = pcVar10 + 1;
    } while (cVar5 != '\0');
    for (; _Src < pbVar7; _Src = _Src + 1) {
      iVar6 = _iswctype((ushort)*_Src,8);
      while (iVar6 != 0) {
        _Src = _Src + 1;
        iVar6 = _iswctype((ushort)*_Src,8);
      }
      if ((((((*_Src != 0x23) && (*_Src == 0x4d)) && (_Src[1] == 0x4f)) &&
           ((_Src[2] == 0x4e && (_Src[3] == 0x54)))) &&
          ((_Src[4] == 0x59 && ((_Src[5] == 0x50 && (_Src[6] == 0x45)))))) && (_Src[7] == 0x5f)) {
        _Src = _Src + (~uVar8 - 1);
        iVar6 = _sscanf((char *)_Src,s__s__ld__ld_005ce08c,local_300,local_304,&local_308);
        if (iVar6 == 3) {
          iVar6 = __strcmpi(s_GAME_005ce084,local_300);
          if (iVar6 == 0) {
            (&DAT_0098f66c)[DAT_0098f669 * 4] = 3;
            (&DAT_0098f66e)[DAT_0098f669 * 2] = (short)local_308;
            (&DAT_0098f66d)[DAT_0098f669 * 4] = local_304[0];
          }
          else {
            iVar6 = __strcmpi(s_STOP_005ce07c,local_300);
            if (iVar6 == 0) {
              (&DAT_0098f66c)[DAT_0098f669 * 4] = 1;
            }
            else {
              iVar6 = __strcmpi(s_RESTART_005ce074,local_300);
              if (iVar6 != 0) goto LAB_004b3310;
              (&DAT_0098f66c)[DAT_0098f669 * 4] = 2;
            }
          }
          DAT_0098f669 = DAT_0098f669 + '\x01';
        }
      }
LAB_004b3310:
      bVar1 = *_Src;
      while (bVar1 != 0) {
        _Src = _Src + 1;
        bVar1 = *_Src;
      }
    }
    DAT_0098f66a = 1;
  }
  else {
    bVar3 = true;
  }
  if (!bVar3) {
    bVar2 = false;
    iVar6 = 0;
    if ('\0' < DAT_0098f669) {
      do {
        if (bVar2) goto LAB_004b3681;
        DAT_0098f668 = DAT_0098f668 + '\x01';
        if (DAT_0098f668 < DAT_0098f669) {
          bVar2 = false;
          cVar5 = (&DAT_0098f66c)[DAT_0098f668 * 4];
          if (cVar5 == '\x01') {
            if ((opened_files_flags & 0x300) != 0) {
              opened_files_flags = opened_files_flags & 0xfcff;
              close_handle(rddata_file_handle);
            }
            if ((opened_files_flags & 0xc00) != 0) {
              opened_files_flags = opened_files_flags & 0xf3ff;
              close_handle(rddata_file_descriptor);
            }
            opened_files_flags = opened_files_flags & 0xff03;
            FUN_0042c8f0();
            vconfig_index_start = 0;
            update_vfconfig();
            if (draw_mode == 2) {
              FUN_00418890();
            }
            FUN_00417c00(0);
            FUN_004b36b0(0x30);
            puVar11 = &DAT_0098f6ec;
            for (iVar9 = 7; iVar9 != 0; iVar9 = iVar9 + -1) {
              *puVar11 = 0;
              puVar11 = puVar11 + 1;
            }
            *(undefined2 *)puVar11 = 0;
            DAT_0098f73e = 0;
            DAT_0098f742 = 0;
            FUN_004b47b0();
            FUN_00479f00(10,(short)player_tribe_num,0);
            FUN_004b4370();
            FUN_00417c00(0);
            level_flags_1 = level_flags_1 & 0xffefffff;
            puVar11 = &DAT_0098f6ec;
            for (iVar9 = 7; iVar9 != 0; iVar9 = iVar9 + -1) {
              *puVar11 = 0;
              puVar11 = puVar11 + 1;
            }
            *(undefined2 *)puVar11 = 0;
            FUN_00477780(0);
            opened_files_flags = opened_files_flags | 0x4000;
            DAT_0089d161 = DAT_0098f712;
            FUN_0049cfa0(2);
            if (('\x01' < DAT_0098f750) && (DAT_0098f750 < '\x04')) {
              set_interface_state_2_3(7);
            }
            DAT_0098f750 = '\0';
            load_level_flags = load_level_flags & 0xfbffffff;
            FUN_004194f0();
          }
          else if (cVar5 == '\x02') {
            if ((DAT_0098f669 < '\x02') || (cVar5 = read_rddata_2((int)DAT_0098f74a), cVar5 == '\0')
               ) {
LAB_004b364f:
              bVar2 = true;
            }
          }
          else if (cVar5 == '\x03') {
            bVar4 = false;
            DAT_0098f748 = (short)(char)(&DAT_0098f66d)[DAT_0098f668 * 4];
            cVar5 = read_rddata((int)DAT_0098f748);
            if ((cVar5 == '\0') || (cVar5 = open_rddata((int)DAT_0098f748), cVar5 == '\0')) {
              bVar4 = true;
              if ((opened_files_flags & 0x300) != 0) {
                opened_files_flags = opened_files_flags & 0xfcff;
                close_handle(rddata_file_handle);
              }
              if ((opened_files_flags & 0xc00) != 0) {
                opened_files_flags = opened_files_flags & 0xf3ff;
                close_handle(rddata_file_descriptor);
              }
              opened_files_flags = opened_files_flags & 0xff27;
              FUN_00417c00(0);
              level_flags_1 = level_flags_1 & 0xffefffff;
              puVar11 = &DAT_0098f6ec;
              for (iVar9 = 7; iVar9 != 0; iVar9 = iVar9 + -1) {
                *puVar11 = 0;
                puVar11 = puVar11 + 1;
              }
              *(undefined2 *)puVar11 = 0;
              FUN_00477780(0);
            }
            else {
              opened_files_flags = opened_files_flags | 0x18;
              FUN_00479f00(8,0,1);
              level_flags_1 = level_flags_1 | 0x80000;
              FUN_004af0a0(0x20);
              FUN_0049cf90(2);
              DAT_009845a0 = 0;
              DAT_009846e8 = 0;
            }
            if (bVar4) goto LAB_004b364f;
          }
          if (bVar2) {
            DAT_0098f74f = 8;
            bVar2 = false;
            break;
          }
          bVar2 = true;
        }
        iVar6 = iVar6 + 1;
      } while (iVar6 < DAT_0098f669);
    }
    if (!bVar2) {
      bVar3 = true;
    }
LAB_004b3681:
    if (!bVar3) goto LAB_004b368f;
  }
  DAT_0098f74f = 8;
LAB_004b368f:
  return !bVar3;
}
