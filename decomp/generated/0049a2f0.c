/* Ghidra 12.1.3 pseudocode; entry 0049a2f0; get_empty_indexed_xy.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


byte get_empty_indexed_xy(char param_1,ushort param_2,byte param_3,byte param_4)

{
  int iVar1;
  short sVar2;
  bool bVar3;
  byte bVar4;
  indexed_xy *piVar5;

  bVar4 = 1;
  bVar3 = false;
  piVar5 = indexed_xy_ARRAY_0089290d + 1;
  do {
    if (piVar5->enabled == '\0') {
      bVar3 = true;
      break;
    }
    bVar4 = bVar4 + 1;
    piVar5 = piVar5 + 1;
  } while (bVar4 < 0x10);
  if (bVar3) {
    piVar5->enabled = 1;
    piVar5->type = param_1;
    if (0x1f < param_3) {
      param_3 = 0x1f;
    }
    if (param_4 < param_3) {
      param_4 = param_3;
    }
    if (0x1f < param_4) {
      param_4 = 0x1f;
    }
    if (param_1 == '\x01') {
      piVar5->field4_0x4 = param_3;
      piVar5->field2_0x2 = param_3;
      piVar5->field_0x3 = param_4;
      piVar5->field6_0x6 = 0;
      piVar5->field5_0x5 = 3;
    }
    else if (param_1 == '\x02') {
      piVar5->field2_0x2 = param_3;
      piVar5->field_0x3 = param_4;
      piVar5->field4_0x4 = (char)(param_2 & 0x7ff);
      piVar5->field5_0x5 = (char)((param_2 & 0x7ff) >> 8);
      piVar5->field6_0x6 = 0;
      iVar1 = (uint)piVar5->field2_0x2 * 4;
      piVar5->field7_0x8 =
           *(short *)(mwsearch_mem + iVar1 + 2) * 2 + *(short *)(mwsearch_mem + iVar1);
      sVar2._0_1_ = piVar5->field4_0x4;
      sVar2._1_1_ = piVar5->field5_0x5;
      piVar5->field8_0xa =
           (short)((int)((int)*(short *)(mwsearch_mem + iVar1 + 2) * (int)sVar2 +
                        ((int)*(short *)(mwsearch_mem + iVar1 + 2) * (int)sVar2 >> 0x1f & 0x7ffU))
                  >> 0xb) * 2 + *(short *)(mwsearch_mem + iVar1);
    }
  }
  return !bVar3 - 1U & bVar4;
}
