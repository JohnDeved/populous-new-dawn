/* Ghidra 12.1.3 pseudocode; entry 004010b0; sunlight_update_unit_landscape.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


int sunlight_update_unit_landscape
              (int param_1,undefined1 param_2,undefined1 param_3,undefined1 param_4)

{
  int iVar1;
  sunlight_struct *psVar2;
  undefined4 *puVar3;

  iVar1 = 0;
  if ((short)game_state._841988_2_ < 0x32) {
    psVar2 = game_state.sunlight_array;
    do {
      if (psVar2->enabled == '\0') break;
      iVar1 = iVar1 + 1;
      psVar2 = psVar2 + 1;
    } while (iVar1 < 0x32);
    psVar2->enabled = 1;
    psVar2->f1 = param_4;
    psVar2->f2 = param_2;
    psVar2->f3 = param_3;
    psVar2->x = *(undefined2 *)(param_1 + 0x3d);
    psVar2->z = *(undefined2 *)(param_1 + 0x41);
    psVar2->y = *(undefined2 *)(param_1 + 0x3f);
    psVar2->unit_index = *(undefined2 *)(param_1 + 0x24);
    *(uint *)(param_1 + 0xc) = *(uint *)(param_1 + 0xc) | 0x4000000;
    puVar3 = (undefined4 *)&psVar2->field8_0xc;
    for (iVar1 = 0xc; iVar1 != 0; iVar1 = iVar1 + -1) {
      *puVar3 = 0;
      puVar3 = puVar3 + 1;
    }
    *(undefined1 *)puVar3 = 0;
    game_state._841988_2_ = game_state._841988_2_ + 1;
    sunlight_update_landscape();
    iVar1 = 1;
  }
  return iVar1;
}
