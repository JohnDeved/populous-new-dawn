/* Ghidra 12.1.3 pseudocode; entry 004a8c60; FUN_004a8c60.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_004a8c60(int param_1,int param_2)

{
  undefined2 uVar1;

  uVar1 = (undefined2)param_2;
  if (param_2 < 1) {
    *(undefined2 *)(param_1 + 0x7c) = uVar1;
    return;
  }
  if (0x25 < param_2) {
    *(undefined2 *)(param_1 + 0x7c) = uVar1;
    return;
  }
  if (param_2 < 0x1c) {
    *(undefined2 *)(param_1 + 0x7c) = uVar1;
    *(int *)(param_1 + 0x68) = *(int *)(param_1 + 0x7e);
    *(short *)(param_1 + 0x82) = -(short)(*(int *)(param_1 + 0x7e) / param_2);
    return;
  }
  if (1 < param_2 + -0x1c) {
    *(undefined2 *)(param_1 + 0x7c) = uVar1;
    *(short *)(param_1 + 0x82) = (short)(*(int *)(param_1 + 0x7e) / (param_2 + -0x1c));
    return;
  }
  *(undefined2 *)(param_1 + 0x7c) = uVar1;
  *(int *)(param_1 + 0x68) = *(int *)(param_1 + 0x7e);
  *(undefined2 *)(param_1 + 0x82) = 0;
  return;
}
