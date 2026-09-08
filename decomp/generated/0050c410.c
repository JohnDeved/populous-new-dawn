/* Ghidra 12.1.3 pseudocode; entry 0050c410; FUN_0050c410.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_0050c410(int param_1)

{
  uint uVar1;
  short sVar2;

  sVar2 = calc_point_height(*(undefined2 *)(param_1 + 0x3d),*(undefined2 *)(param_1 + 0x3f));
  if (*(short *)(param_1 + 0x41) < sVar2) {
    *(short *)(param_1 + 0x41) = sVar2;
  }
  if ((*(byte *)(param_1 + 0xe) & 0x10) == 0) {
    empty_unit_function(param_1);
    *(undefined1 *)(param_1 + 0x2c) = 9;
    init_unit_class(param_1);
  }
  *(uint *)(param_1 + 0xc) = *(uint *)(param_1 + 0xc) & 0xefffffff;
  unit_set_object(param_1 + 0x33,0x1d,0x460);
  uVar1 = *(uint *)(param_1 + 0xc);
  *(ushort *)(param_1 + 0x35) = *(ushort *)(param_1 + 0x35) & 0xbfff;
  *(undefined2 *)(param_1 + 0x6c) = 4;
  *(uint *)(param_1 + 0xc) = uVar1 | 0x40000;
  *(uint *)(param_1 + 0xc) = uVar1 | 0x40080;
  return;
}
