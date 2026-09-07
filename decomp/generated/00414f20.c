/* Ghidra 12.1.3 pseudocode; entry 00414f20; FUN_00414f20.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


/* WARNING: Type propagation algorithm not settling */

undefined4 FUN_00414f20(void)

{
  char cVar1;
  int *piVar2;
  tm *_Tm;
  char *pcVar3;
  undefined2 extraout_var;
  undefined2 extraout_var_00;
  undefined2 uVar4;
  uint uVar5;
  int iVar6;
  uint uVar7;
  int iVar8;
  int iVar9;
  undefined1 *puVar10;
  int *piVar11;
  int *piVar12;
  char *pcVar13;
  time_t tVar14;
  wchar_t *_Source;
  char local_19e;
  char local_19d;
  int local_19c;
  undefined4 local_198;
  undefined4 local_194;
  int local_190 [68];
  time_t local_80 [16];

  local_194 = 1;
  if (DAT_008956db == (FILE *)0x0) {
    tVar14 = _time((time_t *)0x0);
    local_80[0]._0_4_ = (undefined4)tVar14;
    get_global_file_path(local_190,s_SAVE_005999ec,0);
    uVar5 = 0xffffffff;
    pcVar3 = s__sync_log_00599cac;
    do {
      pcVar13 = pcVar3;
      if (uVar5 == 0) break;
      uVar5 = uVar5 - 1;
      pcVar13 = pcVar3 + 1;
      cVar1 = *pcVar3;
      pcVar3 = pcVar13;
    } while (cVar1 != '\0');
    uVar5 = ~uVar5;
    iVar6 = -1;
    piVar11 = local_190;
    do {
      piVar12 = piVar11;
      if (iVar6 == 0) break;
      iVar6 = iVar6 + -1;
      piVar12 = (int *)((int)piVar11 + 1);
      iVar8 = *piVar11;
      piVar11 = piVar12;
    } while ((char)iVar8 != '\0');
    pcVar3 = pcVar13 + -uVar5;
    pcVar13 = (char *)((int)piVar12 + -1);
    for (uVar7 = uVar5 >> 2; uVar7 != 0; uVar7 = uVar7 - 1) {
      *(undefined4 *)pcVar13 = *(undefined4 *)pcVar3;
      pcVar3 = pcVar3 + 4;
      pcVar13 = pcVar13 + 4;
    }
    for (uVar5 = uVar5 & 3; uVar5 != 0; uVar5 = uVar5 - 1) {
      *pcVar13 = *pcVar3;
      pcVar3 = pcVar3 + 1;
      pcVar13 = pcVar13 + 1;
    }
    DAT_008956db = FID_conflict___wfopen((char *)local_190,&DAT_00599ca8);
    if (DAT_008956db != (FILE *)0x0) {
      _Tm = _gmtime(local_80);
      pcVar3 = _asctime(_Tm);
      _fprintf(DAT_008956db,s________________Sync_Log_started___00599c84,pcVar3);
    }
  }
  iVar6 = 0;
  do {
    iVar8 = iVar6;
    if ((*(byte *)(struct_g2_ARRAY_00894cfe + (byte)(&DAT_008956ab)[iVar6]) & 0xf0) != 0) break;
    iVar6 = iVar6 + 1;
    iVar8 = local_190[0];
  } while (iVar6 < 4);
  if (game_state._858439_1_ == '\x01') {
    if ((land_flags_1 & 0x1000) == 0) {
      return local_194;
    }
    FUN_004154a0();
    uVar4 = extraout_var_00;
  }
  else {
    EnterCriticalSection((LPCRITICAL_SECTION)&critical_section_3);
    piVar11 = DAT_00599c40;
    if ((land_flags_1 & 0x1000) == 0) {
joined_r0x00415033:
      do {
        if (piVar11 == (int *)0x0) break;
        if (game_state.offset_counter < piVar11[2] + 100U) {
          local_19e = '\0';
          local_19d = '\0';
          local_198 = 0;
          local_19c = 0;
          do {
            if (local_19c == iVar8) {
LAB_004151cf:
              *(undefined1 *)((int)&local_198 + (uint)(byte)(&DAT_008956ab)[local_19c]) = 1;
            }
            else {
              pcVar3 = (char *)((int)&local_198 + (uint)(byte)(&DAT_008956ab)[local_19c]);
              if (*pcVar3 != '\0') goto LAB_004151cf;
              if ((*(byte *)(struct_g2_ARRAY_00894cfe + (byte)(&DAT_008956ab)[local_19c]) & 0xf) !=
                  0) {
                *pcVar3 = '\x01';
                local_19d = local_19d + '\x01';
                if (*(char *)((int)piVar11 + local_19c + 0xc) != '\0') {
                  iVar6 = 0;
                  local_19e = local_19e + '\x01';
                  do {
                    cVar1 = *(char *)((int)piVar11 + iVar8 + iVar6 + 0xc);
                    if (((*(char *)(local_19c + iVar6 + 0xc + (int)piVar11) != cVar1) &&
                        (cVar1 != '\0')) &&
                       (local_19e = local_19e + -1, (land_flags_1 & 0x1000) == 0)) {
                      if (DAT_008956db != (FILE *)0x0) {
                        _fprintf(DAT_008956db,s________________Out_of_Sync__00599dd4);
                        switch(DAT_0089ce54) {
                        case 0:
                          _Source = u_Seed_00599da4;
                          break;
                        case 1:
                          _Source = u_Num_Players_00599d8c;
                          break;
                        case 2:
                          _Source = u_Num_People___Bldgs_00599d64;
                          break;
                        case 3:
                          _Source = u_Player_Things_Data_00599d3c;
                          break;
                        case 4:
                          _Source = u_Wild_Things_Data_00599d18;
                          break;
                        case 5:
                          _Source = u_Creature_Things_Data_00599cec;
                          break;
                        case 6:
                          _Source = u_Map_Segment_Data_00599cc8;
                          break;
                        default:
                          _Source = u_Unknown_00599cb8;
                        }
                        _wcscpy((wchar_t *)local_190,_Source);
                        FUN_0049a690(local_80,local_190);
                        _fprintf(DAT_008956db,s_GT__d__Player__d__Checksum__d__s_00599db0,piVar11[2]
                                 ,local_19c,iVar6,local_80);
                      }
                      land_flags_1 = land_flags_1 | 0x1000;
                      DAT_0089ce54 = (undefined1)iVar6;
                      DAT_0089ce55 = (undefined1)local_19c;
                      local_194 = 0;
                      DAT_005fcb14 = '\x01';
                      DAT_00599c20 = 0;
                      DAT_0089ce56 = piVar11;
                      break;
                    }
                    iVar6 = iVar6 + 1;
                  } while (iVar6 < 1);
                }
              }
            }
            local_19c = local_19c + 1;
          } while (local_19c < 4);
          if ((local_19e != local_19d) || (local_19d == '\0')) {
            piVar11 = (int *)piVar11[1];
            goto joined_r0x00415033;
          }
          if (DAT_0089569d != '\0') {
            FUN_00442e10(piVar11[2]);
          }
          if (DAT_00599c40 == piVar11) {
            DAT_00599c40 = (int *)piVar11[1];
          }
          if (DAT_00599c44 == piVar11) {
            DAT_00599c44 = (int *)*piVar11;
          }
          piVar12 = (int *)piVar11[1];
          if (*piVar11 != 0) {
            *(int **)(*piVar11 + 4) = piVar12;
          }
          piVar2 = (int *)piVar11[1];
        }
        else {
          if (DAT_00599c40 == piVar11) {
            DAT_00599c40 = (int *)piVar11[1];
          }
          if (DAT_00599c44 == piVar11) {
            DAT_00599c44 = (int *)*piVar11;
          }
          piVar12 = (int *)piVar11[1];
          if (*piVar11 != 0) {
            *(int **)(*piVar11 + 4) = piVar12;
          }
          piVar2 = (int *)piVar11[1];
        }
        if (piVar2 != (int *)0x0) {
          *piVar2 = *piVar11;
        }
        free_2(piVar11);
        piVar11 = piVar12;
      } while( true );
    }
    LeaveCriticalSection((LPCRITICAL_SECTION)&critical_section_3);
    uVar4 = extraout_var;
  }
  uVar5 = land_flags_1;
  if ((land_flags_1 & 0x1000) != 0) {
    if (DAT_005fcb14 == '\0') {
      land_flags_1 = land_flags_1 | 0x200;
      if ((((byte)level_flags_2 & 0x10) != 0) && ((uVar5 & 2) == 0)) {
        FUN_00479f00(10,CONCAT22(uVar4,(short)player_tribe_num),1);
      }
      iVar6 = 0;
      puVar10 = &game_state.tribe_command[0].cmd;
      do {
        if (iVar6 != iVar8) {
          switch(*puVar10) {
          case 0x14:
          case 0x1b:
          case 0x1c:
          case 0x29:
          case 0x2c:
          case 0x32:
          case 0x33:
            break;
          default:
            *puVar10 = 0;
          }
        }
        puVar10 = puVar10 + 0xf;
        iVar6 = iVar6 + 1;
      } while (puVar10 < &game_state.tribes_array[0].coord_vect.field3_0xc);
    }
    else {
      land_flags_1 = land_flags_1 & 0xffffefff;
      if (DAT_0089bc8a == 0) {
        DAT_0089ce44 = 1;
      }
      else {
        uVar5 = (int)(DAT_0089bc8a - game_state.offset_counter) >> 0x1f;
        if ((int)((uint)DAT_0089d161 * 5) <
            (int)((DAT_0089bc8a - game_state.offset_counter ^ uVar5) - uVar5)) {
          DAT_0089ce44 = 1;
        }
        else {
          DAT_0089ce44 = DAT_0089ce44 + 1;
          if (3 < DAT_0089ce44) {
            DAT_005fcb14 = '\x03';
          }
        }
      }
      DAT_0089bc8a = game_state.offset_counter;
      if (DAT_005fcb14 == '\x02') {
        land_flags_1 = land_flags_1 | 0x20;
      }
      if ((DAT_0089569d != '\0') && ((land_flags_1 & 0x20) == 0)) {
        iVar9 = 0;
        iVar6 = 0;
        do {
          (&game_state.tribe_command[0].field5_0xe)[iVar6] = 0;
          (&DAT_005fcc17)[iVar6] = 0;
          if (iVar9 == iVar8) {
            (&DAT_005fcc11)[iVar6] = 0x29;
            uVar5 = (uint)DAT_0089ce44;
            *(undefined4 *)((int)&DAT_005fcc09 + iVar6) = 0xc;
            *(uint *)((int)&DAT_005fcc0d + iVar6) = uVar5;
            (&game_state.tribe_command[0].cmd)[iVar6] = 0x29;
            *(undefined4 *)((int)&game_state.tribe_command[0].arg1 + iVar6) = 0xc;
            *(uint *)((int)&game_state.tribe_command[0].arg2 + iVar6) = uVar5;
          }
          else {
            (&DAT_005fcc11)[iVar6] = 0;
            (&game_state.tribe_command[0].cmd)[iVar6] = 0;
          }
          iVar6 = iVar6 + 0xf;
          iVar9 = iVar9 + 1;
        } while (iVar6 < 0x3c);
      }
    }
  }
  return local_194;
}
