/* Ghidra 12.1.3 pseudocode; entry 00462ca0; FUN_00462ca0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_00462ca0(int param_1,int param_2)

{
  param_1 = param_2 * 0x52 + param_1;
  switch(*(undefined1 *)(param_1 + 0x85)) {
  case 1:
    *(undefined2 *)(param_1 + 0x3c) = 0;
    return;
  case 3:
    *(undefined2 *)(param_1 + 0x3c) = 0;
    return;
  case 9:
    *(undefined2 *)(param_1 + 0x40) = 0;
    return;
  case 0xd:
    *(undefined4 *)(param_1 + 0x36) = 0;
    return;
  case 0x11:
    *(undefined2 *)(param_1 + 0x4e) = 0;
    *(undefined2 *)(param_1 + 0x4c) = 0;
    return;
  case 0x12:
    *(undefined4 *)(param_1 + 0x68) = 0;
    *(undefined2 *)(param_1 + 0x4e) = 0;
    return;
  case 0x13:
    *(undefined2 *)(param_1 + 0x4c) = 0;
  }
  return;
}
