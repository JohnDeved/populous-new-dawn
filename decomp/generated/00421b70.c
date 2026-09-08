/* Ghidra 12.1.3 pseudocode; entry 00421b70; FUN_00421b70.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


undefined1 FUN_00421b70(undefined4 *param_1,uint param_2)

{
  undefined2 uVar1;
  bool bVar2;
  char cVar3;
  int iVar4;
  int iVar5;
  uint uVar6;
  undefined1 local_19;
  undefined4 *local_18;
  uint local_10;
  undefined4 local_c;
  undefined4 local_8;
  undefined4 local_4;

  local_19 = 0;
  do {
    local_10 = param_2;
    if (param_2 == 0) {
      uVar1 = *(undefined2 *)(param_1 + 2);
      local_c = *param_1;
      local_8 = param_1[1];
    }
    else {
      local_8 = *(undefined4 *)((int)param_1 + param_2 * 10 + 0xe);
      local_c = *(undefined4 *)((int)param_1 + param_2 * 10 + 10);
      uVar1 = *(undefined2 *)((int)param_1 + param_2 * 10 + 0x12);
    }
    local_4 = CONCAT22(local_4._2_2_,uVar1);
    bVar2 = false;
    if (param_2 < (uint)param_1[0x285]) {
      local_18 = (undefined4 *)((int)param_1 + param_2 * 10 + 0x14);
      uVar6 = param_2;
      do {
        iVar4 = 4;
        iVar5 = (int)param_1 + uVar6 * 10 + 0x3c;
        do {
          if ((uVar6 + iVar4 < (uint)param_1[0x285]) && (*(char *)(iVar5 + 8) == (char)local_4)) {
            cVar3 = FUN_00421cb0(&local_c,iVar5,local_4);
            if (cVar3 != '\0') {
              uVar6 = uVar6 + iVar4;
              bVar2 = true;
              local_19 = 1;
              goto LAB_00421c72;
            }
          }
          iVar5 = iVar5 + -10;
          iVar4 = iVar4 + -1;
        } while (iVar4 != 0);
        *local_18 = *(undefined4 *)((int)param_1 + uVar6 * 10 + 0x14);
        local_18[1] = *(undefined4 *)((int)param_1 + uVar6 * 10 + 0x18);
        *(undefined2 *)(local_18 + 2) = *(undefined2 *)((int)param_1 + uVar6 * 10 + 0x1c);
        local_c = *local_18;
        uVar6 = uVar6 + 1;
        local_8 = local_18[1];
        local_10 = local_10 + 1;
        local_4 = CONCAT22(local_4._2_2_,*(undefined2 *)(local_18 + 2));
        local_18 = (undefined4 *)((int)local_18 + 10);
LAB_00421c72:
      } while (uVar6 < (uint)param_1[0x285]);
    }
    param_1[0x285] = local_10;
    if (!bVar2) {
      return local_19;
    }
  } while( true );
}
