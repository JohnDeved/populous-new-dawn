/* Ghidra 12.1.3 pseudocode; entry 004015f0; landscape_modification_sunlight_2.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void landscape_modification_sunlight_2(ushort param_1,int param_2,int param_3,short param_4)

{
  ushort uVar1;
  ushort uVar2;
  uint uVar3;
  uint uVar4;
  uint uVar5;
  uint uVar6;
  uint uVar7;
  uint uVar8;
  int iVar9;
  int iVar10;
  undefined4 unaff_EBP;
  undefined4 unaff_EDI;
  undefined2 local_2;

  iVar10 = 0;
  uVar3 = (param_1 & 0xfe) * 2 | param_1 & 0xfe00;
  if (((byte)((ushort)(&game_state.level_data[0].unit_index_2)[uVar3 * 2] >> 8) & 0xfc) < 0x7c) {
    local_2 = param_1 & 0xfefe;
    uVar4 = calc_point_height((uint)CONCAT21((short)((uint)unaff_EDI >> 0x10),(byte)local_2) << 8,
                              (uint)CONCAT21((short)((uint)unaff_EBP >> 0x10),local_2._1_1_) << 8);
    uVar6 = (uint)(byte)local_2 * 0x100 - (uint)*(ushort *)(param_2 + 4);
    uVar8 = uVar6;
    if ((int)uVar6 < 0) {
      uVar8 = -uVar6;
    }
    uVar7 = uVar6;
    if (((uVar8 & 0x8000) != 0) && (uVar7 = uVar8 - 0x10000, (int)uVar6 < 1)) {
      uVar7 = 0x10000 - uVar8;
    }
    uVar4 = (uVar4 & 0xffff) - (uint)*(ushort *)(param_2 + 8);
    uVar8 = uVar4;
    if ((int)uVar4 < 0) {
      uVar8 = -uVar4;
    }
    uVar6 = uVar4;
    if (((uVar8 & 0x8000) != 0) && (uVar6 = uVar8 - 0x10000, (int)uVar4 < 1)) {
      uVar6 = 0x10000 - uVar8;
    }
    uVar4 = (uint)local_2._1_1_ * 0x100 - (uint)*(ushort *)(param_2 + 6);
    uVar8 = uVar4;
    if ((int)uVar4 < 0) {
      uVar8 = -uVar4;
    }
    uVar5 = uVar4;
    if (((uVar8 & 0x8000) != 0) && (uVar5 = uVar8 - 0x10000, (int)uVar4 < 1)) {
      uVar5 = 0x10000 - uVar8;
    }
    iVar9 = uVar6 * uVar6 + uVar7 * uVar7 + uVar5 * uVar5;
    if (iVar9 < 0x24c000) {
      iVar10 = (uint)*(byte *)(param_2 + 2) * (((0x24c000 - iVar9) * 0x1f) / 0xc4000) * 3;
      iVar10 = (int)param_4 + ((int)(iVar10 + (iVar10 >> 0x1f & 0x7fU)) >> 7);
      if (0x1f < iVar10) {
        iVar10 = 0x1f;
      }
      uVar8 = (uint)((ushort)(&game_state.level_data[0].unit_index_2)[uVar3 * 2] >> 10);
      if (0x1f < (int)(iVar10 + uVar8)) {
        iVar10 = 0x1f - uVar8;
      }
      if (iVar10 < 0) {
        iVar10 = 0;
      }
    }
  }
  uVar1 = (&game_state.level_data[0].unit_index_2)[uVar3 * 2];
  uVar2 = (short)iVar10 * 0x400 + uVar1;
  (&game_state.level_data[0].unit_index_2)[uVar3 * 2] = (uVar2 ^ uVar1) & 0x3ff ^ uVar2;
  *(char *)(param_2 + 0xc + param_3) = (char)iVar10;
  return;
}
