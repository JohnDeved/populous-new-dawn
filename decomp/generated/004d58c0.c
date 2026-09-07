/* Ghidra 12.1.3 pseudocode; entry 004d58c0; FUN_004d58c0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_004d58c0(int param_1,char param_2)

{
  int iVar1;
  int iVar2;

  iVar2 = (int)*(short *)(param_1 + 0x78);
  if (iVar2 != 0) {
    if (0 < iVar2) {
      do {
        iVar1 = alloc_unit(5,0xb,0xff,param_1 + 0x3d);
        if (iVar1 == 0) break;
        if (param_2 != '\0') {
          add_unit_to_cell(iVar1,param_1 + 0x3d);
        }
        iVar2 = iVar2 + -100;
        FUN_0048a050(param_1,0xb,0);
      } while (0 < iVar2);
    }
    if (iVar2 < 0) {
      iVar2 = 0;
    }
    *(short *)(param_1 + 0x78) = (short)iVar2;
  }
  return;
}
