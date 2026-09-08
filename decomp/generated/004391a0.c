/* Ghidra 12.1.3 pseudocode; entry 004391a0; FUN_004391a0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


bool FUN_004391a0(int param_1)

{
  short *psVar1;
  uint uVar2;
  uint uVar3;

  if ((*(ushort *)(param_1 + 0x76) & 0x10) != 0) {
    *(ushort *)(param_1 + 0x76) = *(ushort *)(param_1 + 0x76) & 0xffef;
    FUN_004d4ee0(param_1);
  }
  if ((*(byte *)(param_1 + 0x2e) & 0x1f) == 0) {
    uVar3 = game_state.pseudo_random_val * 0x24a1 + 0x24df;
    uVar2 = uVar3 >> 0xd;
    game_state.pseudo_random_val = uVar2 | uVar3 * 0x80000;
    update_gs_unit_related_array_item(param_1);
    uVar3 = *(uint *)(param_1 + 0xc);
    *(uint *)(param_1 + 0xc) = uVar3 | 0x80;
    *(uint *)(param_1 + 0xc) = uVar3 | 0x1080;
    *(ushort *)(param_1 + 0x57) = (ushort)uVar2 & 0x7ff;
  }
  psVar1 = (short *)(param_1 + 0x70);
  *psVar1 = *psVar1 + -1;
  return *psVar1 == 0;
}
