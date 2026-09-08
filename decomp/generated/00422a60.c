/* Ghidra 12.1.3 pseudocode; entry 00422a60; FUN_00422a60.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_00422a60(undefined2 param_1,short param_2)

{
  int iVar1;
  byte *pbVar2;
  byte bVar3;
  int iVar4;
  byte bVar5;
  int iVar6;
  byte bVar7;
  char cVar8;
  int iVar9;
  undefined4 uVar10;
  char local_c;
  char cStack_b;
  undefined2 uStack_8;
  int local_4;

  iVar1 = param_2 * 4 + 1;
  local_c = (char)param_1;
  cStack_b = (char)((ushort)param_1 >> 8);
  bVar3 = cStack_b + (char)param_2 * -2;
  local_4 = 0;
  do {
    uStack_8 = (undefined2)iVar1;
    iVar4 = iVar1;
    bVar5 = bVar3;
    if (local_4 == 0) {
      game_state._841980_4_ = 0x96aaba;
      uVar10 = land_const_1;
    }
    else {
      game_state._841980_4_ = 0x96caba;
      uVar10 = DAT_005aa454;
    }
    for (; iVar6 = iVar1, bVar7 = local_c + (char)param_2 * -2, iVar4 != 0; iVar4 = iVar4 + -1) {
      for (; iVar6 != 0; iVar6 = iVar6 + -1) {
        cVar8 = '\0';
        if (((&game_state.level_data[0].flags)
             [(CONCAT11(bVar5,bVar7) & 0xfe) * 2 | CONCAT11(bVar5,bVar7) & 0xfe00] & 0x80004) == 0)
        {
          cVar8 = FUN_00422bd0(CONCAT22(uStack_8,CONCAT11(bVar5,bVar7)),uVar10);
        }
        if (cVar8 == '\0') {
          iVar9 = (uint)bVar5 * 0x100 + (uint)bVar7;
          pbVar2 = (byte *)(game_state._841980_4_ + (iVar9 >> 3));
          *pbVar2 = *pbVar2 & ~('\x01' << ((byte)iVar9 & 7));
        }
        else {
          iVar9 = (uint)bVar7 + (uint)bVar5 * 0x100;
          pbVar2 = (byte *)(game_state._841980_4_ + (iVar9 >> 3));
          *pbVar2 = *pbVar2 | '\x01' << ((byte)iVar9 & 7);
        }
        bVar7 = bVar7 + 1;
      }
      bVar5 = bVar5 + 1;
    }
    local_4 = local_4 + 1;
  } while (local_4 < 2);
  game_state._841980_4_ = 0x96aaba;
  return;
}
