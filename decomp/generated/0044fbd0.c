/* Ghidra 12.1.3 pseudocode; entry 0044fbd0; update_bl320_sprites.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void update_bl320_sprites(void)

{
  byte bVar1;
  anibl0_struct *paVar2;
  char cVar3;
  void *pvVar4;
  uint uVar5;

  paVar2 = anibl0_mem;
  bVar1 = anibl0_mem[0].flags;
  while ((bVar1 & 1) == 0) {
    if (paVar2->max_counter != '\0') {
      cVar3 = paVar2->counter + '\x01';
      paVar2->counter = cVar3;
      if (paVar2->max_counter <= cVar3) {
        paVar2->counter = 0;
      }
      uVar5 = (uint)*(byte *)((int)&paVar2->start + (int)(char)paVar2->counter);
      if (uVar5 == paVar2->anibl0_derivative_index) {
        pvVar4 = paVar2->bl320_sprite_ptr;
      }
      else {
        pvVar4 = bl320_sprite_pointers[uVar5];
      }
      bl320_sprite_pointers[paVar2->anibl0_derivative_index] = pvVar4;
      bl320_sprite_bank_2[paVar2->anibl0_derivative_index] = bl320_sprite_bank_1[uVar5];
    }
    bVar1 = paVar2[1].flags;
    paVar2 = paVar2 + 1;
  }
  return;
}
