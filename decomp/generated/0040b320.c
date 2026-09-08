/* Ghidra 12.1.3 pseudocode; entry 0040b320; alloc_building_damage_smoke.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


undefined4 alloc_building_damage_smoke(int param_1)

{
  char cVar1;
  int iVar2;
  undefined4 uVar3;
  short sVar4;
  char *pcVar5;
  uint uVar6;
  uint uVar7;
  undefined4 local_c;
  short local_8;
  short sStack_6;
  undefined2 local_4;

  uVar7 = 0;
  local_c = 0;
  cVar1 = (&objs0_mem[*(short *)(param_1 + 0x33)].shapes_index)
          [(short)((int)((int)*(short *)(param_1 + 0x26) +
                        ((int)*(short *)(param_1 + 0x26) >> 0x1f & 0x1ffU)) >> 9)];
  pcVar5 = &shapes_mem[cVar1].field_0x1c;
  do {
    if (*pcVar5 == '\0') break;
    pcVar5 = pcVar5 + 3;
    uVar7 = uVar7 + 1;
  } while ((int)uVar7 < 6);
  if (uVar7 != 0) {
    if (6 < (int)uVar7) {
      uVar7 = 6;
    }
    uVar6 = game_state.pseudo_random_val * 0x24a1 + 0x24df;
    game_state.pseudo_random_val = uVar6 >> 0xd | uVar6 * 0x80000;
    iVar2 = (game_state.pseudo_random_val % uVar7) * 3;
    local_8 = (ushort)(byte)(&shapes_mem[cVar1].field_0x1a)[iVar2] * 0x20 +
              *(short *)(param_1 + 0x7a) + (ushort)(byte)shapes_mem[cVar1].x2 * -0x100;
    sVar4 = (ushort)(byte)(&shapes_mem[cVar1].field_0x1c)[iVar2] * 0x20 +
            *(short *)(param_1 + 0x7c) + (ushort)(byte)shapes_mem[cVar1].y2 * -0x100;
    uVar3 = CONCAT22(sStack_6,local_8);
    sStack_6 = sVar4;
    local_4 = calc_point_height(uVar3,CONCAT22(local_4,sVar4));
    local_c = alloc_unit(7,0x4c,*(undefined1 *)(param_1 + 0x2f),&local_8);
  }
  return local_c;
}
