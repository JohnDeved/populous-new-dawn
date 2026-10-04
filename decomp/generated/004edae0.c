/* Ghidra 12.1.3 pseudocode; entry 004edae0; FUN_004edae0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


undefined4 FUN_004edae0(char param_1,char param_2)

{
  int iVar1;

  iVar1 = 0;
  if (param_1 == '\a') {
    switch(param_2) {
    case '\x03':
      iVar1 = 0x14;
      break;
    case '3':
      iVar1 = 0x20;
      break;
    case 'A':
      iVar1 = 0x14;
      break;
    case 'J':
      iVar1 = 10;
      break;
    case 'K':
      iVar1 = 0x14;
    }
  }
  else if (param_1 == '\n') {
    if (param_2 == '\x03') {
      iVar1 = 1;
    }
    else if (param_2 == '\x10') {
      iVar1 = 4;
    }
  }
  return CONCAT31((int3)((uint)(0xa0 - iVar1) >> 8),DAT_0089c655 <= 0xa0 - iVar1);
}
