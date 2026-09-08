/* Ghidra 12.1.3 pseudocode; entry 00401040; sunlight_init_default.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void sunlight_init_default(void)

{
  int iVar1;
  sunlight_struct *psVar2;

  game_state.sunlight_var_4 = 0x1c;
  game_state.sunlight_var_5 = 0xf;
  game_state.sunlight_var_1 = 0x93;
  game_state.sunlight[0] = 0x20;
  game_state.sunlight_var_3 = 0x93;
  game_state.sunlight_var_2 = 0x93;
  sunlight_init_2();
  psVar2 = game_state.sunlight_array;
  for (iVar1 = 0x2fa; iVar1 != 0; iVar1 = iVar1 + -1) {
    psVar2->enabled = 0;
    psVar2->f1 = 0;
    psVar2->f2 = 0;
    psVar2->f3 = 0;
    psVar2 = (sunlight_struct *)&psVar2->x;
  }
  psVar2->enabled = 0;
  psVar2->f1 = 0;
  game_state._841988_2_ = 0;
  return;
}
