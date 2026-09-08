/* Ghidra 12.1.3 pseudocode; entry 004a7eb0; FUN_004a7eb0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */

void __thiscall FUN_004a7eb0(undefined4 param_1,int param_2)

{
  char cVar1;
  uint uVar2;
  undefined2 uVar3;
  undefined2 extraout_var;
  undefined2 uVar5;
  undefined2 extraout_var_00;
  int iVar4;
  undefined2 extraout_var_01;
  undefined2 extraout_var_02;
  short sVar6;

  uVar3 = (undefined2)((uint)param_1 >> 0x10);
  cVar1 = *(char *)(param_2 + 0x2d);
  if (cVar1 == '\0') {
    if ((*(byte *)(param_2 + 0xc) & 4) != 0) {
      uVar3 = calc_point_height(CONCAT22(uVar3,*(undefined2 *)(param_2 + 0x3d)),
                                *(undefined2 *)(param_2 + 0x3f));
      *(uint *)(param_2 + 0x10) = *(uint *)(param_2 + 0x10) & 0xfffffbff;
      *(undefined2 *)(param_2 + 0x41) = uVar3;
      *(uint *)(param_2 + 0xc) = *(uint *)(param_2 + 0xc) & 0xfffffffb;
      return;
    }
  }
  else if (cVar1 == '\x01') {
    if ((*(byte *)(param_2 + 0xf) & 0x40) != 0) {
      _DAT_0098e7e4 = _DAT_0098e7e4 + 1;
      uVar5 = 0;
      if ((_DAT_0098e7e4 & 1) != 0) {
        FUN_0048a050(param_2,0x9f,0);
        uVar3 = extraout_var_01;
        uVar5 = extraout_var;
      }
      *(uint *)(param_2 + 0xc) = *(uint *)(param_2 + 0xc) & 0xbfffffff;
      uVar3 = calc_point_height(CONCAT22(uVar3,*(undefined2 *)(param_2 + 0x3d)),
                                CONCAT22(uVar5,*(undefined2 *)(param_2 + 0x3f)));
      *(undefined2 *)(param_2 + 0x86) = 0x10;
      *(uint *)(param_2 + 0x10) = *(uint *)(param_2 + 0x10) & 0xfffffbff;
      *(undefined2 *)(param_2 + 0x41) = uVar3;
      *(short *)(param_2 + 0x41) = *(short *)(param_2 + 0x41) + -0x100;
      *(undefined2 *)(param_2 + 0x6c) = 0x100;
      iVar4 = alloc_unit(7,0x33,*(undefined1 *)(param_2 + 0x2f),(undefined2 *)(param_2 + 0x3d));
      if (iVar4 != 0) {
        sVar6 = (char)obj_related_array[*(byte *)(iVar4 + 0x3a) + 3].f1 * 4 +
                *(short *)(iVar4 + 0x37);
        *(short *)(iVar4 + 0x37) = sVar6;
        *(short *)(iVar4 + 0x37) = sVar6 - (char)obj_related_array[*(byte *)(iVar4 + 0x3a) + 3]._f2;
      }
    }
    if (*(short *)(param_2 + 0x6c) != 0) {
      *(short *)(param_2 + 0x6c) = *(short *)(param_2 + 0x6c) + -0x20;
    }
    *(short *)(param_2 + 0x41) = *(short *)(param_2 + 0x41) + 0x10;
    sVar6 = *(short *)(param_2 + 0x86) + -1;
    *(short *)(param_2 + 0x86) = sVar6;
    if (sVar6 == 0) {
      uVar2 = *(uint *)(param_2 + 0xc);
      *(undefined1 *)(param_2 + 0x2d) = 0;
      *(uint *)(param_2 + 0xc) = uVar2 | 4;
      *(uint *)(param_2 + 0xc) = uVar2 | 0x40000004;
      return;
    }
  }
  else {
    if (cVar1 != '\x02') {
      return;
    }
    if ((*(byte *)(param_2 + 0xf) & 0x40) != 0) {
      FUN_0048a050(param_2,0xc5,0);
      *(uint *)(param_2 + 0xc) = *(uint *)(param_2 + 0xc) & 0xbfffffff;
      uVar3 = calc_point_height(CONCAT22(extraout_var_02,*(undefined2 *)(param_2 + 0x3d)),
                                CONCAT22(extraout_var_00,*(undefined2 *)(param_2 + 0x3f)));
      *(undefined2 *)(param_2 + 0x86) = 0x20;
      *(uint *)(param_2 + 0x10) = *(uint *)(param_2 + 0x10) & 0xfffffbff;
      *(undefined2 *)(param_2 + 0x41) = uVar3;
      iVar4 = alloc_unit(7,0x33,*(undefined1 *)(param_2 + 0x2f),(undefined2 *)(param_2 + 0x3d));
      if (iVar4 != 0) {
        sVar6 = (char)obj_related_array[*(byte *)(iVar4 + 0x3a) + 3].f1 * 4 +
                *(short *)(iVar4 + 0x37);
        *(short *)(iVar4 + 0x37) = sVar6;
        *(short *)(iVar4 + 0x37) = sVar6 - (char)obj_related_array[*(byte *)(iVar4 + 0x3a) + 3]._f2;
        *(short *)(iVar4 + 0x6c) = *(short *)(iVar4 + 0x6c) << 1;
      }
    }
    if (*(ushort *)(param_2 + 0x6c) < 0x100) {
      *(ushort *)(param_2 + 0x6c) = *(ushort *)(param_2 + 0x6c) + 0x10;
    }
    *(short *)(param_2 + 0x41) = *(short *)(param_2 + 0x41) + -8;
    sVar6 = *(short *)(param_2 + 0x86) + -1;
    *(short *)(param_2 + 0x86) = sVar6;
    if (sVar6 == 0) {
      FUN_004ef180(param_2);
    }
  }
  return;
}
