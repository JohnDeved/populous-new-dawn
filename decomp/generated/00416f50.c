/* Ghidra 12.1.3 pseudocode; entry 00416f50; init_vconfig_struct.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void init_vconfig_struct(undefined4 *param_1)

{
  int iVar1;
  undefined4 *puVar2;

  puVar2 = param_1;
  for (iVar1 = 0x17; iVar1 != 0; iVar1 = iVar1 + -1) {
    *puVar2 = 0;
    puVar2 = puVar2 + 1;
  }
  *(undefined2 *)puVar2 = 0;
  param_1[1] = 0x32;
  param_1[5] = 0xb;
  *param_1 = 46000;
  *(undefined2 *)((int)param_1 + 0x2a) = 0;
  param_1[4] = 0x1964;
  param_1[2] = 0x9f52;
  *(undefined1 *)(param_1 + 0x15) = 1;
  *(undefined2 *)(param_1 + 8) = 0x78c;
  *(undefined2 *)((int)param_1 + 0x2e) = 0xde;
  *(undefined2 *)(param_1 + 0x11) = 0xfff6;
  *(undefined2 *)((int)param_1 + 0x46) = 0xfff0;
  *(undefined2 *)(param_1 + 0x12) = 10;
  *(undefined2 *)((int)param_1 + 0x4a) = 0xfff0;
  *(undefined2 *)(param_1 + 0x14) = 0xfff0;
  *(undefined2 *)(param_1 + 0xc) = 0x280;
  *(undefined2 *)(param_1 + 0xb) = 0x10;
  *(undefined1 *)((int)param_1 + 0x55) = 0;
  *(undefined2 *)(param_1 + 0x13) = 0x10;
  *(undefined1 *)((int)param_1 + 0x5d) = 0;
  *(undefined1 *)((int)param_1 + 0x56) = 1;
  param_1[3] = 0x9f52;
  *(undefined2 *)((int)param_1 + 0x32) = 0x1e0;
  *(undefined2 *)(param_1 + 0xd) = 0x118;
  *(undefined2 *)((int)param_1 + 0x4e) = 0x27;
  *(undefined2 *)((int)param_1 + 0x52) = 0x27;
  return;
}
