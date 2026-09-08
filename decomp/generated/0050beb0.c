/* Ghidra 12.1.3 pseudocode; entry 0050beb0; FUN_0050beb0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_0050beb0(int param_1,char param_2,undefined4 param_3,undefined4 param_4)

{
  ushort uVar1;

  if ((*(byte *)(param_1 + 0x11) & 2) != 0) {
    FUN_004ef180(param_1);
    return;
  }
  if ((*(byte *)(param_1 + 0xe) & 0x10) == 0) {
    empty_unit_function(param_1);
    *(undefined1 *)(param_1 + 0x2c) = 4;
    init_unit_class(param_1);
  }
  uVar1 = *(ushort *)(param_1 + 0x35);
  unit_set_object(param_1 + 0x33,param_3,param_4);
  if ((uVar1 & 0x4000) == 0) {
    *(ushort *)(param_1 + 0x35) = *(ushort *)(param_1 + 0x35) & 0xbfff;
  }
  else {
    *(byte *)(param_1 + 0x36) = *(byte *)(param_1 + 0x36) | 0x40;
  }
  if ((uVar1 & 0x10) == 0) {
    *(ushort *)(param_1 + 0x35) = *(ushort *)(param_1 + 0x35) & 0xffef;
  }
  else {
    *(byte *)(param_1 + 0x35) = *(byte *)(param_1 + 0x35) | 0x10;
  }
  if ((uVar1 & 0x40) == 0) {
    *(ushort *)(param_1 + 0x35) = *(ushort *)(param_1 + 0x35) & 0xffbf;
  }
  else {
    *(byte *)(param_1 + 0x35) = *(byte *)(param_1 + 0x35) | 0x40;
  }
  *(undefined2 *)(param_1 + 0x37) = 0;
  *(ushort *)(param_1 + 0x35) = *(ushort *)(param_1 + 0x35) & 0x7fff;
  *(uint *)(param_1 + 0xc) = *(uint *)(param_1 + 0xc) & 0xefffffff;
  *(short *)(param_1 + 0x6c) = param_2 + -1;
  return;
}
