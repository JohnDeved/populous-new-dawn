/* Ghidra 12.1.3 pseudocode; entry 0049c890; FUN_0049c890.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


undefined2 FUN_0049c890(undefined2 param_1,uint param_2,int param_3)

{
  char cVar1;
  char cVar2;
  char cVar4;
  int iVar5;
  uint uVar6;
  int iVar7;
  undefined2 local_2;
  int iVar3;

  iVar5 = 1;
  do {
    iVar7 = iVar5;
    iVar5 = iVar7 + 1;
  } while ((uint)((iVar7 + 1) * iVar7 * 4) <= param_2);
  uVar6 = 0;
  iVar3 = -iVar7;
  cVar1 = (char)iVar3;
  param_2 = param_2 + (1 - iVar7) * iVar7 * 4;
  iVar5 = iVar7;
  if (param_2 != 0) {
    do {
      if ((uint)(iVar7 * 2) < uVar6 || iVar7 * 2 - uVar6 == 0) {
        if ((uint)(iVar7 * 4) < uVar6 || iVar7 * 4 - uVar6 == 0) {
          if (uVar6 < (uint)(iVar7 * 6)) {
            iVar3 = iVar3 + -1;
          }
          else if (uVar6 <= (uint)(iVar7 * 8) && iVar7 * 8 - uVar6 != 0) {
            iVar5 = iVar5 + 1;
          }
        }
        else {
          iVar5 = iVar5 + -1;
        }
      }
      else {
        iVar3 = iVar3 + 1;
      }
      cVar1 = (char)iVar3;
      uVar6 = uVar6 + 1;
    } while (uVar6 < param_2);
  }
  cVar4 = (char)iVar5;
  if (param_3 == 1) {
    cVar2 = cVar4;
    cVar4 = -cVar1;
  }
  else if (param_3 == 2) {
    cVar2 = -cVar1;
    cVar4 = -cVar4;
  }
  else {
    cVar2 = cVar1;
    if (param_3 == 3) {
      cVar2 = -cVar4;
      cVar4 = cVar1;
    }
  }
  local_2._0_1_ = (char)param_1;
  local_2._1_1_ = (char)((ushort)param_1 >> 8);
  local_2 = CONCAT11(local_2._1_1_ + cVar4 * '\x02',(char)local_2 + cVar2 * '\x02');
  return local_2;
}
