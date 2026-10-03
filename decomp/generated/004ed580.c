/* Ghidra 12.1.3 pseudocode; entry 004ed580; FUN_004ed580.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_004ed580(int param_1)

{
  switch(*(undefined1 *)(param_1 + 0x2a)) {
  case 1:
    FUN_004d23d0(param_1);
    break;
  case 2:
    FUN_00402ec0(param_1);
    break;
  case 3:
    FUN_00445940(param_1);
    break;
  case 4:
    FUN_004631b0(param_1);
    break;
  case 5:
    FUN_004a5ef0(param_1);
    break;
  case 6:
    FUN_004fa530(param_1);
    break;
  case 7:
    FUN_00509c10(param_1);
    break;
  case 8:
    FUN_004bab10(param_1);
    break;
  case 9:
    FUN_004b8070(param_1);
    break;
  case 10:
    FUN_00500a30(param_1);
    break;
  case 0xb:
    FUN_004c14c0(param_1);
  }
  *(uint *)(param_1 + 0x10) = *(uint *)(param_1 + 0x10) | 0x20000000;
  *(uint *)(param_1 + 0x14) = *(uint *)(param_1 + 0x14) | 4;
  *(undefined4 *)(param_1 + 0x18) = DAT_00897981;
  return;
}
