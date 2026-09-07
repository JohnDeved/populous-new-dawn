/* Ghidra 12.1.3 pseudocode; entry 004fa8f0; unit_processing_class_6_general.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void unit_processing_class_6_general(int param_1)

{
  undefined2 uVar1;
  int iVar2;

  iVar2 = *(byte *)(param_1 + 0x2c) - 1;
  uVar1 = (undefined2)((uint)iVar2 >> 0x10);
  switch(iVar2) {
  case 0:
    if ((*(byte *)(param_1 + 0xc) & 4) != 0) {
      uVar1 = calc_point_height(*(undefined2 *)(param_1 + 0x3d),
                                CONCAT22(uVar1,*(undefined2 *)(param_1 + 0x3f)));
      *(uint *)(param_1 + 0x10) = *(uint *)(param_1 + 0x10) & 0xfffffbff;
      *(undefined2 *)(param_1 + 0x41) = uVar1;
      *(uint *)(param_1 + 0xc) = *(uint *)(param_1 + 0xc) & 0xfffffffb;
      return;
    }
    break;
  case 1:
    FUN_004fa9e0(param_1);
    return;
  case 2:
    if ((*(byte *)(param_1 + 0xc) & 4) != 0) {
      uVar1 = calc_point_height(*(undefined2 *)(param_1 + 0x3d),
                                CONCAT22(uVar1,*(undefined2 *)(param_1 + 0x3f)));
      *(uint *)(param_1 + 0x10) = *(uint *)(param_1 + 0x10) & 0xfffffbff;
      *(undefined2 *)(param_1 + 0x41) = uVar1;
      *(uint *)(param_1 + 0xc) = *(uint *)(param_1 + 0xc) & 0xfffffffb;
      return;
    }
    break;
  case 3:
    FUN_004facf0(param_1);
    return;
  case 4:
    FUN_004fb270(param_1);
    return;
  case 5:
    FUN_004fc090(param_1);
    return;
  case 6:
    return;
  case 7:
    FUN_004fc570(param_1);
    return;
  case 9:
    FUN_004f1530(param_1,param_1 + 0xa4);
  }
  return;
}
