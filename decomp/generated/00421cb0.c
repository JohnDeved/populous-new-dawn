/* Ghidra 12.1.3 pseudocode; entry 00421cb0; FUN_00421cb0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


undefined1 FUN_00421cb0(int *param_1,int *param_2,undefined1 param_3)

{
  int iVar1;
  int iVar2;
  int iVar3;
  char cVar4;
  int iVar5;
  int local_18;
  int local_14;
  undefined2 local_10;
  int local_c;
  int local_8;
  undefined2 local_4;

  local_18 = *param_1;
  local_14 = param_1[1];
  local_10 = (undefined2)param_1[2];
  local_c = *param_2;
  local_8 = param_2[1];
  local_4 = (undefined2)param_2[2];
  DAT_006513d8 = param_3;
  DAT_006513d7 = 0;
  DAT_0064f4a0 = 0;
  FUN_00421f30(param_1,param_2);
  iVar3 = local_8;
  iVar2 = local_c;
  while( true ) {
    if ((iVar2 == local_18) && (iVar3 == local_14)) {
      return 1;
    }
    iVar5 = DAT_006513c0;
    iVar1 = DAT_006513cc;
    if (DAT_006513c8 <= DAT_006513d0) {
      iVar5 = DAT_006513c4;
      iVar1 = -DAT_006513c8;
    }
    DAT_006513d0 = DAT_006513d0 + iVar1;
    cVar4 = FUN_00422020(&local_18,iVar5,&DAT_0064f4a0);
    if (cVar4 != '\0') break;
    local_18 = local_18 + *(int *)(&DAT_0059bd90 + iVar5 * 10);
    local_14 = local_14 + *(int *)(&DAT_0059bd94 + iVar5 * 10);
  }
  return 0;
}
