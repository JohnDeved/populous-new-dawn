/* Ghidra 12.1.3 pseudocode; entry 004d9200; FUN_004d9200.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_004d9200(int param_1)

{
  int iVar1;
  undefined4 local_8;
  short local_4;

  local_8 = *(undefined4 *)(param_1 + 0x3d);
  local_4 = *(short *)(param_1 + 0x41) + 0x10;
  iVar1 = alloc_unit(7,3,0xff,&local_8);
  if (iVar1 != 0) {
    *(uint *)(iVar1 + 0xc) = *(uint *)(iVar1 + 0xc) | 0x4000;
    *(uint *)(iVar1 + 0x14) = *(uint *)(iVar1 + 0x14) | 0x100;
    *(undefined4 *)(iVar1 + 0x43) = *(undefined4 *)(param_1 + 0x43);
    *(undefined2 *)(iVar1 + 0x47) = *(undefined2 *)(param_1 + 0x47);
  }
  if (8 < *(byte *)(param_1 + 0xa4)) {
    iVar1 = alloc_unit(7,10,0xff,&local_8);
    if (iVar1 != 0) {
      *(uint *)(iVar1 + 0xc) = *(uint *)(iVar1 + 0xc) | 0x4000;
      *(uint *)(iVar1 + 0x14) = *(uint *)(iVar1 + 0x14) | 0x100;
      *(undefined4 *)(iVar1 + 0x43) = *(undefined4 *)(param_1 + 0x43);
      *(undefined2 *)(iVar1 + 0x47) = *(undefined2 *)(param_1 + 0x47);
    }
  }
  *(char *)(param_1 + 0xa4) = *(char *)(param_1 + 0xa4) + -1;
  return;
}
