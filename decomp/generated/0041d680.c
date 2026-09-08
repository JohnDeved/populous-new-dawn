/* Ghidra 12.1.3 pseudocode; entry 0041d680; FUN_0041d680.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */

void FUN_0041d680(void)

{
  int iVar1;

  iVar1 = DAT_005fe424 * DAT_005fe414;
  DAT_005fe424 = DAT_005fe424 + 1;
  DAT_0059bc0c = DAT_005fe410 + ((int)(iVar1 + (iVar1 >> 0x1f & 0xffU)) >> 8);
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
  return;
}
