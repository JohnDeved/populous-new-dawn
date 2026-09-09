/* Ghidra 12.1.3 pseudocode; entry 004b9ef0; FUN_004b9ef0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_004b9ef0(uint param_1,ushort param_2,int param_3,int *param_4)

{
  byte bVar1;
  uint uVar2;
  uint uVar3;
  int iVar4;
  ushort *puVar5;
  ushort *puVar6;
  int iVar7;
  shape_entry *psVar8;
  byte *pbVar9;
  undefined1 local_c;
  undefined2 local_a;

  iVar4 = 0;
  iVar7 = 0;
  psVar8 = shapes_mem + (param_1 & 0xffff);
  bVar1 = psVar8->x1;
  pbVar9 = psVar8->ptr;
  local_a = param_2;
  for (uVar2 = (uint)(byte)psVar8->y1; uVar2 != 0; uVar2 = uVar2 - 1) {
    if (bVar1 != 0) {
      uVar3 = (uint)bVar1;
      puVar5 = (ushort *)(param_3 + 4 + iVar7 * 8);
      do {
        puVar6 = puVar5;
        if (*pbVar9 != 0) {
          *puVar5 = local_a;
          puVar6 = puVar5 + 4;
          iVar7 = iVar7 + 1;
          iVar4 = iVar4 + 1;
          *(uint *)(puVar5 + -2) = ((local_a & 0xfe) * 2 | local_a & 0xfe00) * 4 + 0x8a03e4;
          *(byte *)(puVar5 + 1) = *pbVar9;
        }
        local_a = CONCAT11(local_a._1_1_,(char)local_a + '\x02');
        pbVar9 = pbVar9 + 1;
        uVar3 = uVar3 - 1;
        puVar5 = puVar6;
      } while (uVar3 != 0);
    }
    local_c = (undefined1)param_2;
    local_a = CONCAT11(local_a._1_1_ + '\x02',local_c);
  }
  *param_4 = iVar4;
  return;
}
