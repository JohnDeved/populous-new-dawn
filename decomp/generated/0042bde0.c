/* Ghidra 12.1.3 pseudocode; entry 0042bde0; set_font_sprite_sizes.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void set_font_sprite_sizes(void)

{
  if ((int)screen_width * (int)screen_height < 0x4b000) {
    font_sprites_size_index_array[2] = 2;
    font_sprites_size_index_array[1] = 4;
    font_sprites_size_index_array[3] = 2;
    font_sprites_size_index_array[4] = 2;
    font_sprites_size_index_array[5] = 4;
    font_sprites_size_index_array[6] = 4;
    font_sprites_size_index_array[8] = 2;
    font_sprites_size_index_array[9] = 4;
    font_sprites_size_index_array[0] = 6;
    font_sprites_size_index_array[7] = 0;
    font_sprites_size_index_array[10] = 3;
    font_sprites_size_index_array[0xb] = 4;
    return;
  }
  font_sprites_size_index_array[2] = 0;
  font_sprites_size_index_array[1] = 3;
  font_sprites_size_index_array[3] = 0;
  font_sprites_size_index_array[5] = 3;
  font_sprites_size_index_array[6] = 3;
  font_sprites_size_index_array[8] = 0;
  font_sprites_size_index_array[9] = 3;
  font_sprites_size_index_array[10] = 3;
  font_sprites_size_index_array[0] = 4;
  font_sprites_size_index_array[4] = 2;
  font_sprites_size_index_array[7] = 1;
  font_sprites_size_index_array[0xb] = 3;
  return;
}
