/* Ghidra 12.1.3 pseudocode; entry 004d5650; FUN_004d5650.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_004d5650(ushort *param_1,short *param_2)

{
  byte bVar1;
  ushort uVar2;
  short sVar3;
  short sVar4;
  int iVar5;
  undefined4 local_4;

  local_4 = *param_1 & 0xfffffffe;
  uVar2 = (ushort)local_4;
  local_4._1_1_ = (byte)(local_4 >> 8) & 0xfe;
  sVar4 = ((uVar2 & 0xff) + 1) * 0x100;
  sVar3 = (local_4._1_1_ + 1) * 0x100;
  *param_2 = sVar4;
  param_2[1] = sVar3;
  bVar1 = (byte)param_1[1];
  iVar5 = DAT_00895ef1;
  if ((bVar1 & 0xf0) != 0) {
    local_4 = (uint)(bVar1 >> 4);
    iVar5 = *(int *)(&DAT_00895ed9 + local_4 * 4);
  }
  *param_2 = *(short *)(iVar5 + (bVar1 & 0xf) * 4) + sVar4;
  param_2[1] = *(short *)(iVar5 + 2 + (uint)((byte)param_1[1] & 0xf) * 4) + sVar3;
  return;
}
