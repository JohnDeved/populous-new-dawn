/* Ghidra 12.1.3 pseudocode; entry 004fe070; render_menu_text.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void render_menu_text(void)

{
  byte bVar1;
  wchar_t wVar2;
  wchar_t wVar3;
  int iVar4;
  uint uVar5;
  wchar_t *pwVar6;
  wchar_t *pwVar7;
  wchar_t local_200 [256];

  iVar4 = get_font_type();
  if (((iVar4 == 0) || (DAT_0059d104 != 0)) &&
     (pwVar6 = big_temp_buffer, big_temp_buffer < font_temp_mem_ptr)) {
    do {
      uVar5 = (uint)(ushort)*pwVar6;
      wVar2 = pwVar6[1];
      bVar1 = (byte)pwVar6[2];
      wVar3 = pwVar6[3];
      pwVar7 = (wchar_t *)((int)pwVar6 + 7);
      iVar4 = wstr_len(pwVar7);
      pwVar6 = pwVar7 + iVar4 + 1U;
      _wcsncpy(local_200,pwVar7,iVar4 + 1U);
      iVar4 = get_font_type();
      if (iVar4 == 0) {
        if (font_struct_ARRAY_005d5b08[bVar1].field6_0x18 == 1) {
          font_struct_ptr = font_struct_ARRAY_005d5b08 + bVar1;
          pwVar7 = local_200;
          wVar3 = local_200[0];
          while (wVar3 != L'\0') {
            iVar4 = render_char_outer(uVar5,wVar2,*pwVar7);
            uVar5 = uVar5 + iVar4;
            wVar3 = pwVar7[1];
            pwVar7 = pwVar7 + 1;
          }
        }
        else if (((char)wVar3 == '\x01') &&
                (font_struct_ARRAY_005d5b08[font_struct_ARRAY_005d5b08[bVar1].field7_0x1c].
                 field6_0x18 == 1)) {
          font_struct_ptr =
               font_struct_ARRAY_005d5b08 + font_struct_ARRAY_005d5b08[bVar1].field7_0x1c;
          pwVar7 = local_200;
          wVar3 = local_200[0];
          while (wVar3 != L'\0') {
            iVar4 = render_char_outer(uVar5,wVar2,*pwVar7);
            uVar5 = uVar5 + iVar4;
            wVar3 = pwVar7[1];
            pwVar7 = pwVar7 + 1;
          }
        }
      }
      else if ((font_struct_ARRAY_005d5b08[bVar1].field6_0x18 == 1) ||
              (((char)wVar3 == '\x01' &&
               (font_struct_ARRAY_005d5b08[font_struct_ARRAY_005d5b08[bVar1].field7_0x1c].
                field6_0x18 == 1)))) {
        if (((DAT_005fc9f4._1_1_ & 1) == 0) || (iVar4 = get_font_type(), iVar4 != 0)) {
          iVar4 = get_font_type();
          if (iVar4 == 0) {
            set_font_render_default
                      (&DAT_00591698,(font_struct_ARRAY_005d5b08[bVar1].sprite)->mem_start);
          }
          else {
            set_font_sprite_size();
          }
        }
        else {
          FUN_004297c0(sprite_list_tuple_ARRAY_00985980 + bVar1);
        }
        pwVar7 = local_200;
        wVar3 = local_200[0];
        while (wVar3 != L'\0') {
          iVar4 = render_char_outer(uVar5,wVar2,*pwVar7);
          uVar5 = uVar5 + iVar4;
          wVar3 = pwVar7[1];
          pwVar7 = pwVar7 + 1;
        }
      }
    } while (pwVar6 < font_temp_mem_ptr);
  }
  return;
}
