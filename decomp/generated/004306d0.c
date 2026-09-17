/* Ghidra 12.1.3 pseudocode; entry 004306d0; surface_mem_downscale.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void surface_mem_downscale(int *param_1,byte param_2,byte param_3)

{
  int iVar1;
  int iVar2;
  int iVar3;
  byte *pbVar4;
  byte bVar5;
  uint uVar6;
  byte *pbVar7;
  uint uVar8;
  uint uVar9;
  undefined1 *puVar10;
  int local_38;
  uint local_24;
  int local_20;
  int local_1c;
  uint local_10;
  uint local_c;

  iVar2 = param_1[3];
  uVar6 = (uint)param_1[1] >> (param_2 & 0x1f);
  local_c = (uint)param_1[2] >> (param_3 & 0x1f);
  bVar5 = param_2 + param_3;
  if (local_c != 0) {
    local_38 = 0;
    do {
      if (uVar6 != 0) {
        local_1c = 0;
        local_20 = local_38;
        local_10 = uVar6;
        do {
          uVar8 = 0;
          uVar9 = 0;
          local_24 = 0;
          pbVar7 = (byte *)(*param_1 +
                           (local_1c << (param_2 & 0x1f)) + (local_38 << (param_3 & 0x1f)));
          for (iVar1 = 1 << (param_3 & 0x1f); iVar3 = 1 << (param_2 & 0x1f), pbVar4 = pbVar7,
              iVar1 != 0; iVar1 = iVar1 + -1) {
            for (; iVar3 != 0; iVar3 = iVar3 + -1) {
              uVar8 = uVar8 + pbVar4[2];
              uVar9 = uVar9 + pbVar4[1];
              local_24 = local_24 + *pbVar4;
              pbVar4 = pbVar4 + 3;
            }
            pbVar7 = pbVar7 + iVar2;
          }
          puVar10 = (undefined1 *)(*param_1 + local_20);
          local_20 = local_20 + 3;
          local_1c = local_1c + 3;
          *puVar10 = (char)(local_24 >> (bVar5 & 0x1f));
          local_10 = local_10 - 1;
          puVar10[1] = (char)(uVar9 >> (bVar5 & 0x1f));
          puVar10[2] = (char)(uVar8 >> (bVar5 & 0x1f));
        } while (local_10 != 0);
      }
      local_38 = local_38 + iVar2;
      local_c = local_c - 1;
    } while (local_c != 0);
  }
  return;
}
