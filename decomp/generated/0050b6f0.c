/* Ghidra 12.1.3 pseudocode; entry 0050b6f0; FUN_0050b6f0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_0050b6f0(int param_1,undefined4 param_2,undefined2 param_3,short param_4,undefined2 param_5
                 ,undefined2 param_6,undefined1 param_7,undefined1 param_8)

{
  *(undefined4 *)(param_1 + 0x68) = param_2;
  *(undefined2 *)(param_1 + 0x70) = param_3;
  *(short *)(param_1 + 0x72) = param_4;
  *(undefined2 *)(param_1 + 0x78) = param_5;
  *(undefined2 *)(param_1 + 0x76) = 2;
  *(undefined2 *)(param_1 + 0x74) = param_6;
  *(undefined1 *)(param_1 + 0x7b) = param_7;
  *(undefined1 *)(param_1 + 0x7d) = param_8;
  *(int *)(param_1 + 0x6c) = (int)param_4 << 8;
  return;
}
