/* Ghidra 12.1.3 pseudocode; entry 0042ac70; load_f00t0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void load_f00t0(void)

{
  void ***pppvVar1;
  void **ppvVar2;
  int iVar3;
  int iVar4;
  void ***pppvVar5;
  char cVar6;
  sprite_container *_Dest;

  if (f00t0_loaded != '\0') {
    free_sprite_array(font_sprites);
    f00t0_loaded = '\0';
  }
  iVar3 = get_font_type();
  if (iVar3 != 0) {
    iVar3 = 0;
    pppvVar5 = &font_sprites[0].mem_start;
    f00t0_loaded = 0;
    do {
      switch(font_size_array[iVar3]) {
      case 0:
      case 0xc:
        if (font_type == 0xb) {
          **pppvVar5 = font_4;
        }
        else {
          **pppvVar5 = font_2;
        }
        break;
      case 0x10:
        **pppvVar5 = font_2;
        break;
      case 0x18:
        **pppvVar5 = font_3;
      }
      ppvVar2 = *pppvVar5;
      pppvVar1 = pppvVar5 + 1;
      pppvVar5 = pppvVar5 + 0x48;
      iVar3 = iVar3 + 1;
      **pppvVar1 = *ppvVar2;
    } while (pppvVar5 < &DAT_005a4bfe);
    return;
  }
  if (font_type == 7) {
    cVar6 = '1';
  }
  else if (font_type == 8) {
    cVar6 = '2';
  }
  else {
    cVar6 = '0';
  }
  iVar3 = 0;
  _Dest = font_sprites;
  do {
    _sprintf(_Dest->path,s_data_f00t_d_0_dat_0059c8d8,iVar3);
    _Dest->flag = 1;
    _Dest->path[7] = cVar6;
    iVar4 = get_file_attrs(_Dest);
    if (iVar4 == 0) {
      _Dest->path[7] = '0';
    }
    _Dest = _Dest + 1;
    iVar3 = iVar3 + 1;
  } while (_Dest < (sprite_container *)&DAT_005a4af0);
  load_sprite_array(font_sprites);
  f00t0_loaded = 1;
  return;
}
