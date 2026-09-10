/* Ghidra 12.1.3 pseudocode; entry 0051e9a0; FUN_0051e9a0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


char FUN_0051e9a0(int param_1)

{
  undefined1 uVar1;
  undefined1 uVar2;
  char cVar3;
  short sVar4;
  int iVar5;
  undefined1 local_d;
  undefined1 uStack_c;
  bool bStack_b;
  undefined1 uStack_8;
  undefined1 uStack_7;
  ushort local_4;
  undefined1 local_2;
  undefined1 local_1;

  uStack_c = 0x20;
  cVar3 = '\0';
  local_d = 0;
  iVar5 = FUN_0051ff60(param_1);
  if (iVar5 != 0) {
    iVar5 = (iVar5 / 2) * 2;
    uStack_8 = (undefined1)iVar5;
    uStack_7 = (undefined1)((uint)iVar5 >> 8);
    uVar1 = (undefined1)((ushort)*(undefined2 *)(param_1 + 0x3d) >> 8);
    uVar2 = (undefined1)((ushort)*(undefined2 *)(param_1 + 0x3f) >> 8);
    bStack_b = (unit_type_related_1_ARRAY_005a6f78[*(byte *)(param_1 + 0x2c)].field_0x1 & 8) != 0;
    if (((*(char *)(param_1 + 0xa7) == '\x13') || (*(char *)(param_1 + 0xa7) == '\x1c')) &&
       (*(short *)(param_1 + 0x9f) != 0)) {
      local_d = 1;
      bStack_b = false;
    }
    cVar3 = FUN_0051f470(param_1,CONCAT13(uStack_7,CONCAT12(uStack_8,CONCAT11(uVar2,uVar1))) &
                                 0xfffffefe,iVar5,iVar5,
                         CONCAT13(uStack_8,CONCAT12(uVar2,CONCAT11(uVar1,bStack_b))) & 0xfffefeff,
                         CONCAT13(uVar1,CONCAT12(bStack_b,CONCAT11(0x20,local_d))) & 0xfeffffff);
    if (cVar3 != '\0') {
      sVar4 = FUN_00436c20();
      if (sVar4 != 0) {
        if (cVar3 == '\x03') {
          uStack_c = 0x22;
        }
        local_4 = CONCAT11(uVar2,uVar1) & 0xfefe;
        local_2 = uStack_8;
        local_1 = uStack_8;
        FUN_00438730(sVar4,0x15,&local_4,
                     CONCAT13(uVar2,CONCAT12(uVar1,CONCAT11(bStack_b,uStack_c))) & 0xfefeffff);
        *(uint *)(param_1 + 0xc) = *(uint *)(param_1 + 0xc) | 0x10;
        FUN_00436d00(param_1,sVar4,0xffffffff);
        FUN_00520480(param_1,sVar4);
      }
    }
  }
  return cVar3;
}
