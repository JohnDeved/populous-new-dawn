/* Ghidra 12.1.3 pseudocode; entry 0049bdf0; load_sprite_array.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


undefined1 load_sprite_array(char *param_1)

{
  char cVar1;
  undefined1 uVar2;

  uVar2 = 1;
  cVar1 = *param_1;
  while (cVar1 != '!') {
    cVar1 = load_sprite(param_1);
    if (cVar1 == '\0') {
      uVar2 = 0;
    }
    cVar1 = param_1[0x120];
    param_1 = param_1 + 0x120;
  }
  return uVar2;
}
