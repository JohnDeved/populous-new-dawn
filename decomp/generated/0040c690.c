/* Ghidra 12.1.3 pseudocode; entry 0040c690; load_objs.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


char load_objs(byte param_1)

{
  byte bVar1;
  char cVar2;
  int iVar3;
  objs0_struct *poVar4;
  char *pcVar5;
  uint uVar6;
  int local_48;
  undefined4 local_44;
  char local_40 [64];

  uVar6 = (uint)(char)param_1;
  if (current_obj_num != uVar6) {
    if (objs0_0_loaded != '\0') {
      free_sprite_array(&objects_objs0_0_dat_sprite);
      set_global_resource(6,3,0,0);
      objs0_0_loaded = '\0';
    }
    _sprintf(local_40,s_objects_objs0__d_ver_00599898,uVar6);
    cVar2 = read_obj_hdr(local_40,5);
    if (cVar2 != '\0') {
      _sprintf(local_40,s_objects_objs0__d_dat_00599880,uVar6);
      reset_global_palettes();
      no_file_message();
      file_name_validation(global_string_buffer,local_40);
      iVar3 = open_file(&local_44,global_string_buffer,0x80000001);
      if (iVar3 == 0) {
        close_handle(local_44);
        init_obj_file_names(param_1);
        cVar2 = load_sprite_array(&objects_objs0_0_dat_sprite);
        if (cVar2 != '\0') {
          set_global_resource(1,3,&objects_objs0_0_dat_sprite,0);
          current_obj_num = param_1;
          objs0_0_loaded = '\x01';
          set_obj_pnts_and_facs();
          reset_global_palettes();
          no_file_message();
          file_name_validation(global_string_buffer,&aniob0_filename);
          read_file_to_mem(global_string_buffer,aniob0_mem,0xfffffff,&local_48);
          cVar2 = '\0';
          pcVar5 = aniob0_mem + 8;
          do {
            if (*pcVar5 != '\0') {
              bVar1 = pcVar5[-8];
              poVar4 = objs0_mem + bVar1;
              if (poVar4 < obj_mem_end) {
                *(byte *)&poVar4->flags = *(byte *)&poVar4->flags | 0x40;
                objs0_mem[bVar1].morph_index = cVar2;
              }
            }
            pcVar5 = pcVar5 + 10;
            cVar2 = cVar2 + '\x01';
          } while (pcVar5 < aniob0_mem + 0xf8);
          local_48 = 0;
          reset_global_palettes();
          no_file_message();
          file_name_validation(global_string_buffer,&morph0_filename);
          read_file_to_mem(global_string_buffer,morph0_mem,0x23f0,&local_48);
          if (local_48 != 0) {
            process_morph0();
          }
          if (param_1 != 1) {
            set_objs0_flags();
          }
        }
      }
    }
  }
  return objs0_0_loaded;
}
