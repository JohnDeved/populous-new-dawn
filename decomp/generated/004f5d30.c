/* Ghidra 12.1.3 pseudocode; entry 004f5d30; FUN_004f5d30.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


undefined4 FUN_004f5d30(ushort *param_1)

{
  undefined4 uVar1;
  char cVar2;
  ushort uVar3;
  int iVar4;
  int iVar5;
  undefined4 local_e;
  byte bStack_9;
  short local_8;
  short sStack_6;
  undefined2 local_4;

  uVar3 = *param_1;
  local_e._2_1_ = (byte)uVar3;
  local_e._3_1_ = (byte)(uVar3 >> 8);
  local_e = CONCAT13(local_e._3_1_,CONCAT12(local_e._2_1_,uVar3)) & 0xfefeffff;
  local_8 = (local_e._2_1_ + 1) * 0x100;
  uVar1 = CONCAT22(sStack_6,local_8);
  sStack_6 = (local_e._3_1_ + 1) * 0x100;
  local_4 = FUN_0044e940(uVar1,CONCAT22(local_4,sStack_6));
  cVar2 = FUN_00518200(&local_8,0);
  if (cVar2 == '\0') {
    return 1;
  }
  iVar4 = 0;
  iVar5 = 0;
  do {
    uVar3 = FUN_0049c890(local_e,iVar5,0);
    local_e = CONCAT22(uVar3,(undefined2)local_e);
    bStack_9 = (byte)(uVar3 >> 8) & 0xfe;
    local_8 = ((uVar3 & 0xfe) + 1) * 0x100;
    uVar1 = CONCAT22(sStack_6,local_8);
    sStack_6 = (bStack_9 + 1) * 0x100;
    local_4 = FUN_0044e940(uVar1,CONCAT22(local_4,sStack_6));
    cVar2 = FUN_00518200(&local_8,0);
    if (cVar2 == '\0') {
      *param_1 = uVar3;
      return 1;
    }
    iVar4 = iVar4 + 1;
    iVar5 = iVar5 + 1;
  } while (iVar4 < 0x18);
  return 0;
}
