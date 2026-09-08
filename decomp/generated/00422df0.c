/* Ghidra 12.1.3 pseudocode; entry 00422df0; FUN_00422df0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */

void FUN_00422df0(int *param_1)

{
  int iVar1;
  char cVar2;
  int iVar3;
  int *piVar4;
  undefined1 uVar5;
  uint uVar6;
  int *piVar7;
  undefined2 local_22;
  uint local_20;
  int local_1c;
  int local_18;
  undefined2 local_14;
  int local_10;
  int local_c;
  int local_8;
  undefined2 local_4;

  uVar6 = 0;
  if (*(char *)((int)param_1 + 6) != '\0') {
    local_20 = 0;
    local_10 = 0;
    if (_DAT_00651344 != 0) {
      piVar7 = (int *)&DAT_0065093a;
      do {
        if (piVar7 == (int *)&DAT_0065093a) {
          local_1c = _DAT_00650930;
          local_18 = _DAT_00650934;
          local_14 = _DAT_00650938;
          piVar4 = &DAT_00650944;
        }
        else {
          local_1c = *piVar7;
          local_18 = piVar7[1];
          local_14 = (undefined2)piVar7[2];
          piVar4 = (int *)((int)piVar7 + 10);
        }
        local_c = *piVar4;
        local_8 = piVar4[1];
        local_4 = (undefined2)piVar4[2];
        FUN_00421f30(&local_1c,&local_c);
        for (; (local_c != local_1c || (local_8 != local_18));
            local_18 = local_18 + *(int *)(&DAT_0059bd94 + iVar3 * 10)) {
          local_10 = local_10 + 1;
          local_22 = CONCAT11((undefined1)local_18,(undefined1)local_1c);
          uVar6 = (uint)(byte)((byte)uVar6 |
                              (&game_state.level_data[0].ph_2)
                              [((local_22 & 0xfe) * 2 | local_22 & 0xfe00) * 4]);
          iVar3 = DAT_006513c0;
          iVar1 = DAT_006513cc;
          if (DAT_006513c8 <= DAT_006513d0) {
            iVar3 = DAT_006513c4;
            iVar1 = -DAT_006513c8;
          }
          DAT_006513d0 = DAT_006513d0 + iVar1;
          local_1c = local_1c + *(int *)(&DAT_0059bd90 + iVar3 * 10);
        }
        piVar7 = (int *)((int)piVar7 + 10);
        local_20 = local_20 + 1;
      } while (local_20 < _DAT_00651344);
    }
    uVar6 = uVar6 >> 4;
    uVar5 = (undefined1)uVar6;
    *(undefined1 *)((int)param_1 + 6) = 0;
    local_20 = 0;
    *param_1 = local_10;
    if (game_state._858439_1_ != '\0') {
      do {
        cVar2 = FUN_00419480(local_20);
        if (cVar2 != '\0') {
          uVar6 = (uint)(byte)((byte)uVar6 & ~('\x01' << ((byte)local_20 & 0x1f)));
        }
        uVar5 = (undefined1)uVar6;
        local_20 = local_20 + 1;
      } while ((int)local_20 < (int)(uint)(byte)game_state._858439_1_);
    }
    *(undefined1 *)((int)param_1 + 7) = uVar5;
  }
  return;
}
