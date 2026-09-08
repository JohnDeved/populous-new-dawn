/* Ghidra 12.1.3 pseudocode; entry 004bd230; load_watdisp_2.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void load_watdisp_2(void)

{
  undefined3 uVar1;
  undefined4 uVar2;
  res_5_item *prVar3;
  int iVar4;
  res_6_item *prVar5;
  int iVar6;
  undefined4 local_6;

  landscape_flags_1 = '\x03';
  load_topmap(0);
  if ((level_flags_2._2_1_ & 1) == 0) {
    if ((resource_flags & 4) == 0) {
      res_array_5 = (res_5_item *)malloc_1(0x80000);
      res_array_6 = (res_6_item *)malloc_1(0x28000);
      resource_flags = resource_flags | 4;
    }
    iVar4 = 0x10000;
    prVar3 = res_array_5;
    do {
      prVar3->next_index = -1;
      prVar3 = prVar3 + 1;
      iVar4 = iVar4 + -1;
    } while (iVar4 != 0);
    iVar4 = 0x4000;
    prVar5 = res_array_6;
    do {
      prVar5->res_5_index_2 = -1;
      iVar4 = iVar4 + -1;
      prVar5->res_5_index = -1;
      prVar5->counter = 0;
      prVar5 = prVar5 + 1;
    } while (iVar4 != 0);
    res_5_6_index = 0;
  }
  else if ((resource_flags & 4) != 0) {
    free_1(res_array_5);
    free_1(res_array_6);
    resource_flags = resource_flags & 0xfffffffb;
  }
  alloc_mem_1(1);
  alloc_files_mem_2(1);
  if ((resource_flags & 0x100) == 0) {
    watdisp_mem = malloc_1(0x10000);
    reset_global_palettes();
    no_file_message();
    file_name_validation(global_string_buffer,s_data_watdisp_dat_005d45dc);
    read_file_to_mem(global_string_buffer,watdisp_mem,0x10000,(int)&local_6 + 2);
    resource_flags = resource_flags | 0x100;
  }
  load_bigf0_cliff0_disp0();
  if (landscape_flags_1 == '\x03') {
    iVar4 = 0x81;
    local_6 = 0x80808080;
    do {
      iVar6 = 0x81;
      do {
        iVar6 = iVar6 + -1;
        set_landscape_c_4_2(local_6);
        uVar2 = local_6;
        local_6 = CONCAT31(local_6._1_3_,(char)local_6 + '\x02');
      } while (iVar6 != 0);
      iVar4 = iVar4 + -1;
      local_6._1_1_ = SUB41(uVar2,1);
      local_6._2_2_ = SUB42(uVar2,2);
      uVar1 = CONCAT21(local_6._2_2_,local_6._1_1_ + '\x02');
      local_6._2_1_ = SUB41(uVar2,2);
      local_6 = CONCAT31(uVar1,local_6._2_1_);
    } while (iVar4 != 0);
    iVar4 = 0x81;
    local_6 = 0x80808080;
    do {
      iVar6 = 0x81;
      do {
        iVar6 = iVar6 + -1;
        set_landscape_globe_texture(local_6);
        uVar2 = local_6;
        local_6 = CONCAT31(local_6._1_3_,(char)local_6 + '\x02');
      } while (iVar6 != 0);
      iVar4 = iVar4 + -1;
      local_6._1_1_ = SUB41(uVar2,1);
      local_6._2_2_ = SUB42(uVar2,2);
      uVar1 = CONCAT21(local_6._2_2_,local_6._1_1_ + '\x02');
      local_6._2_1_ = SUB41(uVar2,2);
      local_6 = CONCAT31(uVar1,local_6._2_1_);
    } while (iVar4 != 0);
    set_landscape_flags_2_flag_2();
  }
  sky_func_1();
  load_bl320();
  return;
}
