/* Ghidra 12.1.3 pseudocode; entry 0050b630; FUN_0050b630.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_0050b630(int param_1)

{
  byte bVar1;
  undefined2 uVar2;

  uVar2 = calc_point_height(*(undefined2 *)(param_1 + 0x3d),*(undefined2 *)(param_1 + 0x3f));
  *(uint *)(param_1 + 0x10) = *(uint *)(param_1 + 0x10) & 0xfffffbff;
  *(undefined2 *)(param_1 + 0x41) = uVar2;
  if ((*(byte *)(param_1 + 0xe) & 0x10) == 0) {
    empty_unit_function(param_1);
    *(undefined1 *)(param_1 + 0x2c) = 1;
    init_unit_class(param_1);
  }
  bVar1 = load_level_flags._3_1_ & 4;
  *(undefined4 *)(param_1 + 0x68) = 3;
  *(undefined2 *)(param_1 + 0x70) = 2;
  if (bVar1 == 0) {
    *(undefined1 *)(param_1 + 0x7b) = 1;
    *(undefined1 *)(param_1 + 0x7d) = 0;
    *(undefined4 *)(param_1 + 0x6c) = 0x500;
    *(undefined2 *)(param_1 + 0x72) = 5;
    *(undefined2 *)(param_1 + 0x78) = 0x62;
    *(undefined2 *)(param_1 + 0x74) = 0x8c;
    *(undefined2 *)(param_1 + 0x76) = 2;
  }
  else {
    *(undefined1 *)(param_1 + 0x7b) = 1;
    *(undefined1 *)(param_1 + 0x7d) = 0;
    *(undefined4 *)(param_1 + 0x6c) = 0x200;
    *(undefined2 *)(param_1 + 0x78) = 0x1e;
    *(undefined2 *)(param_1 + 0x74) = 0x8c;
    *(undefined2 *)(param_1 + 0x72) = 2;
    *(undefined2 *)(param_1 + 0x76) = 2;
  }
  FUN_0048a050(param_1,0xa1,0);
  return;
}
