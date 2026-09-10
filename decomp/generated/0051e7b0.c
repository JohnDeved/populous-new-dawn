/* Ghidra 12.1.3 pseudocode; entry 0051e7b0; FUN_0051e7b0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


char FUN_0051e7b0(int param_1)

{
  unit_struct *puVar1;
  ushort uVar2;
  undefined1 uVar3;
  undefined1 uVar4;
  char cVar5;
  short sVar6;
  int iVar7;
  unit_struct *puVar8;
  char local_16;
  undefined1 uStack_15;
  byte bStack_12;
  byte bStack_11;
  undefined4 local_10;
  int local_c;
  int local_8;
  int local_4;

  local_8 = 0;
  uStack_15 = 0;
  local_16 = '\0';
  iVar7 = FUN_0051ff60(param_1);
  if (iVar7 == 0) {
    return '\0';
  }
  local_4 = (iVar7 / 2) * 2;
  uVar3 = (undefined1)((ushort)*(undefined2 *)(param_1 + 0x3d) >> 8);
  uVar4 = (undefined1)((ushort)*(undefined2 *)(param_1 + 0x3f) >> 8);
  uVar2 = CONCAT11(uVar4,uVar3) & 0xfefe;
  bStack_12 = (byte)uVar2;
  bStack_11 = (byte)(uVar2 >> 8);
  if (*(char *)(param_1 + 0x2b) == '\x04') {
    cVar5 = FUN_004df140(param_1);
    if (cVar5 == '\0') {
      local_16 = '\x01';
    }
    else if ((*(byte *)(param_1 + 0x76) & 0x40) == 0) {
      uStack_15 = 1;
    }
  }
  cVar5 = FUN_0051f030(param_1,CONCAT13(bStack_11,CONCAT12(bStack_12,CONCAT11(uVar4,uVar3))) &
                               0xfffffefe,local_4,local_4,0,
                       CONCAT13(bStack_12,CONCAT12(uVar4,CONCAT11(uVar3,uStack_15))) & 0xfffefeff,
                       &local_c,0,0);
  if (cVar5 == '\0') {
    if (local_16 != '\0') {
      FUN_0051f030(param_1,CONCAT13(bStack_11,CONCAT12(bStack_12,CONCAT11(uVar4,uVar3))) &
                           0xfffffefe,2,2,0,
                   CONCAT13(bStack_12,CONCAT12(uVar4,CONCAT11(uVar3,uStack_15))) & 0xfffefeff,
                   &local_c,CONCAT13(uVar4,CONCAT12(uVar3,CONCAT11(uStack_15,local_16))) &
                            0xfefeffff,&local_8);
    }
    if (local_8 != 0) goto LAB_0051e962;
    if (local_c != 0) {
      puVar8 = (unit_struct *)0x0;
      if (((*(ushort *)(local_c + 0x89) != 0) &&
          (puVar1 = unit_land_array[*(ushort *)(local_c + 0x89)],
          (*(byte *)&puVar1->flags_2 & 1) == 0)) && (puVar1->unit_class != '\0')) {
        puVar8 = puVar1;
      }
      if (puVar8 != (unit_struct *)0x0) {
        cVar5 = '\x05';
        bStack_12 = (byte)((ushort)(puVar8->pos).x >> 8) & 0xfe;
        bStack_11 = (byte)((ushort)(puVar8->pos).y >> 8) & 0xfe;
      }
    }
  }
  if (local_8 == 0) {
    if (cVar5 == '\0') {
      return '\0';
    }
    sVar6 = FUN_00436c20();
    if (sVar6 == 0) {
      return cVar5;
    }
    local_10 = CONCAT13((undefined1)local_4,
                        CONCAT12((undefined1)local_4,CONCAT11(bStack_11,bStack_12)));
    FUN_00438730(sVar6,0x15,&local_10,0x20);
    *(uint *)(param_1 + 0xc) = *(uint *)(param_1 + 0xc) | 0x10;
    FUN_00436d00(param_1,sVar6,0xffffffff);
    FUN_00520480(param_1,sVar6);
    return cVar5;
  }
LAB_0051e962:
  sVar6 = FUN_00436c20();
  if (sVar6 != 0) {
    local_10 = *(undefined4 *)(param_1 + 0x3d);
    FUN_00438730(sVar6,0x20,&local_10,0x20);
    *(uint *)(param_1 + 0xc) = *(uint *)(param_1 + 0xc) | 0x10;
    FUN_00436d00(param_1,sVar6,0xffffffff);
  }
  return cVar5;
}
