/* Ghidra 12.1.3 pseudocode; entry 00503e60; FUN_00503e60.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_00503e60(ushort param_1,ushort *param_2,ushort *param_3)

{
  short sVar1;
  ushort uVar2;
  ushort uVar3;
  short local_4;

  sVar1 = local_4;
  switch(param_1 >> 8) {
  case 0:
    local_4 = 2;
    sVar1 = 0;
    break;
  case 1:
    local_4 = 1;
    sVar1 = -1;
    break;
  case 2:
    local_4 = 0;
    sVar1 = -2;
    break;
  case 3:
    local_4 = -1;
    sVar1 = -1;
    break;
  case 4:
    local_4 = -2;
    sVar1 = 0;
    break;
  case 5:
    local_4 = -1;
    sVar1 = 1;
    break;
  case 6:
    local_4 = 0;
    sVar1 = 2;
    break;
  case 7:
    local_4 = 1;
    sVar1 = 1;
  }
  uVar2 = *param_2 + local_4 * 8 & 0x7ff;
  uVar3 = *param_3 + sVar1 * 8 & 0x7ff;
  if (uVar2 < 0x401) {
    if (0x271 < uVar2) {
      uVar2 = 0x271;
    }
  }
  else if (uVar2 < 0x58e) {
    uVar2 = 0x58e;
  }
  if (uVar3 < 0x401) {
    if (0x271 < uVar3) {
      uVar3 = 0x271;
    }
  }
  else if (uVar3 < 0x58e) {
    uVar3 = 0x58e;
  }
  *param_2 = uVar2;
  *param_3 = uVar3;
  return;
}
