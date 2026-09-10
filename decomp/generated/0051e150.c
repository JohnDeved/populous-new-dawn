/* Ghidra 12.1.3 pseudocode; entry 0051e150; FUN_0051e150.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


undefined1 FUN_0051e150(int param_1,int param_2,byte param_3)

{
  uint uVar1;
  uint uVar2;
  undefined1 uVar3;
  int iVar4;
  undefined2 local_4;

  if (*(short *)(param_2 + 0x9d) != 0) {
    return 0;
  }
  iVar4 = alloc_unit(10,9,0xff,param_2 + 0x3d);
  if (iVar4 == 0) {
    return 0;
  }
  *(undefined2 *)(iVar4 + 0x6a) = *(undefined2 *)(param_1 + 0x24);
  *(undefined2 *)(iVar4 + 0x6c) = *(undefined2 *)(param_2 + 0x24);
  *(undefined1 *)(iVar4 + 0x6e) = *(undefined1 *)(param_1 + 0x2f);
  *(undefined1 *)(iVar4 + 0x6f) = *(undefined1 *)(param_2 + 0x2f);
  uVar1 = *(uint *)(param_2 + 0x10);
  uVar2 = *(uint *)(param_1 + 0x10);
  if ((*(byte *)(param_1 + 0xe) & 0x10) == 0) {
    *(undefined1 *)(param_1 + 0x7d) = *(undefined1 *)(param_1 + 0x2c);
    empty_unit_function(param_1);
    *(undefined1 *)(param_1 + 0x2c) = 0x1d;
    init_unit_class(param_1);
  }
  if ((*(byte *)(param_2 + 0xe) & 0x10) == 0) {
    *(undefined1 *)(param_2 + 0x7d) = *(undefined1 *)(param_2 + 0x2c);
    empty_unit_function(param_2);
    *(undefined1 *)(param_2 + 0x2c) = 0x1d;
    init_unit_class(param_2);
  }
  *(uint *)(param_1 + 0x10) = *(uint *)(param_1 + 0x10) | uVar2 & 0x10007;
  *(uint *)(param_2 + 0x10) = *(uint *)(param_2 + 0x10) | uVar1 & 0x10007;
  *(undefined2 *)(param_1 + 0x9d) = *(undefined2 *)(iVar4 + 0x24);
  *(undefined2 *)(param_2 + 0x9d) = *(undefined2 *)(iVar4 + 0x24);
  if (param_3 == 0) {
    *(undefined1 *)(param_1 + 0x2d) = 5;
    *(uint *)(param_1 + 0xc) = *(uint *)(param_1 + 0xc) | 0x40000000;
    *(undefined1 *)(param_2 + 0x2d) = 4;
    *(uint *)(param_2 + 0xc) = *(uint *)(param_2 + 0xc) | 0x40000000;
    FUN_004d4ee0(param_2);
  }
  else {
    if (param_3 == 1) {
      uVar3 = 3;
    }
    else {
      if (param_3 != 2) goto LAB_0051e282;
      uVar3 = 1;
    }
    *(uint *)(param_1 + 0xc) = *(uint *)(param_1 + 0xc) | 0x40000000;
    *(undefined1 *)(param_1 + 0x2d) = uVar3;
    *(uint *)(param_2 + 0xc) = *(uint *)(param_2 + 0xc) | 0x40000000;
    *(undefined1 *)(param_2 + 0x2d) = uVar3;
  }
LAB_0051e282:
  if ((param_3 != 0) && (param_3 < 3)) {
    local_4 = CONCAT11((char)((ushort)*(undefined2 *)(param_2 + 0x3f) >> 8),
                       (char)((ushort)*(undefined2 *)(param_2 + 0x3d) >> 8));
    *(ushort *)(iVar4 + 0x68) =
         (&game_state.level_data[0].unit_index_2)[((local_4 & 0xfe) * 2 | local_4 & 0xfe00) * 2] &
         0x3ff;
  }
  FUN_00518630(iVar4);
  FUN_00431ea0(iVar4,*(undefined1 *)(iVar4 + 0x6e),*(undefined1 *)(iVar4 + 0x6f),1);
  return 1;
}
