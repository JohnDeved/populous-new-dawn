/* Ghidra 12.1.3 pseudocode; entry 0042a500; load_level_conditional.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void load_level_conditional(int param_1)

{
  if (level_number_1 != param_1) {
    level_number_1 = (char)param_1;
    game_state.field112137_0xd1958 = level_number_1;
    init_file_names(param_1);
    if ((landscape_flags_1 == '\x02') || (landscape_flags_1 == '\x03')) {
      load_files();
      if (level_number_1 == '6') {
        load_watdisp_1();
      }
      else {
        load_watdisp_2();
      }
      if (DAT_0089c6f3 != '\0') {
        level_flags_1 = level_flags_1 | 1;
      }
      d3d_palette_chanage();
      return;
    }
  }
  return;
}
