/* Ghidra 12.1.3 pseudocode; entry 004ee190; sunlight_update_unit.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void sunlight_update_unit(int param_1)

{
  int iVar1;
  sunlight_struct *psVar2;

  if ((*(byte *)(param_1 + 0xf) & 4) != 0) {
    iVar1 = 0;
    psVar2 = game_state.sunlight_array;
    while ((psVar2->enabled & psVar2->unit_index == *(short *)(param_1 + 0x24)) == 0) {
      iVar1 = iVar1 + 1;
      psVar2 = psVar2 + 1;
      if (0x31 < iVar1) {
        return;
      }
    }
    landscape_modification_sunlight_item(psVar2);
  }
  return;
}
