/* Ghidra 12.1.3 pseudocode; entry 004fa7f0; init_unit_class_6.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void init_unit_class_6(int param_1)

{
  undefined2 uVar1;
  int iVar2;

  iVar2 = *(byte *)(param_1 + 0x2c) - 1;
  uVar1 = (undefined2)((uint)iVar2 >> 0x10);
  switch(iVar2) {
  case 0:
    uVar1 = calc_point_height(*(undefined2 *)(param_1 + 0x3d),
                              CONCAT22(uVar1,*(undefined2 *)(param_1 + 0x3f)));
    *(undefined2 *)(param_1 + 0x41) = uVar1;
    *(uint *)(param_1 + 0x10) = *(uint *)(param_1 + 0x10) & 0xfffffbff;
    return;
  case 1:
    uVar1 = calc_point_height(*(undefined2 *)(param_1 + 0x3d),
                              CONCAT22(uVar1,*(undefined2 *)(param_1 + 0x3f)));
    *(uint *)(param_1 + 0x10) = *(uint *)(param_1 + 0x10) & 0xfffffbff;
    *(undefined2 *)(param_1 + 0x41) = uVar1;
    *(ushort *)(param_1 + 0x7a) = *(ushort *)(param_1 + 0x3d);
    *(ushort *)(param_1 + 0x7c) = *(ushort *)(param_1 + 0x3f);
    *(ushort *)(param_1 + 0x7a) = *(ushort *)(param_1 + 0x3d) & 0xfe00;
    *(ushort *)(param_1 + 0x7c) = *(ushort *)(param_1 + 0x3f) & 0xfe00;
    *(char *)(param_1 + 0x7e) =
         (char)((int)((int)*(short *)(param_1 + 0x26) +
                     ((int)*(short *)(param_1 + 0x26) >> 0x1f & 0x1ffU)) >> 9);
    FUN_004fa9e0(param_1);
    return;
  case 2:
    uVar1 = calc_point_height(*(undefined2 *)(param_1 + 0x3d),
                              CONCAT22(uVar1,*(undefined2 *)(param_1 + 0x3f)));
    *(undefined2 *)(param_1 + 0x41) = uVar1;
    *(uint *)(param_1 + 0x10) = *(uint *)(param_1 + 0x10) & 0xfffffbff;
    return;
  case 5:
    *(uint *)(param_1 + 0x14) = *(uint *)(param_1 + 0x14) | 0x4000000;
    return;
  case 9:
    FUN_004f1500(param_1,param_1 + 0xa4);
  }
  return;
}
