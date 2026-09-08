/* Ghidra 12.1.3 pseudocode; entry 004a7bd0; FUN_004a7bd0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_004a7bd0(int param_1)

{
  undefined1 uVar1;
  char cVar2;
  short sVar3;
  undefined2 uVar4;
  uint uVar5;
  int iVar6;
  undefined2 extraout_var;

  if (*(char *)(param_1 + 0x2d) == '\0') {
    *(undefined1 *)(param_1 + 0x2d) = 1;
    ptr_unit_related_20B->field0_0x0 = 1;
    ptr_unit_related_20B->field1_0x4 = 0;
    ptr_unit_related_20B->unit_ptr = (unit_struct *)0x20;
    ptr_unit_related_20B->field3_0xc = 1;
    ptr_unit_related_20B->field4_0x10 = 0;
    ptr_unit_related_20B = ptr_unit_related_20B + 1;
    unit_allocation_flag = 1;
    iVar6 = alloc_unit(5,10,0xff,param_1 + 0x3d);
    if (iVar6 != 0) {
      FUN_004a8c60(iVar6,0x4c);
    }
  }
  else {
    sVar3 = *(short *)(param_1 + 0x7c) + -1;
    *(short *)(param_1 + 0x7c) = sVar3;
    if (sVar3 < 0) {
      if ((*(byte *)(param_1 + 0x90) & 2) == 0) {
        FUN_004ef180(param_1);
        return;
      }
      uVar1 = unit_type_array_scenery[*(byte *)(param_1 + 0x2b)].field9_0x11;
      if ((*(byte *)(param_1 + 0xe) & 0x10) == 0) {
        empty_unit_function(param_1);
        *(undefined1 *)(param_1 + 0x2c) = uVar1;
        init_unit_class(param_1);
      }
      if ((unit_type_array_scenery[*(byte *)(param_1 + 0x2b)].flags_1 & 5) != 0) {
        FUN_004a79f0(param_1,5 - *(short *)(param_1 + 0x84),0xffffffff);
        return;
      }
    }
    else {
      uVar4 = 0;
      if (((unit_type_array_scenery[*(byte *)(param_1 + 0x2b)].flags_1 & 5) != 0) &&
         (7 < *(short *)(param_1 + 0x84))) {
        FUN_004a79f0(param_1,0xfffffffc,0xffffffff);
        uVar4 = extraout_var;
      }
      if ((*(uint *)(param_1 + 0xc) & 4) != 0) {
        uVar5 = *(uint *)(param_1 + 0xc) & 0xfffffffb;
        *(uint *)(param_1 + 0xc) = uVar5;
        uVar4 = calc_point_height(CONCAT22((short)(uVar5 >> 0x10),*(undefined2 *)(param_1 + 0x3d)),
                                  CONCAT22(uVar4,*(undefined2 *)(param_1 + 0x3f)));
        *(undefined2 *)(param_1 + 0x41) = uVar4;
        *(uint *)(param_1 + 0x10) = *(uint *)(param_1 + 0x10) & 0xfffffbff;
        if ((unit_type_array_scenery[*(byte *)(param_1 + 0x2b)].field14_0x16 & 0x80) == 0) {
          cVar2 = FUN_0044f980((undefined2 *)(param_1 + 0x3d));
          if ((cVar2 == '\0') && ((*(byte *)(param_1 + 0xe) & 0x10) == 0)) {
            empty_unit_function(param_1);
            *(undefined1 *)(param_1 + 0x2c) = 2;
            init_unit_class(param_1);
            return;
          }
        }
      }
    }
  }
  return;
}
