/* Ghidra 12.1.3 pseudocode; entry 004a5590; main_loop_outer.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void main_loop_outer(void)

{
  char cVar1;
  DWORD DVar2;
  uint uVar3;
  undefined1 *puVar4;
  undefined4 uVar5;
  int iVar6;
  undefined4 *puVar7;
  undefined4 *puVar8;
  int iVar9;
  undefined1 local_58;
  uint local_57;
  undefined4 local_15;
  undefined4 local_11;
  undefined1 local_d;
  undefined1 local_c;
  undefined4 local_b;
  undefined4 local_7;

  tick_inc_quant = (int)(1000 / (ulonglong)(longlong)(int)(uint)DAT_0089d161);
  if (game_state.offset_counter == 0) {
    DVar2 = GetTickCount();
    ticks_1 = DVar2 - 1;
  }
  uVar3 = land_flags_1 & 8;
  if ((uVar3 != 0) && (game_state.offset_counter == 0)) {
    iVar6 = 0x89d1c8;
    puVar4 = &game_state.tribe_command[0].cmd;
    do {
      *puVar4 = 0;
      if (*(char *)(iVar6 + 0xc20) != '\0') {
        *puVar4 = 0x1b;
      }
      puVar4 = puVar4 + 0xf;
      iVar6 = iVar6 + 0xc65;
    } while (puVar4 < &game_state.tribes_array[0].coord_vect.field3_0xc);
    process_tribes_cmd();
    game_state.offset_counter = 1;
    puVar7 = ms_array;
    do {
      puVar8 = puVar7 + 1;
      uVar5 = GetCurrentMs();
      *puVar7 = uVar5;
      puVar7 = puVar8;
    } while (puVar8 < &DAT_008956cf);
    DVar2 = GetTickCount();
    ticks_1 = DVar2 - 1;
    return;
  }
  if (uVar3 != 0) {
    if (DAT_0089569d == '\0') {
      if (((land_flags_1 & 0x40) == 0) && ((&DAT_0089569e)[DAT_00894cf5] == '\0')) {
        DVar2 = GetTickCount();
        if (DVar2 <= ticks_1) {
          return;
        }
        do {
          local_58 = 7;
          mld_function_2(0xfffffffe,&local_58,1,0,0);
          ticks_1 = ticks_1 + tick_inc_quant * 3;
          DVar2 = GetTickCount();
        } while (ticks_1 < DVar2);
        return;
      }
      if ((land_flags_1 & 0x40) == 0) {
        ticks_1 = GetTickCount();
      }
      else if (game_state.offset_counter == DAT_008956a6) {
        do {
          DVar2 = GetTickCount();
          if (DVar2 <= ticks_1) break;
          local_58 = 0xe;
          mld_function_2(0xfffffffe,&local_58,1,0,0);
          ticks_1 = ticks_1 + tick_inc_quant * 3;
        } while ((land_flags_1 & 0x40) != 0);
      }
      DAT_0089d163 = 1;
      do {
        cVar1 = mld_function_3();
        if (cVar1 == '\0') {
          return;
        }
        if ((level_flags_1 & 0xc00000) != 0) {
          netcam_rec();
        }
        process_tribes_cmd();
        FUN_0047aac0();
        inc_tribes_commands();
        clear_temp_tribe_command_buffer();
        for (iVar6 = DAT_00895dac + 1; iVar6 != 0; iVar6 = iVar6 + -1) {
          if ((land_flags_1 & 0x800000) == 0) {
            process_tribe_1();
          }
          FUN_004a5d40();
          main_loop_inner();
        }
      } while (DAT_0089569d == '\0');
      return;
    }
    if (uVar3 != 0) {
      if ((&DAT_0089569e)[DAT_00894cf5] == '\0') {
        DVar2 = GetTickCount();
        if (DVar2 <= ticks_1) {
          return;
        }
        do {
          local_58 = 6;
          local_57 = (uint)(ushort)level_number;
          local_15 = DAT_0089bc2a;
          local_11 = DAT_0089bc2e;
          local_d = DAT_0089bc61;
          local_c = DAT_0089bc60;
          local_b = DAT_008956b7;
          local_7 = DAT_008956bb;
          mld_function_2(0xffffffff,&local_58,0x55,0,0);
          ticks_1 = ticks_1 + tick_inc_quant * 3;
          DVar2 = GetTickCount();
        } while (ticks_1 < DVar2);
        return;
      }
      if ((land_flags_1 & 0x40) == 0) {
        iVar6 = 0;
        DVar2 = GetTickCount();
        if (DVar2 <= ticks_1) {
          return;
        }
        do {
          if (3 < iVar6) {
            return;
          }
          DAT_0089d163 = 1;
          cVar1 = mld_function_3();
          if (cVar1 != '\0') {
            if ((level_flags_1 & 0xc00000) != 0) {
              netcam_rec();
            }
            process_tribes_cmd();
            FUN_0047aac0();
            inc_tribes_commands();
            clear_temp_tribe_command_buffer();
            for (iVar9 = DAT_00895dac + 1; iVar9 != 0; iVar9 = iVar9 + -1) {
              if ((land_flags_1 & 0x800000) == 0) {
                process_tribe_1();
              }
              FUN_004a5d40();
              main_loop_inner();
            }
          }
          iVar6 = iVar6 + 1;
          ticks_1 = ticks_1 + tick_inc_quant;
          DVar2 = GetTickCount();
        } while (ticks_1 < DVar2);
        return;
      }
      DVar2 = GetTickCount();
      if (DVar2 <= ticks_1) {
        return;
      }
      do {
        local_58 = 0xd;
        local_57 = game_state.offset_counter;
        mld_function_2(0xffffffff,&local_58,5,0,0);
        ticks_1 = ticks_1 + tick_inc_quant * 3;
        DVar2 = GetTickCount();
      } while (ticks_1 < DVar2);
      return;
    }
  }
  DVar2 = GetTickCount();
  if (ticks_1 < DVar2) {
    do {
      DAT_0089d163 = 1;
      cVar1 = mld_function_3();
      if (cVar1 != '\0') {
        if ((level_flags_1 & 0xc00000) != 0) {
          netcam_rec();
        }
        process_tribes_cmd();
        FUN_0047aac0();
        inc_tribes_commands();
        clear_temp_tribe_command_buffer();
        for (iVar6 = DAT_00895dac + 1; iVar6 != 0; iVar6 = iVar6 + -1) {
          if ((DAT_0089bb81 == '\x02') || (DAT_0089bb81 == '\x03')) {
            FUN_004af640();
          }
          else {
            process_rddata();
            if ((land_flags_1 & 0x800000) == 0) {
              process_tribe_1();
            }
            FUN_004a5d40();
            main_loop_inner();
          }
        }
      }
      ticks_1 = ticks_1 + tick_inc_quant;
      DVar2 = GetTickCount();
    } while (ticks_1 < DVar2);
  }
  return;
}
