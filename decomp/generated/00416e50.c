/* Ghidra 12.1.3 pseudocode; entry 00416e50; set_vconfig_from_resolution.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void set_vconfig_from_resolution(int param_1)

{
  short sVar1;

  sVar1 = *(short *)(param_1 + 0x30);
  if ((sVar1 == 800) && (*(short *)(param_1 + 0x32) == 600)) {
    *(undefined2 *)(param_1 + 0x44) = 0xfff2;
    *(undefined2 *)(param_1 + 0x48) = 0xe;
    *(undefined2 *)(param_1 + 0x4c) = 0x19;
    *(undefined2 *)(param_1 + 0x50) = 0xffe7;
    *(undefined2 *)(param_1 + 0x46) = 0xfff0;
    *(undefined2 *)(param_1 + 0x4a) = 0xfff0;
    *(undefined2 *)(param_1 + 0x4e) = 0x2c;
    *(undefined2 *)(param_1 + 0x52) = 0x2c;
    return;
  }
  if ((sVar1 == 0x400) && (*(short *)(param_1 + 0x32) == 0x300)) {
    *(undefined2 *)(param_1 + 0x44) = 0xfff0;
    *(undefined2 *)(param_1 + 0x48) = 0x10;
    *(undefined2 *)(param_1 + 0x4c) = 0x1e;
    *(undefined2 *)(param_1 + 0x50) = 0xffe2;
    *(undefined2 *)(param_1 + 0x46) = 0xffee;
    *(undefined2 *)(param_1 + 0x4a) = 0xffee;
    *(undefined2 *)(param_1 + 0x4e) = 0x31;
    *(undefined2 *)(param_1 + 0x52) = 0x31;
    return;
  }
  if ((sVar1 == 0x500) && (*(short *)(param_1 + 0x32) == 0x400)) {
    *(undefined2 *)(param_1 + 0x44) = 0xffee;
    *(undefined2 *)(param_1 + 0x48) = 0x12;
    *(undefined2 *)(param_1 + 0x4c) = 0x20;
    *(undefined2 *)(param_1 + 0x50) = 0xffe0;
    *(undefined2 *)(param_1 + 0x46) = 0xffec;
    *(undefined2 *)(param_1 + 0x4a) = 0xffec;
    *(undefined2 *)(param_1 + 0x4e) = 0x36;
    *(undefined2 *)(param_1 + 0x52) = 0x36;
    return;
  }
  *(undefined2 *)(param_1 + 0x44) = 0xfff6;
  *(undefined2 *)(param_1 + 0x48) = 10;
  *(undefined2 *)(param_1 + 0x4c) = 0x10;
  *(undefined2 *)(param_1 + 0x46) = 0xfff0;
  *(undefined2 *)(param_1 + 0x4a) = 0xfff0;
  *(undefined2 *)(param_1 + 0x4e) = 0x27;
  *(undefined2 *)(param_1 + 0x50) = 0xfff0;
  *(undefined2 *)(param_1 + 0x52) = 0x27;
  return;
}
