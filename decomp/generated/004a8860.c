/* Ghidra 12.1.3 pseudocode; entry 004a8860; FUN_004a8860.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_004a8860(int param_1)

{
  byte bVar1;
  short sVar2;
  int iVar3;

  bVar1 = *(byte *)(param_1 + 0x2b);
  *(undefined1 *)(param_1 + 0x2d) = 0;
  if (*(char *)(param_1 + 0x97) == '\x05') {
    *(undefined2 *)(param_1 + 0x7c) = 0x80;
  }
  else {
    *(uint *)(param_1 + 0x14) = *(uint *)(param_1 + 0x14) | 0x400000;
    *(undefined2 *)(param_1 + 0x7c) = 0;
  }
  iVar3 = 0;
  if (*(char *)(param_1 + 0x2c) == '\v') {
    *(short *)(param_1 + 0x86) = -unit_type_array_scenery[bVar1].field6_0xc;
    if (bVar1 == 9) {
      switch(*(char *)(param_1 + 0x97)) {
      case '\x01':
        iVar3 = -700;
        break;
      case '\x02':
        iVar3 = -600;
        break;
      case '\x03':
        iVar3 = -0x226;
        break;
      case '\x04':
        iVar3 = -0x226;
        break;
      default:
        iVar3 = -0x226;
      }
    }
    else {
      iVar3 = (int)unit_type_array_scenery[bVar1].field7_0xe;
    }
    *(short *)(param_1 + 0x93) = (short)iVar3;
  }
  else {
    *(short *)(param_1 + 0x86) = unit_type_array_scenery[bVar1].field6_0xc;
    *(undefined2 *)(param_1 + 0x93) = 0;
  }
  sVar2 = calc_point_height(*(undefined2 *)(param_1 + 0x3d),
                            CONCAT22((short)((uint)iVar3 >> 0x10),*(undefined2 *)(param_1 + 0x3f)));
  *(short *)(param_1 + 0x41) = *(short *)(param_1 + 0x93) + sVar2;
  return;
}
