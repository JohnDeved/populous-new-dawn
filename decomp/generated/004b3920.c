/* Ghidra 12.1.3 pseudocode; entry 004b3920; process_rddata.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


/* WARNING: Removing unreachable block (ram,0x004b3c4e) */
/* WARNING: Removing unreachable block (ram,0x004b3c57) */
/* WARNING: Removing unreachable block (ram,0x004b3c60) */
/* WARNING: Removing unreachable block (ram,0x004b3c6e) */
/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */

void process_rddata(void)

{
  bool bVar1;
  int iVar2;
  int iVar3;
  char cVar4;
  ushort uVar5;
  undefined4 *puVar6;
  char acStack_20 [4];
  uint local_1c;
  int local_18;
  undefined1 local_14 [16];
  undefined1 local_4 [4];

  iVar3 = game_state.offset_counter_2;
  uVar5 = 0;
  local_1c = 0;
  _DAT_0098f71e = sprite_animation_counter;
  _DAT_0098f722 = maybe_framerate;
  _DAT_0098f726 = DAT_005ca84c;
  if ((opened_files_flags & 8) != 0) {
    if ((DAT_0098f74c != 0) && (DAT_0098f74c = DAT_0098f74c + -1, DAT_0098f74c == 0)) {
      FUN_00479f00(8,0,1);
    }
    uVar5 = opened_files_flags & 8;
    local_1c = opened_files_flags & 0x80;
    if (rddata_chunk.chunk != -1) {
      do {
        if ((iVar3 < rddata_chunk.chunk) || (process_rddata_chunk(), rddata_chunk.chunk == -1))
        break;
        no_file_message();
        iVar2 = read_file(rddata_file_descriptor,&rddata_chunk,8,&local_18);
        if (iVar2 != 0) {
          rddata_chunk.chunk = -1;
        }
      } while (rddata_chunk.chunk != -1);
      if (rddata_chunk.chunk != -1) goto LAB_004b3a35;
    }
    if ((opened_files_flags & 0xc00) != 0) {
      opened_files_flags = opened_files_flags & 0xf3ff;
      close_handle(rddata_file_descriptor);
    }
    puVar6 = &DAT_0098f6ec;
    for (iVar2 = 7; iVar2 != 0; iVar2 = iVar2 + -1) {
      *puVar6 = 0;
      puVar6 = puVar6 + 1;
    }
    *(undefined2 *)puVar6 = 0;
    opened_files_flags = opened_files_flags & 0xfff7;
  }
LAB_004b3a35:
  if ((opened_files_flags & 0x10) == 0) {
LAB_004b3d28:
    if ((opened_files_flags & 0x20) == 0) goto LAB_004b3ead;
  }
  else {
    FUN_004b43f0();
    if (rddata_mem_hdr_3.offset != -1) {
      do {
        if (iVar3 < rddata_mem_hdr_3.offset) break;
        cVar4 = '\0';
        if (rddata_mem_hdr_3.chunk_size != 0) {
          no_file_message();
          iVar2 = read_file(rddata_file_handle,&local_18,(int)rddata_mem_hdr_3.chunk_size,local_4);
          cVar4 = '\x01' - (iVar2 == 0);
        }
        if (cVar4 == '\0') {
          if (rddata_mem_hdr_3.field2_0x6 == '\x01') {
            iVar2 = FUN_004439d0();
            if (iVar2 != local_18) {
              cVar4 = '\x01';
            }
            process_tribe_cmd(player_tribe_num * 0xc65 + 0x89d1c8,local_14);
          }
        }
        else {
          rddata_mem_hdr_3.offset = -1;
        }
        if (cVar4 != '\0') {
          DAT_0098f74f = 8;
        }
        if (rddata_mem_hdr_3.offset == -1) break;
        no_file_message();
        iVar2 = read_file(rddata_file_handle,&rddata_mem_hdr_3,8,acStack_20);
        if (iVar2 != 0) {
          rddata_mem_hdr_3.offset = -1;
        }
      } while (rddata_mem_hdr_3.offset != -1);
      if (rddata_mem_hdr_3.offset != -1) goto LAB_004b3d28;
    }
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
    puVar6 = &DAT_0098f6ec;
    for (iVar3 = 7; iVar3 != 0; iVar3 = iVar3 + -1) {
      *puVar6 = 0;
      puVar6 = puVar6 + 1;
    }
    *(undefined2 *)puVar6 = 0;
    FUN_00477780(0);
    if ((local_1c != 0) || ((opened_files_flags & 0x1000) == 0)) goto LAB_004b3d28;
    if ((opened_files_flags & 0x20) == 0) {
      if (uVar5 == 0) {
        cVar4 = read_rddata((int)DAT_0098f748);
        if (cVar4 != '\0') {
          opened_files_flags = opened_files_flags | 0x10;
        }
      }
      else {
        cVar4 = read_rddata((int)DAT_0098f748);
        if ((cVar4 == '\0') || (cVar4 = open_rddata((int)DAT_0098f748), cVar4 == '\0')) {
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
          puVar6 = &DAT_0098f6ec;
          for (iVar3 = 7; iVar3 != 0; iVar3 = iVar3 + -1) {
            *puVar6 = 0;
            puVar6 = puVar6 + 1;
          }
          *(undefined2 *)puVar6 = 0;
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
      }
      goto LAB_004b3d28;
    }
  }
  bVar1 = false;
  if (((&DAT_0098f66c)[DAT_0098f668 * 4] == '\x03') &&
     (((opened_files_flags & 0x10) == 0 ||
      ((1 < (short)(&DAT_0098f66e)[DAT_0098f668 * 2] &&
       ((int)(short)(&DAT_0098f66e)[DAT_0098f668 * 2] <
        (int)((uint)(game_state.offset_counter_2 - _rddata_mem_hdr_1) >> 4))))))) {
    bVar1 = true;
  }
  if (bVar1) {
    local_18 = 0;
    acStack_20[0] = '\0';
    if ('\0' < DAT_0098f669) {
      do {
        if (acStack_20[0] != '\0') goto LAB_004b3ead;
        DAT_0098f668 = DAT_0098f668 + '\x01';
        if (DAT_0098f668 < DAT_0098f669) {
          bVar1 = false;
          cVar4 = (&DAT_0098f66c)[DAT_0098f668 * 4];
          if (cVar4 == '\x01') {
            FUN_004b2700();
            DAT_0089d161 = DAT_0098f712;
            FUN_0049cfa0(2);
            FUN_004b4770();
          }
          else if (cVar4 == '\x02') {
            if ('\x01' < DAT_0098f669) {
              cVar4 = read_rddata_2((int)DAT_0098f74a);
              goto joined_r0x004b3e19;
            }
LAB_004b3e31:
            bVar1 = true;
          }
          else if (cVar4 == '\x03') {
            DAT_0098f748 = (short)(char)(&DAT_0098f66d)[DAT_0098f668 * 4];
            cVar4 = FUN_004b3ed0();
joined_r0x004b3e19:
            if (cVar4 == '\0') goto LAB_004b3e31;
          }
          if (bVar1) {
            DAT_0098f74f = 8;
            break;
          }
          acStack_20[0] = '\x01';
        }
        local_18 = local_18 + 1;
      } while (local_18 < DAT_0098f669);
    }
    if (acStack_20[0] == '\0') {
      FUN_004b2700();
      DAT_0089d161 = DAT_0098f712;
      FUN_0049cfa0(2);
      if (('\x01' < DAT_0098f750) && (DAT_0098f750 < '\x04')) {
        set_interface_state_2_3(7);
      }
      DAT_0098f750 = '\0';
      load_level_flags = load_level_flags & 0xfbffffff;
      FUN_004194f0();
    }
  }
LAB_004b3ead:
  if (((opened_files_flags & 1) != 0) && ((opened_files_flags & 0xfc) == 0)) {
    opened_files_flags = opened_files_flags | 0x2002;
  }
  return;
}
