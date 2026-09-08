/* Ghidra 12.1.3 pseudocode; entry 0042af10; load_bl320.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


undefined1 load_bl320(void)

{
  char cVar1;
  short sVar2;
  uint uVar3;
  uint uVar4;
  int iVar5;
  void **ppvVar6;
  void *pvVar7;
  void *pvVar8;
  char *pcVar9;
  char *pcVar10;
  sprite_container *psVar11;
  int iVar12;
  anibl0_struct *paVar13;
  undefined1 local_9;
  int local_8;
  short local_4;

  local_9 = 0;
  if (bl320_sprite_mem != (void *)0x0) {
    free_sprite_2(&bl320_filename_template_2);
    bl320_sprite_mem = (void *)0x0;
    DAT_0059df34 = 0;
    set_global_resource(6,5,0,0);
  }
  if (bl320_sprite_default_width == '\x10') {
    pcVar9 = &bl320_filename_template_16;
  }
  else {
    if (bl320_sprite_default_width != ' ') goto LAB_0042af8d;
    pcVar9 = (char *)&bl320_filename_template;
  }
  uVar3 = 0xffffffff;
  do {
    pcVar10 = pcVar9;
    if (uVar3 == 0) break;
    uVar3 = uVar3 - 1;
    pcVar10 = pcVar9 + 1;
    cVar1 = *pcVar9;
    pcVar9 = pcVar10;
  } while (cVar1 != '\0');
  uVar3 = ~uVar3;
  pcVar9 = pcVar10 + -uVar3;
  psVar11 = &bl320_filename_template_2;
  for (uVar4 = uVar3 >> 2; uVar4 != 0; uVar4 = uVar4 - 1) {
    *(undefined4 *)psVar11->path = *(undefined4 *)pcVar9;
    pcVar9 = pcVar9 + 4;
    psVar11 = (sprite_container *)(psVar11->path + 4);
  }
  for (uVar3 = uVar3 & 3; uVar3 != 0; uVar3 = uVar3 - 1) {
    psVar11->path[0] = *pcVar9;
    pcVar9 = pcVar9 + 1;
    psVar11 = (sprite_container *)(psVar11->path + 1);
  }
LAB_0042af8d:
  cVar1 = load_sprite(&bl320_filename_template_2);
  if (cVar1 != '\0') {
    local_9 = 1;
    iVar12 = 0;
    set_global_resource(2,5,&bl320_filename_template_2,0);
    local_8 = (int)bl320_sprite_width * (int)bl320_sprite_height;
    local_4 = (short)bl320_sprite_width_1;
    sVar2 = bl320_sprite_height / local_4;
    pvVar8 = bl320_sprite_mem;
    do {
      if (0 < sVar2) {
        ppvVar6 = bl320_sprite_pointers + iVar12;
        iVar5 = (int)sVar2;
        iVar12 = iVar12 + iVar5;
        pvVar7 = pvVar8;
        do {
          *ppvVar6 = pvVar7;
          ppvVar6 = ppvVar6 + 1;
          pvVar7 = (void *)((int)pvVar7 + (int)local_4);
          iVar5 = iVar5 + -1;
        } while (iVar5 != 0);
      }
      pvVar8 = (void *)((int)pvVar8 + local_8);
    } while (iVar12 < 0x100);
    reset_global_palettes();
    no_file_message();
    file_name_validation(global_string_buffer,&anibl0_filename_template);
    read_file_to_mem(global_string_buffer,anibl0_mem,500,&local_8);
    if (local_8 == 500) {
      set_anibl0();
    }
    else {
      paVar13 = anibl0_mem;
      for (iVar12 = 0x7d; iVar12 != 0; iVar12 = iVar12 + -1) {
        paVar13->bl320_sprite_ptr = (void *)0x0;
        paVar13 = (anibl0_struct *)&paVar13->start;
      }
    }
    uv_mapping_24B_ARRAY_005a2f30[0].v1 = bl320_sprite_width_1 * 0x10000 + -1;
    uv_mapping_24B_ARRAY_005a2f30[0].u1 = 0;
    uv_mapping_24B_ARRAY_005a2f30[0].u2 = 0;
    uv_mapping_24B_ARRAY_005a2f30[0].v2 = 0;
    uv_mapping_24B_ARRAY_005a2f30[0].v3 = 0;
    uv_mapping_24B_ARRAY_005a2f30[1].u1 = 0;
    uv_mapping_24B_ARRAY_005a2f30[1].v1 = 0;
    uv_mapping_24B_ARRAY_005a2f30[1].v2 = 0;
    uv_mapping_24B_ARRAY_005a2f30[2].v1 = 0;
    uv_mapping_24B_ARRAY_005a2f30[2].u3 = 0;
    uv_mapping_24B_ARRAY_005a2f30[3].u2 = 0;
    uv_mapping_24B_ARRAY_005a2f30[3].u3 = 0;
    uv_mapping_24B_ARRAY_005a2f30[3].v3 = 0;
    uv_mapping_24B_ARRAY_005a2f30[4].u1 = 0;
    uv_mapping_24B_ARRAY_005a2f30[4].u2 = 0;
    uv_mapping_24B_ARRAY_005a2f30[4].v2 = 0;
    uv_mapping_24B_ARRAY_005a2f30[4].v3 = 0;
    uv_mapping_24B_ARRAY_005a2f30[5].u1 = 0;
    uv_mapping_24B_ARRAY_005a2f30[5].v1 = 0;
    uv_mapping_24B_ARRAY_005a2f30[5].v2 = 0;
    uv_mapping_24B_ARRAY_005a2f30[6].v1 = 0;
    uv_mapping_24B_ARRAY_005a2f30[6].u3 = 0;
    uv_mapping_24B_ARRAY_005a2f30[7].u2 = 0;
    uv_mapping_24B_ARRAY_005a2f30[7].u3 = 0;
    uv_mapping_24B_ARRAY_005a2f30[7].v3 = 0;
    uv_mapping_24B_ARRAY_005a2f30[0].u3 = uv_mapping_24B_ARRAY_005a2f30[0].v1;
    uv_mapping_24B_ARRAY_005a2f30[1].u2 = uv_mapping_24B_ARRAY_005a2f30[0].v1;
    uv_mapping_24B_ARRAY_005a2f30[1].u3 = uv_mapping_24B_ARRAY_005a2f30[0].v1;
    uv_mapping_24B_ARRAY_005a2f30[1].v3 = uv_mapping_24B_ARRAY_005a2f30[0].v1;
    uv_mapping_24B_ARRAY_005a2f30[2].u1 = uv_mapping_24B_ARRAY_005a2f30[0].v1;
    uv_mapping_24B_ARRAY_005a2f30[2].u2 = uv_mapping_24B_ARRAY_005a2f30[0].v1;
    uv_mapping_24B_ARRAY_005a2f30[2].v2 = uv_mapping_24B_ARRAY_005a2f30[0].v1;
    uv_mapping_24B_ARRAY_005a2f30[2].v3 = uv_mapping_24B_ARRAY_005a2f30[0].v1;
    uv_mapping_24B_ARRAY_005a2f30[3].u1 = uv_mapping_24B_ARRAY_005a2f30[0].v1;
    uv_mapping_24B_ARRAY_005a2f30[3].v1 = uv_mapping_24B_ARRAY_005a2f30[0].v1;
    uv_mapping_24B_ARRAY_005a2f30[3].v2 = uv_mapping_24B_ARRAY_005a2f30[0].v1;
    uv_mapping_24B_ARRAY_005a2f30[4].v1 = uv_mapping_24B_ARRAY_005a2f30[0].v1;
    uv_mapping_24B_ARRAY_005a2f30[4].u3 = uv_mapping_24B_ARRAY_005a2f30[0].v1;
    uv_mapping_24B_ARRAY_005a2f30[5].u2 = uv_mapping_24B_ARRAY_005a2f30[0].v1;
    uv_mapping_24B_ARRAY_005a2f30[5].u3 = uv_mapping_24B_ARRAY_005a2f30[0].v1;
    uv_mapping_24B_ARRAY_005a2f30[5].v3 = uv_mapping_24B_ARRAY_005a2f30[0].v1;
    uv_mapping_24B_ARRAY_005a2f30[6].u1 = uv_mapping_24B_ARRAY_005a2f30[0].v1;
    uv_mapping_24B_ARRAY_005a2f30[6].u2 = uv_mapping_24B_ARRAY_005a2f30[0].v1;
    uv_mapping_24B_ARRAY_005a2f30[6].v2 = uv_mapping_24B_ARRAY_005a2f30[0].v1;
    uv_mapping_24B_ARRAY_005a2f30[6].v3 = uv_mapping_24B_ARRAY_005a2f30[0].v1;
    uv_mapping_24B_ARRAY_005a2f30[7].u1 = uv_mapping_24B_ARRAY_005a2f30[0].v1;
    uv_mapping_24B_ARRAY_005a2f30[7].v1 = uv_mapping_24B_ARRAY_005a2f30[0].v1;
    uv_mapping_24B_ARRAY_005a2f30[7].v2 = uv_mapping_24B_ARRAY_005a2f30[0].v1;
  }
  return local_9;
}
