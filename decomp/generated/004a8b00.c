/* Ghidra 12.1.3 pseudocode; entry 004a8b00; FUN_004a8b00.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void __thiscall FUN_004a8b00(undefined4 param_1,int param_2)

{
  char cVar1;
  undefined2 uVar2;
  int iVar3;
  undefined2 extraout_var;
  uint uVar4;
  undefined2 unaff_retaddr;

  uVar2 = (undefined2)((uint)param_1 >> 0x10);
  if ((*(uint *)(param_2 + 0xc) & 4) != 0) {
    *(uint *)(param_2 + 0xc) = *(uint *)(param_2 + 0xc) & 0xfffffffb;
    if (8 < *(byte *)(param_2 + 0x31)) {
      *(undefined1 *)(param_2 + 0x31) = 0;
    }
    if (*(char *)(param_2 + 0x2b) == '\t') {
      FUN_004a8ed0(param_2);
      land_level_processing_1
                (CONCAT22(unaff_retaddr,
                          CONCAT11((char)((ushort)*(undefined2 *)(param_2 + 0x3f) >> 8),
                                   (char)((ushort)*(undefined2 *)(param_2 + 0x3d) >> 8))) &
                 0xfffffefe,3,1);
      uVar2 = extraout_var;
    }
    uVar2 = calc_point_height(CONCAT22(uVar2,*(undefined2 *)(param_2 + 0x3d)),
                              *(undefined2 *)(param_2 + 0x3f));
    *(undefined2 *)(param_2 + 0x41) = uVar2;
    *(uint *)(param_2 + 0x10) = *(uint *)(param_2 + 0x10) & 0xfffffbff;
    if ((unit_type_array_scenery[*(byte *)(param_2 + 0x2b)].field14_0x16 & 0x80) == 0) {
      cVar1 = FUN_0044f980((undefined2 *)(param_2 + 0x3d));
      if ((cVar1 == '\0') && ((*(byte *)(param_2 + 0xe) & 0x10) == 0)) {
        empty_unit_function(param_2);
        *(undefined1 *)(param_2 + 0x2c) = 2;
        init_unit_class(param_2);
      }
    }
  }
  if (*(char *)(param_2 + 0x2b) == '\t') {
    if ((*(char *)(param_2 + 0x32) != '\0') &&
       (cVar1 = *(char *)(param_2 + 0x32) + -1, *(char *)(param_2 + 0x32) = cVar1, cVar1 == '\0')) {
      *(undefined1 *)(param_2 + 0x31) = 0;
    }
    if ((*(char *)(param_2 + 0x3a) == '\x04') && (*(char *)(param_2 + 0x97) != '\x01')) {
      iVar3 = FUN_0040cc10(param_2);
      if (iVar3 == 0) {
        iVar3 = (int)*(char *)(param_2 + 0x3b);
        uVar4 = (uint)((ulonglong)(*(ushort *)(param_2 + 0x37) >> 2) %
                      (ulonglong)
                      (longlong)
                      (int)(*(ushort *)
                             (iVar3 * 0x170 + 0x87ccae + morph0_mem[iVar3 * 4].field1_0x4 * 10) + 1)
                      );
        if ((uVar4 == *(ushort *)&morph0_mem[iVar3 * 4 + 2].obj_index_1) ||
           ((*(ushort *)&morph0_mem[iVar3 * 4 + 2].obj_index_1 < uVar4 &&
            ((*(byte *)(param_2 + 0x10) & 0x10) == 0)))) {
          FUN_0048a050(param_2,0xc1,0);
        }
      }
    }
  }
  return;
}
