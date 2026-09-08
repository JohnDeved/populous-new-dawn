/* Ghidra 12.1.3 pseudocode; entry 0041ce30; FUN_0041ce30.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */

void FUN_0041ce30(void)

{
  if (draw_mode == 2) {
    if ((global_data_3 != 0) &&
       (((DAT_00984681 != '\0' && (DAT_00984781 == '\0')) ||
        ((_DAT_00899d7b & 1 << (DAT_0089cf07 & 0x1f)) != 0)))) {
      FUN_0042d1f0(screen_coord_3_x,screen_coord_3_y);
    }
    if (DAT_0098456c != 0) {
      FUN_0042d380();
    }
    if (((((byte)land_flags_1 & 2) == 0) && (DAT_0089bbfb == 0)) &&
       ((DAT_00984574 != 0 && ((render_state_flags & 4) != 0)))) {
      set_globe_coord_centre(globe_coord_centre_inc_x,globe_coord_centre_inc_y);
    }
    return;
  }
  return;
}
