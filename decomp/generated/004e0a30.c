/* Ghidra 12.1.3 pseudocode; entry 004e0a30; FUN_004e0a30.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_004e0a30(int param_1,int param_2)

{
  short sVar1;
  uint uVar2;
  short sVar3;
  char cVar4;

  uVar2 = *(uint *)(param_2 + 0xc);
  *(uint *)(param_2 + 0x10) = *(uint *)(param_2 + 0x10) | 0x400;
  *(uint *)(param_2 + 0xc) = uVar2 | 0x2000;
  *(uint *)(param_2 + 0xc) = uVar2 | 0x82000;
  if (param_1 == 0) {
    sVar1 = *(short *)(param_2 + 0x5d);
    cVar4 = -1;
  }
  else {
    sVar1 = *(short *)(param_1 + 0x26);
    cVar4 = *(char *)(param_1 + 0x2f);
  }
  FUN_004e94f0(param_2 + 0x49,400,(int)sVar1);
  *(undefined2 *)(param_2 + 0x4b) = 0x8a;
  if (((*(byte *)(param_2 + 0x11) & 8) == 0) && (param_1 != 0)) {
    *(char *)(param_1 + 0xb2) = *(char *)(param_1 + 0xb2) + '\x01';
  }
  sVar1 = *(short *)(param_2 + 0x6e);
  if ((level_flags_2._3_1_ & 4) == 0) {
    sVar3 = sVar1;
    if ((*(byte *)(param_2 + 0x16) & 8) != 0) {
      sVar3 = (short)((int)sVar1 >> (DAT_005aa5b0 & 0x1f));
    }
    *(short *)(param_2 + 0x6e) = sVar1 - sVar3;
    if ((*(char *)(param_2 + 0x2f) != -1) && (cVar4 != -1)) {
      *(char *)(param_2 + 0xb0) = cVar4;
    }
  }
  if (*(char *)(param_1 + 0x7c) != '\0') {
    *(uint *)(param_2 + 0x10) = *(uint *)(param_2 + 0x10) | 0x80000000;
  }
  FUN_004d3ea0(param_2);
  return;
}
