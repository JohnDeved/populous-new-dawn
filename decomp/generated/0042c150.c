/* Ghidra 12.1.3 pseudocode; entry 0042c150; init_tribes_1.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void init_tribes_1(void)

{
  char *pcVar1;
  char cVar2;

  cVar2 = '\0';
  pcVar1 = &game_state.tribes_array[0].tribe_num;
  do {
    *pcVar1 = cVar2;
    pcVar1 = pcVar1 + 0xc65;
    cVar2 = cVar2 + '\x01';
  } while (pcVar1 < &game_state.level_data[0xb9].cliff_index);
  return;
}
