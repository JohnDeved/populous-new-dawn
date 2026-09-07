/* Ghidra 12.1.3 pseudocode; entry 004f2290; FUN_004f2290.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


undefined4 FUN_004f2290(int param_1,int param_2)

{
  int iVar1;
  short *psVar2;

  iVar1 = 0;
  psVar2 = (short *)(param_1 + 0x78);
  param_1 = param_1 - param_2;
  do {
    if ((((*(byte *)(psVar2 + -2) & 1) != 0) && (param_1 != -0x36)) &&
       (*(char *)((int)psVar2 + 0xd) == '\x14')) {
      if (*(char *)(param_2 + 0x26) == '\0') {
        switch(*psVar2) {
        case 2:
        case 7:
        case 0xb:
        case 0xe:
          return 1;
        }
      }
      else if ((*psVar2 == 3) || (*psVar2 == 0xf)) {
        return 1;
      }
    }
    psVar2 = psVar2 + 0x29;
    param_1 = param_1 + 0x52;
    iVar1 = iVar1 + 1;
    if (9 < iVar1) {
      return 0;
    }
  } while( true );
}
