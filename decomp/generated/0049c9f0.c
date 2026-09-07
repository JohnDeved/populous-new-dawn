/* Ghidra 12.1.3 pseudocode; entry 0049c9f0; maybe_update_framerate.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */

void maybe_update_framerate(void)

{
  _DAT_005ca840 = GetTickCount();
  if (DAT_005ca844 + 1000 <= _DAT_005ca840) {
    DAT_005ca84c = game_state.offset_counter - _DAT_005ca838;
    if (DAT_005ca84c < 0) {
      DAT_005ca84c = 0;
    }
    maybe_framerate = sprite_animation_counter - _DAT_005ca83c;
    _DAT_005ca838 = game_state.offset_counter;
    if (maybe_framerate < 0) {
      maybe_framerate = 0;
    }
    _DAT_005ca83c = sprite_animation_counter;
    DAT_005ca844 = _DAT_005ca840;
    if ((interface_state != '\x02') || (game_state._858460_1_ == '\0')) {
      DAT_005ca848 = maybe_framerate;
    }
  }
  if (DAT_005ca858 == 0) {
    sky_tick_counter = (_DAT_005ca840 - _DAT_005ca854) * 0x40;
    if (0x1000000 < sky_tick_counter) {
      sky_tick_counter = 0x1000000;
    }
    _DAT_005ca860 = _DAT_005ca860 + sky_tick_counter;
  }
  _DAT_005ca854 = _DAT_005ca840;
  DAT_005ca858 = 0;
  return;
}
