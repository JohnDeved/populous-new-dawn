/* Ghidra 12.1.3 pseudocode; entry 00429c70; load_files.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void load_files(void)

{
  undefined1 uVar1;
  int iVar2;
  int iVar3;
  uint uVar4;
  int iVar5;
  byte *pbVar6;
  undefined1 local_8 [4];
  undefined1 local_4 [4];

  reset_global_palettes();
  no_file_message();
  file_name_validation(global_string_buffer,&pal0_filename_template);
  read_file_to_mem(global_string_buffer,pal0_mem,0x400,local_4);
  set_pal0_mem_2();
  reset_palette_mem(pal0_mem,1);
  update_screen_4(1);
  copy_palette_to_global(pal0_mem);
  update_palettes_4();
  set_global_resource(6,6,0,0);
  reset_global_palettes();
  no_file_message();
  file_name_validation(global_string_buffer,&fade0_filename_template);
  read_file_to_mem(global_string_buffer,fade0_mem,0x4000,local_8);
  set_global_resource(5,6,0,0x4000);
  reset_global_palettes();
  no_file_message();
  file_name_validation(global_string_buffer,&ghost0_filename_template);
  read_file_to_mem(global_string_buffer,&ghost0_mem,0x10000,local_8);
  set_global_resource(5,6,0,0x10000);
  load_al0(pal0_mem);
  set_global_resource(5,6,0,0x10000);
  reset_palette(pal0_mem,&global_palette_indexes);
  iVar5 = 0xff;
  reset_palette_mem(pal0_mem,0);
  do {
    pbVar6 = (byte *)(pal0_mem + iVar5);
    iVar3 = pbVar6[2] - 10;
    if (iVar3 < 1) {
      iVar3 = 0;
    }
    uVar4 = *pbVar6 + 0x14;
    if (0x3e < uVar4) {
      uVar4 = 0x3f;
    }
    iVar2 = pbVar6[1] - 10;
    if (iVar2 < 1) {
      iVar2 = 0;
    }
    uVar1 = find_palette_min_element(pal0_mem,iVar2,uVar4,iVar3);
    palette_related[iVar5] = uVar1;
    iVar5 = iVar5 + -1;
  } while (-1 < iVar5);
  global_palette_indexes_2[0] = find_palette_min_element(pal0_mem,0,0,0xbf);
  global_palette_indexes_2[1] = find_palette_min_element(pal0_mem,0,0,0xff);
  global_palette_indexes_2[2] = find_palette_min_element(pal0_mem,0,0,0x7f);
  global_palette_indexes_2[5] = find_palette_min_element(pal0_mem,0xbf,0,0);
  global_palette_indexes_2[6] = find_palette_min_element(pal0_mem,0xff,0,0);
  global_palette_indexes_2[7] = find_palette_min_element(pal0_mem,0x7f,0,0);
  global_palette_indexes_2[10] = find_palette_min_element(pal0_mem,0xbf,0xbf,0);
  global_palette_indexes_2[0xb] = find_palette_min_element(pal0_mem,0xff,0xff,0);
  global_palette_indexes_2[0xc] = find_palette_min_element(pal0_mem,0x7f,0x7f,0);
  global_palette_indexes_2[0xf] = find_palette_min_element(pal0_mem,0,0xbf,0);
  global_palette_indexes_2[0x10] = find_palette_min_element(pal0_mem,0,0xff,0);
  global_palette_indexes_2[0x11] = find_palette_min_element(pal0_mem,0,0x7f,0);
  reset_palette_mem(pal0_mem,1);
  return;
}
