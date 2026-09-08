/* Ghidra 12.1.3 pseudocode; entry 0044fc40; set_anibl0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void set_anibl0(void)

{
  char cVar1;
  byte bVar2;
  uint uVar3;
  anibl0_struct *paVar4;

  uVar3 = 0x5aa0ec;
  do {
    *(byte *)(uVar3 + 0x13) = *(byte *)(uVar3 + 0x13) & 0xfe;
    uVar3 = uVar3 - 0x14;
  } while (0x5a9f1f < uVar3);
  cVar1 = anibl0_mem[0x17].max_counter;
  for (paVar4 = (anibl0_struct *)0x5aa0ec; (cVar1 == '\0' && (anibl0_mem <= paVar4));
      paVar4 = paVar4 + -1) {
    paVar4->flags = paVar4->flags | 1;
    cVar1 = paVar4[-1].max_counter;
  }
  paVar4 = anibl0_mem;
  bVar2 = anibl0_mem[0].flags;
  while ((bVar2 & 1) == 0) {
    paVar4->bl320_sprite_ptr = bl320_sprite_pointers[paVar4->anibl0_derivative_index];
    paVar4->counter = 0;
    bVar2 = paVar4[1].flags;
    paVar4 = paVar4 + 1;
  }
  return;
}
