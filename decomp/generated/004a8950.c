/* Ghidra 12.1.3 pseudocode; entry 004a8950; FUN_004a8950.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_004a8950(int param_1)

{
  char cVar1;
  undefined1 uVar2;
  bool bVar3;
  short sVar4;
  short sVar5;

  bVar3 = false;
  cVar1 = *(char *)(param_1 + 0x2c);
  if (*(char *)(param_1 + 0x2d) == '\0') {
    FUN_004a8860(param_1);
    *(char *)(param_1 + 0x2d) = *(char *)(param_1 + 0x2d) + '\x01';
    *(uint *)(param_1 + 0xc) = *(uint *)(param_1 + 0xc) | 0x100000;
  }
  if (*(short *)(param_1 + 0x7c) != 0) {
    sVar4 = *(short *)(param_1 + 0x7c) + -1;
    *(short *)(param_1 + 0x7c) = sVar4;
    if (sVar4 < 1) {
      *(uint *)(param_1 + 0x14) = *(uint *)(param_1 + 0x14) | 0x400000;
      *(undefined2 *)(param_1 + 0x7c) = 0;
    }
    return;
  }
  if (((*(byte *)(param_1 + 0x2e) & 0x1f) == 0) &&
     (FUN_0048a050(param_1,0x9f,0), (*(byte *)(param_1 + 0x2e) & 0x1f) == 0)) {
    FUN_004a9030(param_1,1);
  }
  sVar4 = *(short *)(param_1 + 0x86) + *(short *)(param_1 + 0x93);
  *(short *)(param_1 + 0x93) = sVar4;
  if (cVar1 == '\v') {
    if (-1 < sVar4) {
      *(uint *)(param_1 + 0x14) = *(uint *)(param_1 + 0x14) & 0xffbfffff;
      *(undefined2 *)(param_1 + 0x93) = 0;
      *(uint *)(param_1 + 0xc) = *(uint *)(param_1 + 0xc) & 0xffefffff;
      FUN_004a9030(param_1,0);
      uVar2 = unit_type_array_scenery[*(byte *)(param_1 + 0x2b)].field9_0x11;
      if ((*(byte *)(param_1 + 0xe) & 0x10) == 0) {
        empty_unit_function(param_1);
        *(undefined1 *)(param_1 + 0x2c) = uVar2;
        init_unit_class(param_1);
      }
    }
  }
  else {
    if (*(byte *)(param_1 + 0x2b) == 9) {
      switch(*(undefined1 *)(param_1 + 0x97)) {
      case 1:
        sVar5 = -700;
        break;
      case 2:
        sVar5 = -600;
        break;
      case 3:
        sVar5 = -0x226;
        break;
      case 4:
        sVar5 = -0x226;
        break;
      default:
        sVar5 = -0x226;
      }
    }
    else {
      sVar5 = unit_type_array_scenery[*(byte *)(param_1 + 0x2b)].field7_0xe;
    }
    if (sVar4 <= sVar5) {
      *(uint *)(param_1 + 0x14) = *(uint *)(param_1 + 0x14) & 0xffbfffff;
      *(uint *)(param_1 + 0xc) = *(uint *)(param_1 + 0xc) & 0xffefffff;
      bVar3 = true;
    }
  }
  if (bVar3) {
    FUN_004a6e20(param_1);
    return;
  }
  sVar4 = calc_point_height(*(undefined2 *)(param_1 + 0x3d),*(undefined2 *)(param_1 + 0x3f));
  *(short *)(param_1 + 0x41) = *(short *)(param_1 + 0x93) + sVar4;
  return;
}
