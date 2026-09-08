/* Ghidra 12.1.3 pseudocode; entry 0041cee0; draw_globe.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */

void draw_globe(int param_1)

{
  int iVar1;
  int iVar2;
  int unaff_retaddr;
  tribe_struct *in_stack_0001000c;
  code *pcVar3;

  FUN_0055b4c0();
  set_viewport_and_globals();
  iVar1 = globe_coord_centre_y;
  iVar2 = globe_coord_centre_x;
  if (DAT_005fe434 != 0) {
    DAT_005fe434 = DAT_005fe434 + -1;
    tex_struct_get_x_y(&param_1,&stack0x00000000);
    param_1 = param_1 + iVar2;
    set_tex_struct_x_y(param_1,unaff_retaddr + iVar1,0,0,0x800);
    if ((DAT_0089d172 / '\x02' == DAT_005fe434) && (DAT_005fe420 == 0)) {
      DAT_005fe420 = 1;
      DAT_005fe424 = 0;
      _DAT_005fe430 = 0xe;
      DAT_005fe410 = DAT_005fe400;
      DAT_005fe404 = 0x100;
      DAT_005fe414 = ((0x100 - DAT_005fe400) * 0x100) / DAT_005fe428;
    }
  }
  if (DAT_005fe420 == 1) {
    iVar2 = DAT_005fe424 * DAT_005fe414;
    DAT_005fe424 = DAT_005fe424 + 1;
    DAT_0059bc0c = DAT_005fe410 + ((int)(iVar2 + (iVar2 >> 0x1f & 0xffU)) >> 8);
    DAT_005fe400 = DAT_0059bc0c;
    if (DAT_005fe428 - DAT_005fe424 == -1) {
      DAT_005fe420 = 0;
      DAT_005fe400 = DAT_005fe404;
      DAT_0059bc0c = DAT_005fe404;
      if (_DAT_005fe430 != 0) {
        set_draw_mode(0,player_tribe_num * 0xc65 + 0x89d1c8);
        DAT_0089ce36 = DAT_005fe430;
        _DAT_005fe430 = 0;
      }
    }
  }
  DAT_0059c96c = 0;
  set_tex_width_and_height(0,(int)screen_width,(int)screen_width,(int)screen_height);
  globe_tex_struct._264_4_ = 1;
  iVar2 = FUN_0044bb70();
  set_tex_width_and_height_2
            ((screen_width - iVar2 >> 1) + iVar2,(int)(screen_height >> 1),
             ((int)screen_height << 2) / 10,0x5000);
  set_tex_struct_memory(landscape_texture_storage_big);
  tribe_ptr = in_stack_0001000c;
  FUN_0042d160(DAT_0089c6f8,(int)(screen_height / 0x30));
  FUN_0042d240(screen_coord_3_x,screen_coord_3_y);
  FUN_0042d870(screen_coord_3_x,screen_coord_3_y);
  DAT_0059bc0c = DAT_0059bc0c + _DAT_0059bc10;
  if (DAT_0059bc0c < 0) {
    DAT_0059bc0c = 0;
    _DAT_0059bc10 = 0;
  }
  if (0x100 < DAT_0059bc0c) {
    _DAT_0059bc10 = 0;
    DAT_0059bc0c = 0x100;
  }
  if (DAT_005fe404 == 0x100) {
    pcVar3 = coord_to_pix_coord_1;
  }
  else {
    pcVar3 = coord_to_pix_coord_2;
  }
  tex_struct_set_code_ptr(DAT_0059bc0c,pcVar3);
  draw_globe_map_stars(1000,default_icon_offset,0x75bcd15);
  globe_landscape_mesh_generation(&stack0x00000008,4);
  set_obj_textures_globe_upper();
  return;
}
