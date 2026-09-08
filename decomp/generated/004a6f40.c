/* Ghidra 12.1.3 pseudocode; entry 004a6f40; FUN_004a6f40.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_004a6f40(int param_1)

{
  byte bVar1;
  short sVar2;

  if (*(short *)(param_1 + 0x41) == 0) {
    *(uint *)(param_1 + 0xc) = *(uint *)(param_1 + 0xc) | 4;
  }
  FUN_004a80b0(param_1);
  if (((*(byte *)(param_1 + 0x2e) & 0xf) == 0) &&
     (bVar1 = *(byte *)(param_1 + 0x2b), (unit_type_array_scenery[bVar1].flags_1 & 5) != 0)) {
    if (*(short *)(param_1 + 0x84) < unit_type_array_scenery[bVar1].field2_0x4) {
      FUN_004a79f0(param_1,(int)*(short *)(param_1 + 0x86),0xffffffff);
    }
    else {
      *(undefined2 *)(param_1 + 0x86) = unit_type_array_scenery[bVar1].field3_0x6;
    }
  }
  if ((*(short *)(param_1 + 0x7c) != 0) &&
     (sVar2 = *(short *)(param_1 + 0x7c) + -1, *(short *)(param_1 + 0x7c) = sVar2, sVar2 == 0)) {
    FUN_004a6e20(param_1);
  }
  return;
}
