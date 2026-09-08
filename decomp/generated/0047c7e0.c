/* Ghidra 12.1.3 pseudocode; entry 0047c7e0; draw_stored_polygons.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */
/* WARNING: Enum "_D3DRENDERSTATETYPE": Some values do not have unique names */

undefined4 __fastcall draw_stored_polygons(int param_1)

{
  uint *puVar1;
  float fVar2;
  int iVar3;
  uint uVar4;
  uint uVar5;
  undefined4 *puVar6;
  undefined4 *puVar7;
  float local_4;

  *(undefined4 *)(param_1 + 0x248046) = 0;
  FUN_00460970();
  FUN_00460970();
  FUN_00460970();
  puVar6 = (undefined4 *)(param_1 + 0x24502e);
  for (uVar4 = texture_objects_num * 4 + 4U >> 2; uVar4 != 0; uVar4 = uVar4 - 1) {
    *puVar6 = 0;
    puVar6 = puVar6 + 1;
  }
  _DAT_0059df80 = 0;
  *(undefined4 *)(param_1 + 0x248032) = 0;
  *(undefined4 *)(param_1 + 0x248036) = 0;
  _DAT_0059df7c = 1;
  if ((uint)*(ushort *)(param_1 + 0x1c) == *(uint *)(param_1 + 0x18)) {
    return 0;
  }
  puVar6 = (undefined4 *)(param_1 + 0x2a);
  local_4 = 0.999;
  *(undefined4 *)(param_1 + 0x24805a) = 0;
  *(int *)(param_1 + 0x10) = (int)*(undefined4 **)(param_1 + 0x20002a) + (-0x2a - param_1);
  if (puVar6 < *(undefined4 **)(param_1 + 0x20002a)) {
    do {
      iVar3 = (**(code **)*puVar6)();
      puVar7 = (undefined4 *)((int)puVar6 + iVar3);
      uVar5 = 0;
      uVar4 = puVar6[3];
      if ((uVar4 & 0x40) == 0) {
        if ((uVar4 & 2) == 0) {
          if ((uVar4 & 1) == 0) goto LAB_0047c903;
          iVar3 = *(int *)(ui_struct->d3 + 0x78);
        }
        else {
          iVar3 = *(int *)(ui_struct->d3 + 0x7c);
        }
        if (iVar3 == 1) {
          uVar5 = 4;
        }
        else if (iVar3 == 2) {
          uVar5 = 1;
        }
        else if (iVar3 == 4) {
          uVar5 = 2;
        }
      }
      else {
        uVar5 = 1;
        if (*(int *)(ui_struct->d3 + 0x78) == 1) {
          uVar5 = 5;
        }
      }
LAB_0047c903:
      fVar2 = local_4 - _DAT_0058f4ec;
      puVar6[4] = (uVar5 | uVar4 & 0xfffffff8) & DAT_005d56ec | DAT_005d56e8;
      puVar6[5] = local_4;
      *(int *)(param_1 + 0x24805a) = *(int *)(param_1 + 0x24805a) + 1;
      if (((puVar6[4] & 1) == 0) && ((puVar6[4] & 2) == 0)) {
        if (puVar6[6] == 0) {
          iVar3 = 0;
        }
        else {
          iVar3 = *(int *)(puVar6[6] + 0x4c);
        }
        puVar1 = (uint *)(param_1 + 0x24502e + iVar3 * 4);
        puVar6[1] = *puVar1;
        *puVar1 = (uint)puVar6;
        _DAT_0059df80 = _DAT_0059df80 + 1;
      }
      else {
        if (*(int *)(param_1 + 0x248032) == 0) {
          *(undefined4 **)(param_1 + 0x248036) = puVar6;
        }
        else {
          *(undefined4 **)(*(int *)(param_1 + 0x248032) + 8) = puVar6;
        }
        *(undefined4 **)(param_1 + 0x248032) = puVar6;
        puVar6[2] = 0;
      }
      puVar6 = puVar7;
      local_4 = fVar2;
    } while (puVar7 < *(undefined4 **)(param_1 + 0x20002a));
  }
  return 0;
}
