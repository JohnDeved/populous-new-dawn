/* Ghidra 12.1.3 pseudocode; entry 0042a140; init_file_names.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


/* WARNING: Enum "_D3DRENDERSTATETYPE": Some values do not have unique names */

void init_file_names(char param_1)

{
  char cVar1;
  int iVar2;
  uint uVar3;
  uint uVar4;
  char cVar5;
  char *pcVar6;
  sprite_container *psVar7;
  char **ppcVar8;
  char *pcVar9;
  undefined4 local_24;
  char local_20 [10];
  char local_16;

  uVar3 = 0xffffffff;
  pcVar6 = s_data_sky0_0_dat_0059c898;
  do {
    pcVar9 = pcVar6;
    if (uVar3 == 0) break;
    uVar3 = uVar3 - 1;
    pcVar9 = pcVar6 + 1;
    cVar5 = *pcVar6;
    pcVar6 = pcVar9;
  } while (cVar5 != '\0');
  uVar3 = ~uVar3;
  pcVar6 = pcVar9 + -uVar3;
  psVar7 = &sky_0_filename_template;
  for (uVar4 = uVar3 >> 2; uVar4 != 0; uVar4 = uVar4 - 1) {
    *(undefined4 *)psVar7->path = *(undefined4 *)pcVar6;
    pcVar6 = pcVar6 + 4;
    psVar7 = (sprite_container *)(psVar7->path + 4);
  }
  for (uVar3 = uVar3 & 3; uVar3 != 0; uVar3 = uVar3 - 1) {
    psVar7->path[0] = *pcVar6;
    pcVar6 = pcVar6 + 1;
    psVar7 = (sprite_container *)(psVar7->path + 1);
  }
  uVar3 = 0xffffffff;
  pcVar6 = s_data_d3d_DSky0_01_png_0059c880;
  do {
    pcVar9 = pcVar6;
    if (uVar3 == 0) break;
    uVar3 = uVar3 - 1;
    pcVar9 = pcVar6 + 1;
    cVar5 = *pcVar6;
    pcVar6 = pcVar9;
  } while (cVar5 != '\0');
  uVar3 = ~uVar3;
  pcVar6 = pcVar9 + -uVar3;
  pcVar9 = (char *)&dsky_filename_template_x1;
  for (uVar4 = uVar3 >> 2; uVar4 != 0; uVar4 = uVar4 - 1) {
    *(undefined4 *)pcVar9 = *(undefined4 *)pcVar6;
    pcVar6 = pcVar6 + 4;
    pcVar9 = pcVar9 + 4;
  }
  for (uVar3 = uVar3 & 3; uVar3 != 0; uVar3 = uVar3 - 1) {
    *pcVar9 = *pcVar6;
    pcVar6 = pcVar6 + 1;
    pcVar9 = pcVar9 + 1;
  }
  uVar3 = 0xffffffff;
  pcVar6 = s_data_d3d_Dsky0_02_png_0059c868;
  do {
    pcVar9 = pcVar6;
    if (uVar3 == 0) break;
    uVar3 = uVar3 - 1;
    pcVar9 = pcVar6 + 1;
    cVar5 = *pcVar6;
    pcVar6 = pcVar9;
  } while (cVar5 != '\0');
  uVar3 = ~uVar3;
  pcVar6 = pcVar9 + -uVar3;
  ppcVar8 = &texture_storage_dsky_2x.sprite_file_name;
  for (uVar4 = uVar3 >> 2; uVar4 != 0; uVar4 = uVar4 - 1) {
    *ppcVar8 = *(char **)pcVar6;
    pcVar6 = pcVar6 + 4;
    ppcVar8 = ppcVar8 + 1;
  }
  for (uVar3 = uVar3 & 3; uVar3 != 0; uVar3 = uVar3 - 1) {
    *(char *)ppcVar8 = *pcVar6;
    pcVar6 = pcVar6 + 1;
    ppcVar8 = (char **)((int)ppcVar8 + 1);
  }
  uVar3 = 0xffffffff;
  pcVar6 = s_data_d3d_Dsky0_0b_png_0059c850;
  do {
    pcVar9 = pcVar6;
    if (uVar3 == 0) break;
    uVar3 = uVar3 - 1;
    pcVar9 = pcVar6 + 1;
    cVar5 = *pcVar6;
    pcVar6 = pcVar9;
  } while (cVar5 != '\0');
  uVar3 = ~uVar3;
  pcVar6 = pcVar9 + -uVar3;
  pcVar9 = (char *)&dsky_filename_template_xb;
  for (uVar4 = uVar3 >> 2; uVar4 != 0; uVar4 = uVar4 - 1) {
    *(undefined4 *)pcVar9 = *(undefined4 *)pcVar6;
    pcVar6 = pcVar6 + 4;
    pcVar9 = pcVar9 + 4;
  }
  for (uVar3 = uVar3 & 3; uVar3 != 0; uVar3 = uVar3 - 1) {
    *pcVar9 = *pcVar6;
    pcVar6 = pcVar6 + 1;
    pcVar9 = pcVar9 + 1;
  }
  uVar3 = 0xffffffff;
  pcVar6 = s_data_pal0_0_dat_0059c840;
  do {
    pcVar9 = pcVar6;
    if (uVar3 == 0) break;
    uVar3 = uVar3 - 1;
    pcVar9 = pcVar6 + 1;
    cVar5 = *pcVar6;
    pcVar6 = pcVar9;
  } while (cVar5 != '\0');
  uVar3 = ~uVar3;
  pcVar6 = pcVar9 + -uVar3;
  pcVar9 = (char *)&pal0_filename_template;
  for (uVar4 = uVar3 >> 2; uVar4 != 0; uVar4 = uVar4 - 1) {
    *(undefined4 *)pcVar9 = *(undefined4 *)pcVar6;
    pcVar6 = pcVar6 + 4;
    pcVar9 = pcVar9 + 4;
  }
  for (uVar3 = uVar3 & 3; uVar3 != 0; uVar3 = uVar3 - 1) {
    *pcVar9 = *pcVar6;
    pcVar6 = pcVar6 + 1;
    pcVar9 = pcVar9 + 1;
  }
  uVar3 = 0xffffffff;
  pcVar6 = s_data_fade0_0_dat_0059c82c;
  do {
    pcVar9 = pcVar6;
    if (uVar3 == 0) break;
    uVar3 = uVar3 - 1;
    pcVar9 = pcVar6 + 1;
    cVar5 = *pcVar6;
    pcVar6 = pcVar9;
  } while (cVar5 != '\0');
  uVar3 = ~uVar3;
  pcVar6 = pcVar9 + -uVar3;
  pcVar9 = (char *)&fade0_filename_template;
  for (uVar4 = uVar3 >> 2; uVar4 != 0; uVar4 = uVar4 - 1) {
    *(undefined4 *)pcVar9 = *(undefined4 *)pcVar6;
    pcVar6 = pcVar6 + 4;
    pcVar9 = pcVar9 + 4;
  }
  for (uVar3 = uVar3 & 3; uVar3 != 0; uVar3 = uVar3 - 1) {
    *pcVar9 = *pcVar6;
    pcVar6 = pcVar6 + 1;
    pcVar9 = pcVar9 + 1;
  }
  uVar3 = 0xffffffff;
  pcVar6 = s_data_ghost0_0_dat_0059c818;
  do {
    pcVar9 = pcVar6;
    if (uVar3 == 0) break;
    uVar3 = uVar3 - 1;
    pcVar9 = pcVar6 + 1;
    cVar5 = *pcVar6;
    pcVar6 = pcVar9;
  } while (cVar5 != '\0');
  uVar3 = ~uVar3;
  pcVar6 = pcVar9 + -uVar3;
  pcVar9 = (char *)&ghost0_filename_template;
  for (uVar4 = uVar3 >> 2; uVar4 != 0; uVar4 = uVar4 - 1) {
    *(undefined4 *)pcVar9 = *(undefined4 *)pcVar6;
    pcVar6 = pcVar6 + 4;
    pcVar9 = pcVar9 + 4;
  }
  for (uVar3 = uVar3 & 3; uVar3 != 0; uVar3 = uVar3 - 1) {
    *pcVar9 = *pcVar6;
    pcVar6 = pcVar6 + 1;
    pcVar9 = pcVar9 + 1;
  }
  uVar3 = 0xffffffff;
  pcVar6 = s_data_bl320_0_dat_0059c804;
  do {
    pcVar9 = pcVar6;
    if (uVar3 == 0) break;
    uVar3 = uVar3 - 1;
    pcVar9 = pcVar6 + 1;
    cVar5 = *pcVar6;
    pcVar6 = pcVar9;
  } while (cVar5 != '\0');
  uVar3 = ~uVar3;
  pcVar6 = pcVar9 + -uVar3;
  pcVar9 = (char *)&bl320_filename_template;
  for (uVar4 = uVar3 >> 2; uVar4 != 0; uVar4 = uVar4 - 1) {
    *(undefined4 *)pcVar9 = *(undefined4 *)pcVar6;
    pcVar6 = pcVar6 + 4;
    pcVar9 = pcVar9 + 4;
  }
  for (uVar3 = uVar3 & 3; uVar3 != 0; uVar3 = uVar3 - 1) {
    *pcVar9 = *pcVar6;
    pcVar6 = pcVar6 + 1;
    pcVar9 = pcVar9 + 1;
  }
  uVar3 = 0xffffffff;
  pcVar6 = s_data_anibl0_0_dat_0059c7f0;
  do {
    pcVar9 = pcVar6;
    if (uVar3 == 0) break;
    uVar3 = uVar3 - 1;
    pcVar9 = pcVar6 + 1;
    cVar5 = *pcVar6;
    pcVar6 = pcVar9;
  } while (cVar5 != '\0');
  uVar3 = ~uVar3;
  pcVar6 = pcVar9 + -uVar3;
  pcVar9 = (char *)&anibl0_filename_template;
  for (uVar4 = uVar3 >> 2; uVar4 != 0; uVar4 = uVar4 - 1) {
    *(undefined4 *)pcVar9 = *(undefined4 *)pcVar6;
    pcVar6 = pcVar6 + 4;
    pcVar9 = pcVar9 + 4;
  }
  for (uVar3 = uVar3 & 3; uVar3 != 0; uVar3 = uVar3 - 1) {
    *pcVar9 = *pcVar6;
    pcVar6 = pcVar6 + 1;
    pcVar9 = pcVar9 + 1;
  }
  uVar3 = 0xffffffff;
  pcVar6 = s_data_baclr0_0_dat_0059c7dc;
  do {
    pcVar9 = pcVar6;
    if (uVar3 == 0) break;
    uVar3 = uVar3 - 1;
    pcVar9 = pcVar6 + 1;
    cVar5 = *pcVar6;
    pcVar6 = pcVar9;
  } while (cVar5 != '\0');
  uVar3 = ~uVar3;
  pcVar6 = pcVar9 + -uVar3;
  pcVar9 = (char *)&baclr0_filename_template;
  for (uVar4 = uVar3 >> 2; uVar4 != 0; uVar4 = uVar4 - 1) {
    *(undefined4 *)pcVar9 = *(undefined4 *)pcVar6;
    pcVar6 = pcVar6 + 4;
    pcVar9 = pcVar9 + 4;
  }
  for (uVar3 = uVar3 & 3; uVar3 != 0; uVar3 = uVar3 - 1) {
    *pcVar9 = *pcVar6;
    pcVar6 = pcVar6 + 1;
    pcVar9 = pcVar9 + 1;
  }
  uVar3 = 0xffffffff;
  pcVar6 = s_data_bsclr0_0_dat_0059c7c8;
  do {
    pcVar9 = pcVar6;
    if (uVar3 == 0) break;
    uVar3 = uVar3 - 1;
    pcVar9 = pcVar6 + 1;
    cVar5 = *pcVar6;
    pcVar6 = pcVar9;
  } while (cVar5 != '\0');
  uVar3 = ~uVar3;
  pcVar6 = pcVar9 + -uVar3;
  pcVar9 = (char *)&bsclr0_filename_template;
  for (uVar4 = uVar3 >> 2; uVar4 != 0; uVar4 = uVar4 - 1) {
    *(undefined4 *)pcVar9 = *(undefined4 *)pcVar6;
    pcVar6 = pcVar6 + 4;
    pcVar9 = pcVar9 + 4;
  }
  for (uVar3 = uVar3 & 3; uVar3 != 0; uVar3 = uVar3 - 1) {
    *pcVar9 = *pcVar6;
    pcVar6 = pcVar6 + 1;
    pcVar9 = pcVar9 + 1;
  }
  uVar3 = 0xffffffff;
  pcVar6 = s_data_bigf0_0_dat_0059c7b4;
  do {
    pcVar9 = pcVar6;
    if (uVar3 == 0) break;
    uVar3 = uVar3 - 1;
    pcVar9 = pcVar6 + 1;
    cVar5 = *pcVar6;
    pcVar6 = pcVar9;
  } while (cVar5 != '\0');
  uVar3 = ~uVar3;
  pcVar6 = pcVar9 + -uVar3;
  pcVar9 = (char *)&bigf0_filename_template;
  for (uVar4 = uVar3 >> 2; uVar4 != 0; uVar4 = uVar4 - 1) {
    *(undefined4 *)pcVar9 = *(undefined4 *)pcVar6;
    pcVar6 = pcVar6 + 4;
    pcVar9 = pcVar9 + 4;
  }
  for (uVar3 = uVar3 & 3; uVar3 != 0; uVar3 = uVar3 - 1) {
    *pcVar9 = *pcVar6;
    pcVar6 = pcVar6 + 1;
    pcVar9 = pcVar9 + 1;
  }
  uVar3 = 0xffffffff;
  pcVar6 = s_data_cliff0_0_dat_0059c7a0;
  do {
    pcVar9 = pcVar6;
    if (uVar3 == 0) break;
    uVar3 = uVar3 - 1;
    pcVar9 = pcVar6 + 1;
    cVar5 = *pcVar6;
    pcVar6 = pcVar9;
  } while (cVar5 != '\0');
  uVar3 = ~uVar3;
  pcVar6 = pcVar9 + -uVar3;
  pcVar9 = (char *)&cliff0_filename_template;
  for (uVar4 = uVar3 >> 2; uVar4 != 0; uVar4 = uVar4 - 1) {
    *(undefined4 *)pcVar9 = *(undefined4 *)pcVar6;
    pcVar6 = pcVar6 + 4;
    pcVar9 = pcVar9 + 4;
  }
  for (uVar3 = uVar3 & 3; uVar3 != 0; uVar3 = uVar3 - 1) {
    *pcVar9 = *pcVar6;
    pcVar6 = pcVar6 + 1;
    pcVar9 = pcVar9 + 1;
  }
  uVar3 = 0xffffffff;
  pcVar6 = s_data_disp0_0_dat_0059c78c;
  do {
    pcVar9 = pcVar6;
    if (uVar3 == 0) break;
    uVar3 = uVar3 - 1;
    pcVar9 = pcVar6 + 1;
    cVar5 = *pcVar6;
    pcVar6 = pcVar9;
  } while (cVar5 != '\0');
  uVar3 = ~uVar3;
  pcVar6 = pcVar9 + -uVar3;
  pcVar9 = (char *)&disp0_filename_template;
  for (uVar4 = uVar3 >> 2; uVar4 != 0; uVar4 = uVar4 - 1) {
    *(undefined4 *)pcVar9 = *(undefined4 *)pcVar6;
    pcVar6 = pcVar6 + 4;
    pcVar9 = pcVar9 + 4;
  }
  for (uVar3 = uVar3 & 3; uVar3 != 0; uVar3 = uVar3 - 1) {
    *pcVar9 = *pcVar6;
    pcVar6 = pcVar6 + 1;
    pcVar9 = pcVar9 + 1;
  }
  uVar3 = 0xffffffff;
  pcVar6 = s_data_al0_0_dat_0059c77c;
  do {
    pcVar9 = pcVar6;
    if (uVar3 == 0) break;
    uVar3 = uVar3 - 1;
    pcVar9 = pcVar6 + 1;
    cVar5 = *pcVar6;
    pcVar6 = pcVar9;
  } while (cVar5 != '\0');
  uVar3 = ~uVar3;
  pcVar6 = pcVar9 + -uVar3;
  pcVar9 = (char *)&al0_filename_template;
  for (uVar4 = uVar3 >> 2; uVar4 != 0; uVar4 = uVar4 - 1) {
    *(undefined4 *)pcVar9 = *(undefined4 *)pcVar6;
    pcVar6 = pcVar6 + 4;
    pcVar9 = pcVar9 + 4;
  }
  for (uVar3 = uVar3 & 3; uVar3 != 0; uVar3 = uVar3 - 1) {
    *pcVar9 = *pcVar6;
    pcVar6 = pcVar6 + 1;
    pcVar9 = pcVar9 + 1;
  }
  if (param_1 != '\0') {
    if (param_1 < '\n') {
      cVar5 = param_1 + '0';
    }
    else {
      cVar5 = param_1 + 'W';
    }
    uVar3 = 0xffffffff;
    pcVar6 = s_data_pal0_0_dat_0059c840;
    do {
      pcVar9 = pcVar6;
      if (uVar3 == 0) break;
      uVar3 = uVar3 - 1;
      pcVar9 = pcVar6 + 1;
      cVar1 = *pcVar6;
      pcVar6 = pcVar9;
    } while (cVar1 != '\0');
    uVar3 = ~uVar3;
    pcVar6 = pcVar9 + -uVar3;
    pcVar9 = local_20;
    for (uVar4 = uVar3 >> 2; uVar4 != 0; uVar4 = uVar4 - 1) {
      *(undefined4 *)pcVar9 = *(undefined4 *)pcVar6;
      pcVar6 = pcVar6 + 4;
      pcVar9 = pcVar9 + 4;
    }
    for (uVar3 = uVar3 & 3; uVar3 != 0; uVar3 = uVar3 - 1) {
      *pcVar9 = *pcVar6;
      pcVar6 = pcVar6 + 1;
      pcVar9 = pcVar9 + 1;
    }
    local_16 = cVar5;
    reset_global_palettes();
    no_file_message();
    file_name_validation(global_string_buffer,local_20);
    iVar2 = open_file(&local_24,global_string_buffer,0x80000001);
    if (iVar2 == 0) {
      close_handle(local_24);
      sky_0_filename_template.path[10] = cVar5;
      DAT_0089271d = cVar5;
      DAT_0089273e = cVar5;
      DAT_0089275f = cVar5;
      DAT_0089279e = cVar5;
      DAT_0089281f = cVar5;
      DAT_0089283f = cVar5;
      DAT_0089285e = cVar5;
      DAT_0089287f = cVar5;
      DAT_0089289e = cVar5;
      DAT_008928bc = cVar5;
      DAT_00991517 = cVar5;
      DAT_009915af = cVar5;
      DAT_009915ef = cVar5;
    }
    DAT_00895dcd = param_1;
  }
  return;
}
