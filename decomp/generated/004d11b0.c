/* Ghidra 12.1.3 pseudocode; entry 004d11b0; FUN_004d11b0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_004d11b0(int param_1,undefined4 param_2)

{
  char cVar1;
  bool bVar2;
  byte bVar3;
  int iVar4;
  undefined2 extraout_var;
  undefined2 extraout_var_00;
  undefined2 uVar5;
  char *pcVar6;
  ushort *puVar7;
  undefined2 local_36;
  undefined2 uStack_34;
  undefined2 uStack_32;
  int local_30;
  int local_2c;
  undefined1 local_28 [4];
  int local_24;
  ushort local_18;

  bVar2 = false;
  local_2c = 0;
  puVar7 = (ushort *)(param_1 + 0x532);
  do {
    if (bVar2) {
      return;
    }
    if (*puVar7 != 0) {
      FUN_004f4030(param_1,local_28,*puVar7,4,0);
      local_18 = *puVar7;
      if (local_24 != 0) {
        uStack_34 = 0;
        uStack_32 = 0;
        pcVar6 = (char *)(param_1 + 0x4ce);
        FUN_004d1340(param_1,CONCAT22(extraout_var,local_18),local_28);
        local_30 = 0;
        do {
          if (CONCAT22(uStack_32,uStack_34) != 0) break;
          cVar1 = *pcVar6;
          if ((((cVar1 != '\0') && (pcVar6[1] != '\0')) &&
              (iVar4 = FUN_004f2100(param_2,cVar1), iVar4 != 0)) &&
             (iVar4 = FUN_004f3040(param_2,*puVar7,cVar1), iVar4 != 0)) {
            uVar5 = extraout_var_00;
            if (cVar1 == '\0') {
              bVar3 = 0;
            }
            else if (cVar1 == '\v') {
              uVar5 = 0;
              bVar3 = *(byte *)(landscape_height_array +
                               ((&game_state.level_data[0].c_3)
                                [((local_18 & 0xfe) * 2 | local_18 & 0xfe00) * 4] & 0xf)) & 1;
            }
            else {
              bVar3 = 1;
            }
            if ((bVar3 != 0) &&
               (iVar4 = FUN_004f4680(param_1,cVar1,CONCAT22(uVar5,*puVar7),&local_36,0), iVar4 != 0)
               ) {
              alloc_spell_unit(param_1,cVar1,CONCAT22(uStack_34,local_36));
              uStack_34 = 1;
              uStack_32 = 0;
            }
          }
          pcVar6 = pcVar6 + 0xc;
          local_30 = local_30 + 1;
        } while (local_30 < 8);
        bVar2 = true;
      }
      *puVar7 = 0;
    }
    puVar7 = puVar7 + 1;
    local_2c = local_2c + 1;
    if (3 < local_2c) {
      return;
    }
  } while( true );
}
