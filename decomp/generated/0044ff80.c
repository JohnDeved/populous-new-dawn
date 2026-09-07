/* Ghidra 12.1.3 pseudocode; entry 0044ff80; FUN_0044ff80.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_0044ff80(short *param_1,char param_2,char param_3)

{
  uint *puVar1;
  ushort uVar2;
  byte bVar3;
  uint uVar4;
  ushort uVar5;
  ushort uVar6;
  ushort uVar7;
  ushort uVar8;
  ushort uVar9;
  ushort uVar10;
  ushort uVar11;
  char cVar12;
  char cVar13;
  char cVar14;
  ushort *puVar15;
  undefined4 *puVar16;
  byte bStack_37f;
  undefined2 local_37e;
  short local_37c;
  short local_37a;
  undefined4 local_378;
  int local_374;
  undefined4 local_370;
  undefined4 local_36c;
  undefined4 local_368;
  ushort local_364;
  int local_360;
  ushort local_35c;
  int local_358;
  ushort local_354;
  int local_350;
  ushort local_34c;
  int local_348;
  ushort local_344;
  int local_340;
  ushort local_33c;
  int local_338;
  ushort local_334;
  int local_330;
  ushort local_32c;
  int local_328;
  ushort local_324;
  undefined4 local_320;
  ushort local_31c [398];

  local_37c = *param_1;
  local_37a = param_1[1];
  FUN_0049c7a0(&local_37c,&local_320,&local_374);
  local_378 = 0;
  if (0 < local_374) {
    puVar15 = local_31c;
    do {
      uVar2 = *puVar15 & 0xfe;
      local_37c = uVar2 << 8;
      bVar3 = (byte)(*puVar15 >> 8);
      bStack_37f = bVar3 & 0xfe;
      local_37a = (ushort)bStack_37f << 8;
      cVar12 = (char)uVar2;
      cVar13 = bStack_37f + 2;
      local_37e = CONCAT11(cVar13,cVar12 + -2);
      uVar2 = local_37e;
      local_364 = local_37e;
      local_37e = CONCAT11(cVar13,cVar12);
      uVar5 = local_37e;
      local_35c = local_37e;
      cVar14 = cVar12 + '\x02';
      local_37e = CONCAT11(cVar13,cVar14);
      uVar6 = local_37e;
      local_354 = local_37e;
      local_37e = CONCAT11(bVar3,cVar14) & 0xfeff;
      uVar7 = local_37e;
      local_34c = local_37e;
      cVar13 = bStack_37f - 2;
      local_37e = CONCAT11(cVar13,cVar14);
      uVar8 = local_37e;
      local_344 = local_37e;
      local_37e = CONCAT11(cVar13,cVar12);
      uVar9 = local_37e;
      local_33c = local_37e;
      local_37e = CONCAT11(cVar13,cVar12 + -2);
      uVar10 = local_37e;
      local_334 = local_37e;
      local_37e = CONCAT11(bVar3,cVar12 + -2) & 0xfeff;
      uVar11 = local_37e;
      local_32c = local_37e;
      local_37e = CONCAT11(bVar3,cVar12) & 0xfeff;
      local_324 = local_37e;
      local_368 = ((uVar2 & 0xfe) * 2 | uVar2 & 0xfe00) * 4 + 0x8a03e4;
      local_360 = ((uVar5 & 0xfe) * 2 | uVar5 & 0xfe00) * 4 + 0x8a03e4;
      local_358 = ((uVar6 & 0xfe) * 2 | uVar6 & 0xfe00) * 4 + 0x8a03e4;
      local_350 = ((uVar7 & 0xfe) * 2 | uVar7 & 0xfe00) * 4 + 0x8a03e4;
      local_348 = ((uVar8 & 0xfe) * 2 | uVar8 & 0xfe00) * 4 + 0x8a03e4;
      local_340 = ((uVar9 & 0xfe) * 2 | uVar9 & 0xfe00) * 4 + 0x8a03e4;
      local_338 = ((uVar10 & 0xfe) * 2 | uVar10 & 0xfe00) * 4 + 0x8a03e4;
      local_330 = ((uVar11 & 0xfe) * 2 | uVar11 & 0xfe00) * 4 + 0x8a03e4;
      puVar16 = &local_368;
      local_328 = ((local_37e & 0xfe) * 2 | local_37e & 0xfe00) * 4 + 0x8a03e4;
      do {
        puVar1 = (uint *)*puVar16;
        if ((puVar1[2] & 0x3ff) == 0) {
          *(byte *)((int)puVar1 + 0xb) = *(byte *)((int)puVar1 + 0xb) & 0xf0 | param_2 + 1U;
          if (param_3 == '\x01') {
            *puVar1 = *puVar1 | 0x10000;
          }
          else {
            *puVar1 = *puVar1 & 0xfffeffff;
          }
        }
        puVar16 = puVar16 + 2;
      } while (puVar16 < &local_320);
      puVar15 = puVar15 + 4;
      local_378 = local_378 + 1;
    } while (local_378 < local_374);
  }
  if ((((((byte)level_flags & 4) != 0) && (param_3 == '\x01')) && (param_2 == player_tribe_num)) &&
     (cVar13 = get_empty_indexed_xy(2,0,0,7), cVar13 != '\0')) {
    local_368 = CONCAT31(local_368._1_3_,(char)((ushort)*param_1 >> 8)) & 0xfffffffe;
    local_368 = CONCAT22(local_368._2_2_,CONCAT11((char)((ushort)param_1[1] >> 8),(char)local_368))
                & 0xfffffeff;
    cVar14 = get_indexed_xy(cVar13,&local_36c,&local_370);
    while (cVar14 != '\0') {
      local_368._1_1_ = (char)(local_368 >> 8);
      uVar4 = (uint)local_378 >> 0x10;
      local_378._2_2_ = (undefined2)uVar4;
      local_378._0_2_ =
           CONCAT11((char)local_370 * '\x02' + local_368._1_1_,
                    (char)local_36c * '\x02' + (char)local_368);
      FUN_00450610(3,local_378);
      cVar14 = get_indexed_xy(cVar13,&local_36c,&local_370);
    }
    clear_indexed_xy(cVar13);
  }
  return;
}
