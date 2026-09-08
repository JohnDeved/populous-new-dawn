/* Ghidra 12.1.3 pseudocode; entry 0049a3f0; get_indexed_xy.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


char get_indexed_xy(byte param_1,uint *param_2,uint *param_3)

{
  int iVar1;
  byte bVar2;
  uint uVar3;
  uint uVar4;
  uint uVar5;
  short sVar6;
  char local_5;
  uint local_4;

  uVar3 = (uint)param_1;
  local_5 = '\x01';
  uVar5 = local_4;
  if (indexed_xy_ARRAY_0089290d[uVar3].type == '\x01') {
    switch(indexed_xy_ARRAY_0089290d[uVar3].field5_0x5) {
    case 0:
      local_4 = (int)indexed_xy_ARRAY_0089290d[uVar3].field6_0x6 -
                (uint)indexed_xy_ARRAY_0089290d[uVar3].field4_0x4;
      uVar5 = (uint)indexed_xy_ARRAY_0089290d[uVar3].field4_0x4;
      break;
    case 1:
      local_4 = (uint)indexed_xy_ARRAY_0089290d[uVar3].field4_0x4;
      uVar5 = local_4 - (int)indexed_xy_ARRAY_0089290d[uVar3].field6_0x6;
      break;
    case 2:
      local_4 = (uint)indexed_xy_ARRAY_0089290d[uVar3].field4_0x4 -
                (int)indexed_xy_ARRAY_0089290d[uVar3].field6_0x6;
      uVar5 = -(uint)indexed_xy_ARRAY_0089290d[uVar3].field4_0x4;
      break;
    case 3:
      local_4 = -(uint)indexed_xy_ARRAY_0089290d[uVar3].field4_0x4;
      uVar5 = (int)indexed_xy_ARRAY_0089290d[uVar3].field6_0x6 -
              (uint)indexed_xy_ARRAY_0089290d[uVar3].field4_0x4;
    }
    sVar6 = indexed_xy_ARRAY_0089290d[uVar3].field6_0x6 + 1;
    indexed_xy_ARRAY_0089290d[uVar3].field6_0x6 = sVar6;
    if ((int)((uint)indexed_xy_ARRAY_0089290d[uVar3].field4_0x4 * 2) <= (int)sVar6) {
      indexed_xy_ARRAY_0089290d[uVar3].field6_0x6 = 0;
      bVar2 = indexed_xy_ARRAY_0089290d[uVar3].field5_0x5 + 1;
      indexed_xy_ARRAY_0089290d[uVar3].field5_0x5 = bVar2;
      if (3 < bVar2) {
        indexed_xy_ARRAY_0089290d[uVar3].field5_0x5 = 0;
        bVar2 = indexed_xy_ARRAY_0089290d[uVar3].field4_0x4 + 1;
        indexed_xy_ARRAY_0089290d[uVar3].field4_0x4 = bVar2;
        if ((byte)indexed_xy_ARRAY_0089290d[uVar3].field_0x3 < bVar2) {
          local_5 = '\0';
        }
      }
    }
  }
  else if (indexed_xy_ARRAY_0089290d[uVar3].type == '\x02') {
    uVar4 = (uint)(char)mwsearch_mem[indexed_xy_ARRAY_0089290d[uVar3].field8_0xa + 0x80];
    uVar5 = (uint)(char)mwsearch_mem[indexed_xy_ARRAY_0089290d[uVar3].field8_0xa + 0x81];
    bVar2 = indexed_xy_ARRAY_0089290d[uVar3].field2_0x2;
    sVar6 = indexed_xy_ARRAY_0089290d[uVar3].field6_0x6 + 1;
    indexed_xy_ARRAY_0089290d[uVar3].field6_0x6 = sVar6;
    local_4 = (uint)indexed_xy_ARRAY_0089290d[uVar3].field2_0x2;
    if (*(short *)(mwsearch_mem + local_4 * 4 + 2) < sVar6) {
      bVar2 = indexed_xy_ARRAY_0089290d[uVar3].field2_0x2 + 1;
      indexed_xy_ARRAY_0089290d[uVar3].field2_0x2 = bVar2;
      if ((byte)indexed_xy_ARRAY_0089290d[uVar3].field_0x3 < bVar2) {
        local_5 = '\0';
        local_4 = uVar4;
      }
      else {
        indexed_xy_ARRAY_0089290d[uVar3].field6_0x6 = 0;
        iVar1 = (uint)bVar2 * 4;
        indexed_xy_ARRAY_0089290d[uVar3].field7_0x8 =
             *(short *)(mwsearch_mem + (uint)bVar2 * 4 + 2) * 2 + *(short *)(mwsearch_mem + iVar1);
        sVar6._0_1_ = indexed_xy_ARRAY_0089290d[uVar3].field4_0x4;
        sVar6._1_1_ = indexed_xy_ARRAY_0089290d[uVar3].field5_0x5;
        indexed_xy_ARRAY_0089290d[uVar3].field8_0xa =
             (short)((int)((int)sVar6 * (int)*(short *)(mwsearch_mem + iVar1 + 2) +
                          ((int)sVar6 * (int)*(short *)(mwsearch_mem + iVar1 + 2) >> 0x1f & 0x7ffU))
                    >> 0xb) * 2 + *(short *)(mwsearch_mem + iVar1);
        local_4 = uVar4;
      }
    }
    else {
      sVar6 = indexed_xy_ARRAY_0089290d[uVar3].field8_0xa + 2;
      indexed_xy_ARRAY_0089290d[uVar3].field8_0xa = sVar6;
      local_4 = uVar4;
      if (indexed_xy_ARRAY_0089290d[uVar3].field7_0x8 <= sVar6) {
        indexed_xy_ARRAY_0089290d[uVar3].field8_0xa = *(short *)(mwsearch_mem + (uint)bVar2 * 4);
      }
    }
  }
  if (local_5 != '\0') {
    *param_2 = local_4;
    *param_3 = uVar5;
  }
  return local_5;
}
