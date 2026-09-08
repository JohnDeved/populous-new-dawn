/* Ghidra 12.1.3 pseudocode; entry 004a80b0; FUN_004a80b0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_004a80b0(int param_1)

{
  uint uVar1;
  char cVar2;
  undefined2 uVar3;
  undefined2 extraout_var;

  uVar1 = *(uint *)(param_1 + 0xc);
  if ((uVar1 & 0x200c) == 0) {
    return;
  }
  if ((uVar1 & 4) != 0) {
    *(uint *)(param_1 + 0xc) = uVar1 & 0xfffffffb;
    uVar3 = 0;
    if ((unit_type_array_scenery[*(byte *)(param_1 + 0x2b)].flags & 8) != 0) {
      cVar2 = FUN_004e90e0(param_1);
      if (cVar2 != '\0') {
        uVar1 = *(uint *)(param_1 + 0xc);
        *(uint *)(param_1 + 0xc) = uVar1 | 0x80000;
        if ((uVar1 & 0x100000) == 0) {
          empty_unit_function(param_1);
          *(undefined1 *)(param_1 + 0x2c) = 7;
          init_unit_class(param_1);
        }
        goto LAB_004a813a;
      }
      *(uint *)(param_1 + 0xc) = *(uint *)(param_1 + 0xc) & 0xfff7ffff;
      uVar3 = extraout_var;
    }
    uVar3 = calc_point_height(CONCAT22(uVar3,*(undefined2 *)(param_1 + 0x3d)),
                              *(undefined2 *)(param_1 + 0x3f));
    *(uint *)(param_1 + 0x10) = *(uint *)(param_1 + 0x10) & 0xfffffbff;
    *(undefined2 *)(param_1 + 0x41) = uVar3;
  }
LAB_004a813a:
  uVar1 = *(uint *)(param_1 + 0xc);
  if ((uVar1 & 8) != 0) {
    *(uint *)(param_1 + 0xc) = uVar1 & 0xfffffff7;
    if (((unit_type_array_scenery[*(byte *)(param_1 + 0x2b)].flags_1 & 0x20) != 0) &&
       (*(char *)(param_1 + 0x2a) == '\x05')) {
      if (*(byte *)(param_1 + 0x2b) == 10) {
        *(byte *)(param_1 + 0x90) = *(byte *)(param_1 + 0x90) | 4;
        *(undefined2 *)(param_1 + 0x7c) = 0;
      }
      else if (((*(byte *)(param_1 + 0x90) & 4) == 0) && ((uVar1 & 0x100000) == 0)) {
        empty_unit_function(param_1);
        *(undefined1 *)(param_1 + 0x2c) = 5;
        init_unit_class(param_1);
      }
    }
  }
  uVar1 = *(uint *)(param_1 + 0xc);
  if ((uVar1 & 0x2000) != 0) {
    *(uint *)(param_1 + 0xc) = uVar1 & 0xffffdfff;
    *(uint *)(param_1 + 0xc) = uVar1 & 0xffffdfff | 0x80000;
    if ((uVar1 & 0x100000) == 0) {
      empty_unit_function(param_1);
      *(undefined1 *)(param_1 + 0x2c) = 7;
      init_unit_class(param_1);
    }
  }
  if (((((*(byte *)(param_1 + 0x11) & 4) == 0) &&
       ((unit_type_array_scenery[*(byte *)(param_1 + 0x2b)].field14_0x16 & 0x80) == 0)) &&
      (cVar2 = FUN_0044f980(param_1 + 0x3d), cVar2 == '\0')) &&
     ((*(byte *)(param_1 + 0xe) & 0x10) == 0)) {
    empty_unit_function(param_1);
    *(undefined1 *)(param_1 + 0x2c) = 2;
    init_unit_class(param_1);
  }
  return;
}
