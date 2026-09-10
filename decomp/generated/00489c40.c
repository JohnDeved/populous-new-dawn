/* Ghidra 12.1.3 pseudocode; entry 00489c40; FUN_00489c40.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_00489c40(undefined4 param_1,int param_2,int param_3)

{
  char cVar1;
  int iVar2;
  int iVar3;
  int iVar4;
  int iVar5;
  undefined4 uVar6;

  if (param_3 != 0) {
    cVar1 = *(char *)(param_2 + 0x2b);
    if (cVar1 == '\x04') {
      FUN_0048a050(param_2,0x57,0);
      return;
    }
    if (cVar1 == '\x05') {
      FUN_0048a050(param_2,0x56,0);
      return;
    }
    if (cVar1 == '\a') {
      FUN_0048a050(param_2,0x18,0);
      return;
    }
    FUN_0048a050(param_2,0x58,0);
    return;
  }
  iVar2 = FUN_00418d70(param_1);
  iVar3 = FUN_00418da0(param_1,5);
  switch(iVar3) {
  case 0:
    break;
  case 1:
    FUN_0048a050(param_2,0x56,0);
    break;
  case 2:
    FUN_0048a050(param_2,0x46,0);
    break;
  case 3:
    FUN_0048a050(param_2,0x47,0);
    break;
  default:
    FUN_0048a050(param_2,0x48,0);
  }
  iVar4 = FUN_00418da0(param_1,4);
  switch(iVar4) {
  case 0:
    goto switchD_00489d35_caseD_0;
  case 1:
    uVar6 = 0x57;
    break;
  case 2:
    uVar6 = 0x49;
    break;
  case 3:
    uVar6 = 0x4a;
    break;
  default:
    uVar6 = 0x4b;
  }
  FUN_0048a050(param_2,uVar6,0);
switchD_00489d35_caseD_0:
  iVar5 = FUN_00418da0(param_1,7);
  if (iVar5 != 0) {
    FUN_0048a050(param_2,0x18,0);
  }
  switch(((iVar2 - iVar3) - iVar4) - iVar5) {
  case 0:
    goto switchD_00489d82_caseD_0;
  case 1:
    FUN_0048a050(param_2,0x58,0);
    return;
  case 2:
    FUN_0048a050(param_2,0x43,0);
    return;
  case 3:
    FUN_0048a050(param_2,0x44,0);
switchD_00489d82_caseD_0:
    return;
  default:
    FUN_0048a050(param_2,0x45,0);
    return;
  }
}
