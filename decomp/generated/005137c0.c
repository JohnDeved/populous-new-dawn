/* Ghidra 12.1.3 pseudocode; entry 005137c0; FUN_005137c0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_005137c0(int param_1)

{
  undefined2 uVar1;

  uVar1 = FUN_0044e940(*(undefined2 *)(param_1 + 0x3d),*(undefined2 *)(param_1 + 0x3f));
  *(undefined2 *)(param_1 + 0x41) = uVar1;
  *(short *)(param_1 + 0x41) = *(short *)(param_1 + 0x41) + -0x70;
  if ((*(byte *)(param_1 + 0xe) & 0x10) == 0) {
    FUN_004ed6f0(param_1);
    *(undefined1 *)(param_1 + 0x2c) = 0x2a;
    FUN_004ed640(param_1);
  }
  FUN_004ee700(param_1 + 0x33,0x25,0x488);
  *(undefined1 *)(param_1 + 0x3c) = 4;
  *(undefined2 *)(param_1 + 0x6c) = 0x14;
  *(undefined2 *)(param_1 + 0x5f) = 0;
  return;
}
