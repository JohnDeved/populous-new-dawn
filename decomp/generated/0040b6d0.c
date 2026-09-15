/* Ghidra 12.1.3 pseudocode; entry 0040b6d0; init_boat_hut.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void init_boat_hut(int param_1,int param_2)

{
  uint *puVar1;
  uint uVar2;
  undefined3 uVar3;
  char cVar4;
  char cVar5;
  byte *pbVar6;
  int iVar7;
  int iVar8;
  undefined4 local_330;
  int local_32c;
  undefined4 local_328;
  undefined4 local_324;
  undefined1 local_320 [6];
  byte local_31a [794];

  iVar8 = 0;
  if (param_2 == 0) {
    iVar7 = (int)(char)(&objs0_mem[*(short *)(param_1 + 0x33)].shapes_index)
                       [(short)((int)((int)*(short *)(param_1 + 0x26) +
                                     ((int)*(short *)(param_1 + 0x26) >> 0x1f & 0x1ffU)) >> 9)];
    local_330 = CONCAT31(local_330._1_3_,(char)((ushort)*(undefined2 *)(param_1 + 0x7a) >> 8)) &
                0xfffffffe;
    local_330 = CONCAT22(local_330._2_2_,
                         CONCAT11((char)((ushort)*(undefined2 *)(param_1 + 0x7c) >> 8),
                                  (char)local_330)) & 0xfffffeff;
    local_330._0_2_ =
         CONCAT11(local_330._1_1_ - shapes_mem[iVar7].y2,(char)local_330 - shapes_mem[iVar7].x2);
    FUN_004b9ef0(iVar7,local_330,local_320,&local_32c);
    if (0 < local_32c) {
      pbVar6 = local_31a;
      do {
        if ((*pbVar6 & 0x10) != 0) break;
        pbVar6 = pbVar6 + 8;
        iVar8 = iVar8 + 1;
      } while (iVar8 < local_32c);
    }
  }
  cVar4 = get_empty_indexed_xy(2,0,0,4);
  if (cVar4 != '\0') {
    local_330 = (CONCAT11((char)((ushort)*(undefined2 *)(param_1 + 0x3f) >> 8),
                          (char)((ushort)*(undefined2 *)(param_1 + 0x3d) >> 8)) & 0xfffe) &
                0xfffffeff;
    cVar5 = get_indexed_xy(cVar4,&local_324,&local_328);
    uVar2 = local_330;
    while (cVar5 != '\0') {
      local_330._0_1_ = (char)uVar2;
      cVar5 = (char)local_324 * '\x02' + (char)local_330;
      local_330._0_2_ = (undefined2)uVar2;
      local_330._0_3_ = CONCAT12(cVar5,(undefined2)local_330);
      uVar3 = (undefined3)local_330;
      local_330._1_1_ = (char)(uVar2 >> 8);
      local_330 = CONCAT13((char)local_328 * '\x02' + local_330._1_1_,uVar3);
      puVar1 = &game_state.level_data[0].flags +
               ((local_330._2_2_ & 0xfe) * 2 | local_330._2_2_ & 0xfe00);
      *puVar1 = *puVar1 & 0xfeffffff;
      cVar5 = get_indexed_xy(cVar4,&local_324,&local_328);
      uVar2 = local_330;
    }
    clear_indexed_xy(cVar4);
  }
  return;
}
