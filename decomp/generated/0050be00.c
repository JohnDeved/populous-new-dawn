/* Ghidra 12.1.3 pseudocode; entry 0050be00; process_small_sparkle.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void process_small_sparkle(int param_1)

{
  short sVar1;
  undefined2 uVar2;
  int iVar3;

  if ((*(byte *)(param_1 + 0x36) & 2) != 0) {
    if (*(short *)(param_1 + 0x6c) < 0x10) {
      iVar3 = *(short *)(param_1 + 0x6c) * 0x100;
      uVar2 = (undefined2)((int)(iVar3 + (iVar3 >> 0x1f & 0xfU)) >> 4);
      *(undefined2 *)(param_1 + 0x68) = uVar2;
    }
    else {
      if (0xff < *(short *)(param_1 + 0x68)) goto LAB_0050be5a;
      sVar1 = *(short *)(param_1 + 0x68) + 0x10;
      *(short *)(param_1 + 0x68) = sVar1;
      if (sVar1 < 0) {
        *(undefined2 *)(param_1 + 0x68) = 0;
      }
      if (0x100 < *(short *)(param_1 + 0x68)) {
        *(undefined2 *)(param_1 + 0x68) = 0x100;
      }
      uVar2 = *(undefined2 *)(param_1 + 0x68);
    }
    *(undefined2 *)(param_1 + 0x6a) = uVar2;
  }
LAB_0050be5a:
  *(uint *)(param_1 + 0x10) = *(uint *)(param_1 + 0x10) & 0xffbfffff;
  if ((*(byte *)(param_1 + 0xc) & 4) != 0) {
    uVar2 = calc_point_height(*(undefined2 *)(param_1 + 0x3d),*(undefined2 *)(param_1 + 0x3f));
    *(uint *)(param_1 + 0x10) = *(uint *)(param_1 + 0x10) & 0xfffffbff;
    *(undefined2 *)(param_1 + 0x41) = uVar2;
    *(uint *)(param_1 + 0xc) = *(uint *)(param_1 + 0xc) & 0xfffffffb;
  }
  if ((-1 < *(short *)(param_1 + 0x6c)) &&
     (sVar1 = *(short *)(param_1 + 0x6c) + -1, *(short *)(param_1 + 0x6c) = sVar1, sVar1 < 1)) {
    FUN_004ef180(param_1);
  }
  return;
}
