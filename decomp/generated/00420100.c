/* Ghidra 12.1.3 pseudocode; entry 00420100; set_landscape_minimap_texture.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void set_landscape_minimap_texture(int param_1,int param_2)

{
  byte bVar1;
  int iVar2;
  int iVar3;
  undefined4 *puVar4;
  uint uVar5;
  undefined4 *puVar6;
  uint uVar7;
  undefined4 *puVar8;
  undefined4 *puVar9;
  undefined4 *puVar10;
  undefined4 *puVar11;
  undefined4 local_10;

  puVar9 = landscape_texture_minimap_rect;
  puVar6 = landscape_texture_minimap_full;
  local_10._0_2_ =
       CONCAT11((char)((ushort)game_state.tribes_array[player_tribe_num].y >> 8),
                (char)((ushort)game_state.tribes_array[player_tribe_num].x >> 8)) & 0xfefe;
  bVar1 = (char)((ushort)local_10 >> 8) + 0x80;
  local_10._0_2_ = CONCAT11(bVar1,(char)local_10 + -0x80);
  local_10 = (undefined4 *)(uint)(ushort)local_10;
  uVar7 = param_1 - ((int)(((uint)local_10 & 0xff) * param_1) >> 8);
  iVar2 = (int)((uint)bVar1 * param_2) >> 8;
  if (0 < iVar2) {
    puVar8 = (undefined4 *)((param_2 - iVar2) * param_1 + (int)landscape_texture_minimap_full);
    puVar4 = (undefined4 *)((int)landscape_texture_minimap_rect + uVar7);
    local_10 = (undefined4 *)iVar2;
    do {
      puVar10 = puVar8;
      puVar11 = puVar4;
      for (uVar5 = param_1 - uVar7 >> 2; uVar5 != 0; uVar5 = uVar5 - 1) {
        *puVar11 = *puVar10;
        puVar10 = puVar10 + 1;
        puVar11 = puVar11 + 1;
      }
      for (uVar5 = param_1 - uVar7 & 3; uVar5 != 0; uVar5 = uVar5 - 1) {
        *(undefined1 *)puVar11 = *(undefined1 *)puVar10;
        puVar10 = (undefined4 *)((int)puVar10 + 1);
        puVar11 = (undefined4 *)((int)puVar11 + 1);
      }
      puVar8 = (undefined4 *)((int)puVar8 + param_1);
      local_10 = (undefined4 *)((int)local_10 + -1);
      puVar4 = puVar4 + 0x40;
    } while (local_10 != (undefined4 *)0x0);
  }
  if (0 < iVar2) {
    puVar8 = (undefined4 *)((int)puVar6 + (((param_2 - iVar2) + 1) * param_1 - uVar7));
    iVar3 = iVar2;
    puVar4 = puVar9;
    do {
      puVar10 = puVar8;
      puVar11 = puVar4;
      for (uVar5 = uVar7 >> 2; uVar5 != 0; uVar5 = uVar5 - 1) {
        *puVar11 = *puVar10;
        puVar10 = puVar10 + 1;
        puVar11 = puVar11 + 1;
      }
      for (uVar5 = uVar7 & 3; uVar5 != 0; uVar5 = uVar5 - 1) {
        *(undefined1 *)puVar11 = *(undefined1 *)puVar10;
        puVar10 = (undefined4 *)((int)puVar10 + 1);
        puVar11 = (undefined4 *)((int)puVar11 + 1);
      }
      puVar8 = (undefined4 *)((int)puVar8 + param_1);
      iVar3 = iVar3 + -1;
      puVar4 = puVar4 + 0x40;
    } while (iVar3 != 0);
  }
  if (iVar2 < param_2) {
    puVar4 = (undefined4 *)((int)puVar9 + uVar7 + iVar2 * 0x100);
    iVar3 = param_2 - iVar2;
    local_10 = puVar6;
    do {
      puVar8 = local_10;
      puVar10 = puVar4;
      for (uVar5 = param_1 - uVar7 >> 2; uVar5 != 0; uVar5 = uVar5 - 1) {
        *puVar10 = *puVar8;
        puVar8 = puVar8 + 1;
        puVar10 = puVar10 + 1;
      }
      for (uVar5 = param_1 - uVar7 & 3; uVar5 != 0; uVar5 = uVar5 - 1) {
        *(undefined1 *)puVar10 = *(undefined1 *)puVar8;
        puVar8 = (undefined4 *)((int)puVar8 + 1);
        puVar10 = (undefined4 *)((int)puVar10 + 1);
      }
      puVar4 = puVar4 + 0x40;
      local_10 = (undefined4 *)((int)local_10 + param_1);
      iVar3 = iVar3 + -1;
    } while (iVar3 != 0);
  }
  if (iVar2 < param_2) {
    puVar6 = (undefined4 *)((int)puVar6 - uVar7);
    param_2 = param_2 - iVar2;
    puVar9 = puVar9 + iVar2 * 0x40;
    do {
      puVar6 = (undefined4 *)(param_1 + (int)puVar6);
      puVar4 = puVar6;
      puVar8 = puVar9;
      for (uVar5 = uVar7 >> 2; uVar5 != 0; uVar5 = uVar5 - 1) {
        *puVar8 = *puVar4;
        puVar4 = puVar4 + 1;
        puVar8 = puVar8 + 1;
      }
      for (uVar5 = uVar7 & 3; uVar5 != 0; uVar5 = uVar5 - 1) {
        *(undefined1 *)puVar8 = *(undefined1 *)puVar4;
        puVar4 = (undefined4 *)((int)puVar4 + 1);
        puVar8 = (undefined4 *)((int)puVar8 + 1);
      }
      param_2 = param_2 + -1;
      puVar9 = puVar9 + 0x40;
    } while (param_2 != 0);
  }
  return;
}
