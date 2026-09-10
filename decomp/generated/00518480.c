/* Ghidra 12.1.3 pseudocode; entry 00518480; FUN_00518480.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_00518480(int param_1)

{
  uint uVar1;
  undefined2 uVar2;

  uVar2 = calc_point_height(*(undefined2 *)(param_1 + 0x3d),*(undefined2 *)(param_1 + 0x3f));
  *(uint *)(param_1 + 0x10) = *(uint *)(param_1 + 0x10) & 0xfffffbff;
  *(undefined2 *)(param_1 + 0x41) = uVar2;
  uVar1 = *(uint *)(param_1 + 0xc);
  *(uint *)(param_1 + 0xc) = uVar1 | 0x200;
  *(uint *)(param_1 + 0xc) = uVar1 | 0x200200;
  if ((*(char *)(param_1 + 0x2a) == '\x01') && (*(char *)(param_1 + 0x2b) == '\x05')) {
    FUN_004de7f0(param_1);
  }
  *(undefined1 *)(param_1 + 0x2d) = 0;
  *(uint *)(param_1 + 0xc) = *(uint *)(param_1 + 0xc) | 0x40000000;
  return;
}
