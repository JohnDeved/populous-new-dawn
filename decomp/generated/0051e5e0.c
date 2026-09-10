/* Ghidra 12.1.3 pseudocode; entry 0051e5e0; FUN_0051e5e0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


char FUN_0051e5e0(int param_1)

{
  undefined1 uVar1;
  undefined1 uVar2;
  char cVar3;
  short sVar4;
  int iVar5;
  undefined1 local_d;
  char cStack_c;
  byte bStack_b;
  undefined1 uStack_8;
  undefined1 uStack_7;
  ushort local_4;
  undefined1 local_2;
  undefined1 local_1;

  bStack_b = 0x20;
  cVar3 = '\0';
  local_d = 0;
  cStack_c = '\0';
  iVar5 = FUN_0051ff60(param_1);
  if (iVar5 != 0) {
    iVar5 = (iVar5 / 2) * 2;
    uStack_8 = (undefined1)iVar5;
    uStack_7 = (undefined1)((uint)iVar5 >> 8);
    uVar1 = (undefined1)((ushort)*(undefined2 *)(param_1 + 0x3d) >> 8);
    uVar2 = (undefined1)((ushort)*(undefined2 *)(param_1 + 0x3f) >> 8);
    if (((unit_type_related_1_ARRAY_005a6f78[*(byte *)(param_1 + 0x2c)].field_0x1 & 8) != 0) &&
       (*(short *)(param_1 + 0x9f) == 0)) {
      local_d = 1;
      cStack_c = '\x01';
    }
    cVar3 = FUN_0051eab0(param_1,CONCAT13(uStack_7,CONCAT12(uStack_8,CONCAT11(uVar2,uVar1))) &
                                 0xfffffefe,iVar5,iVar5,
                         CONCAT13(uVar1,CONCAT12(0x20,CONCAT11(cStack_c,local_d))) & 0xfeffffff,
                         CONCAT13(uVar2,CONCAT12(uVar1,CONCAT11(0x20,cStack_c))) & 0xfefeffff);
    if (cVar3 != '\0') {
      sVar4 = FUN_00436c20();
      if (sVar4 != 0) {
        if (cStack_c != '\0') {
          bStack_b = 0x30;
        }
        if (cVar3 == '\x03') {
          bStack_b = bStack_b | 2;
        }
        local_4 = CONCAT11(uVar2,uVar1) & 0xfefe;
        local_2 = uStack_8;
        local_1 = uStack_8;
        FUN_00438730(sVar4,0x15,&local_4,
                     CONCAT13(uStack_8,CONCAT12(uVar2,CONCAT11(uVar1,bStack_b))) & 0xfffefeff);
        *(uint *)(param_1 + 0xc) = *(uint *)(param_1 + 0xc) | 0x10;
        FUN_00436d00(param_1,sVar4,0xffffffff);
        FUN_00520480(param_1,sVar4);
      }
    }
  }
  return cVar3;
}
