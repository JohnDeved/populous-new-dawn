/* Ghidra 12.1.3 pseudocode; entry 0040b860; FUN_0040b860.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


undefined1 FUN_0040b860(int param_1,int param_2,char param_3)

{
  char cVar1;
  char cVar2;
  ushort uVar3;
  int iVar4;
  int iVar5;
  undefined2 local_c;
  undefined2 local_a;
  byte *local_8;
  int local_4;

  local_4 = 0;
  if (param_2 < 1) {
    return 1;
  }
  local_8 = (byte *)(param_1 + 6);
  do {
    if ((*local_8 & 0x80) != 0) {
      local_c = *(ushort *)(local_8 + -2);
      iVar4 = 0;
      do {
        iVar5 = 0;
        do {
          local_a = local_c;
          uVar3 = local_a;
          local_a._0_1_ = (char)local_c;
          cVar1 = (char)local_a;
          local_a._1_1_ = (char)(local_c >> 8);
          cVar2 = local_a._1_1_;
          if (iVar5 == 1) {
            switch(param_3 + 1U & 3) {
            case 0:
switchD_0040b8e2_caseD_0:
              local_a = CONCAT11(local_a._1_1_ + '\x02',(char)local_a);
              uVar3 = local_a;
              break;
            case 1:
switchD_0040b8e2_caseD_1:
              local_a = CONCAT11(local_a._1_1_,(char)local_a + '\x02');
              uVar3 = local_a;
              break;
            case 2:
switchD_0040b8e2_caseD_2:
              local_a = CONCAT11(local_a._1_1_ + -2,(char)local_a);
              uVar3 = local_a;
              break;
            case 3:
switchD_0040b8e2_caseD_3:
              local_a = CONCAT11(local_a._1_1_,(char)local_a + -2);
              uVar3 = local_a;
            }
          }
          else if (iVar5 == 2) {
            switch(param_3 - 1U & 3) {
            case 0:
              goto switchD_0040b8e2_caseD_0;
            case 1:
              goto switchD_0040b8e2_caseD_1;
            case 2:
              goto switchD_0040b8e2_caseD_2;
            case 3:
              goto switchD_0040b8e2_caseD_3;
            }
          }
          local_a = uVar3;
          if (0 < (short)(&game_state.level_data[0].height)
                         [((local_a & 0xfe) * 2 | local_a & 0xfe00) * 2]) {
            return 0;
          }
          iVar5 = iVar5 + 1;
        } while (iVar5 < 3);
        iVar4 = iVar4 + 1;
        switch(param_3) {
        case '\0':
          local_c = CONCAT11(cVar2 + '\x02',cVar1);
          break;
        case '\x01':
          local_c = CONCAT11(cVar2,cVar1 + '\x02');
          break;
        case '\x02':
          local_c = CONCAT11(cVar2 + -2,cVar1);
          break;
        case '\x03':
          local_c = CONCAT11(cVar2,cVar1 + -2);
        }
      } while (iVar4 < 6);
    }
    local_8 = local_8 + 8;
    local_4 = local_4 + 1;
    if (param_2 <= local_4) {
      return 1;
    }
  } while( true );
}
