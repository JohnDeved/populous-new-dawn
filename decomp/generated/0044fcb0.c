/* Ghidra 12.1.3 pseudocode; entry 0044fcb0; FUN_0044fcb0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_0044fcb0(uint *param_1,undefined2 param_2,undefined2 param_3)

{
  uint uVar1;
  uint uVar2;
  uint uVar3;
  uint uVar4;
  uint uVar5;
  byte local_6;
  byte bStack_5;
  byte bStack_3;

  uVar1 = (byte)param_2 & 0xfe;
  local_6 = (byte)param_3;
  uVar4 = local_6 & 0xfe;
  bStack_3 = (byte)((ushort)param_2 >> 8);
  uVar3 = bStack_3 & 0xfe;
  bStack_5 = (byte)((ushort)param_3 >> 8);
  uVar5 = (uint)(bStack_5 & 0xfe);
  uVar2 = uVar1;
  if (uVar4 < uVar1) {
    uVar2 = uVar4;
    uVar4 = uVar1;
  }
  uVar1 = uVar3;
  if (uVar5 < uVar3) {
    uVar1 = uVar5;
    uVar5 = uVar3;
  }
  uVar3 = uVar2;
  if (0x7f < (int)(uVar4 - uVar2)) {
    uVar3 = uVar4;
    uVar4 = uVar2;
  }
  uVar2 = uVar1;
  if (0x7f < (int)(uVar5 - uVar1)) {
    uVar2 = uVar5;
    uVar5 = uVar1;
  }
  uVar4 = uVar4 - uVar3;
  if ((int)uVar4 < 0) {
    uVar4 = -uVar4;
  }
  uVar5 = uVar5 - uVar2;
  if ((int)uVar5 < 0) {
    uVar5 = -uVar5;
  }
  if (0x80 < (int)uVar4) {
    uVar4 = 0x100 - uVar4;
  }
  if (0x80 < (int)uVar5) {
    uVar5 = 0x100 - uVar5;
  }
  *param_1 = uVar3;
  param_1[1] = uVar2;
  param_1[2] = uVar4;
  param_1[3] = uVar5;
  return;
}
