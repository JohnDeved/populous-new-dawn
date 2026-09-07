/* Ghidra 12.1.3 pseudocode; entry 00417000; init_vconfig.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void init_vconfig(void)

{
  bool bVar1;
  char cVar2;
  undefined2 *puVar3;
  int iVar4;
  int iVar5;
  undefined1 local_330 [272];
  char local_220 [272];
  char local_110 [272];

  bVar1 = false;
  get_global_file_path(local_330,s_SAVE_005999ec,0);
  _sprintf(local_110,s__s__s__s_0059bbf0,local_330,s_VCONFIG0_0059bbfc,s_DAT_00599850);
  _sprintf(local_220,s__s__s__s_0059bbf0,local_330,s_VCONFIG0_0059bbfc,s_VER_00599834);
  cVar2 = read_obj_hdr(local_220,2);
  if (cVar2 == '\0') {
    memcpy_1(local_330,&data_dir_path,0);
    _sprintf(local_110,s__s__s__s_0059bbf0,local_330,s_VCONFIG0_0059bbfc,s_DAT_00599850);
    _sprintf(local_220,s__s__s__s_0059bbf0,local_330,s_VCONFIG0_0059bbfc,s_VER_00599834);
    cVar2 = read_obj_hdr(local_220,2);
    if (cVar2 == '\0') goto LAB_004170ef;
  }
  bVar1 = true;
LAB_004170ef:
  if (bVar1) {
    FUN_0049a7f0(local_110,local_220,2,vconfig_dat_mem);
  }
  puVar3 = (undefined2 *)&vconfig_dat_mem[0].field_0x34;
  iVar4 = 10;
  do {
    iVar5 = 5;
    do {
      *puVar3 = 0x118;
      puVar3 = puVar3 + 0x2f;
      iVar5 = iVar5 + -1;
    } while (iVar5 != 0);
    iVar4 = iVar4 + -1;
  } while (iVar4 != 0);
  return;
}
