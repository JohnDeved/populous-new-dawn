/* Ghidra 12.1.3 pseudocode; entry 004d80e0; FUN_004d80e0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void __thiscall FUN_004d80e0(undefined4 param_1,int param_2,char param_3)

{
  uint uVar1;
  undefined2 uVar2;
  int iVar3;
  undefined2 extraout_var;
  undefined2 local_8;
  undefined2 uStack_6;
  undefined2 local_4;

  uVar2 = (undefined2)((uint)param_1 >> 0x10);
  switch(param_3) {
  case '\0':
  case '\x04':
    FUN_00466c80(param_2,1);
    if (param_3 != '\x04') {
      FUN_00436ca0(param_2);
    }
    uVar1 = *(uint *)(param_2 + 0xc);
    *(uint *)(param_2 + 0x10) = *(uint *)(param_2 + 0x10) & 0xfffffeff;
    *(uint *)(param_2 + 0xc) = uVar1 | 0x4000;
    *(uint *)(param_2 + 0xc) = uVar1 | 0x804000;
    iVar3 = get_adjacent_unit(param_2,4);
    if (iVar3 != 0) {
      uVar2 = FUN_00404540(iVar3,1,&local_8);
      *(undefined2 *)(param_2 + 0x1c) = uVar2;
      local_4 = calc_point_height(CONCAT22(uStack_6,local_8),CONCAT22(local_4,uStack_6));
      add_unit_to_cell(param_2,&local_8);
      return;
    }
    if (((*(char *)(param_2 + 0x2b) != '\a') ||
        (iVar3 = get_adjacent_unit(param_2,0x13), iVar3 == 0)) &&
       (*(byte *)(param_2 + 0x35) = *(byte *)(param_2 + 0x35) | 0x10,
       (*(byte *)(param_2 + 0xe) & 2) != 0)) {
      FUN_004ee4f0(param_2);
      return;
    }
    break;
  case '\x01':
    *(ushort *)(param_2 + 0x35) = *(ushort *)(param_2 + 0x35) & 0xffef;
    *(ushort *)(param_2 + 0x76) = *(ushort *)(param_2 + 0x76) & 0xfffb;
    *(uint *)(param_2 + 0x10) = *(uint *)(param_2 + 0x10) | 0x100;
    uVar1 = *(uint *)(param_2 + 0xc);
    *(uint *)(param_2 + 0xc) = uVar1 & 0xffffbfff;
    *(uint *)(param_2 + 0xc) = uVar1 & 0xff7fbfff;
    if ((uVar1 & 0x20000) == 0) {
      insert_unit_into_land_tile(param_2,param_2 + 0x3d);
      uVar2 = extraout_var;
    }
    uVar2 = calc_point_height(CONCAT22(uVar2,*(undefined2 *)(param_2 + 0x3d)),
                              *(undefined2 *)(param_2 + 0x3f));
    *(undefined2 *)(param_2 + 0x41) = uVar2;
    *(undefined2 *)(param_2 + 0x43) = 0;
    *(undefined2 *)(param_2 + 0x47) = 0;
    *(undefined2 *)(param_2 + 0x45) = 0;
    return;
  case '\x03':
    FUN_00466c80(param_2,1);
    *(uint *)(param_2 + 0xc) = *(uint *)(param_2 + 0xc) | 0x800000;
  }
  return;
}
