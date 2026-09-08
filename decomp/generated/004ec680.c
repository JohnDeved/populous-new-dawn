/* Ghidra 12.1.3 pseudocode; entry 004ec680; clear_gc_unit_related_coords.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void clear_gc_unit_related_coords(int param_1)

{
  byte bVar1;
  byte bVar2;
  byte bVar3;
  byte bVar4;
  int iVar5;
  short *psVar6;

  if (param_1 != 0) {
    bVar1 = game_state.unit_related_array_1[param_1].coord_1;
    bVar2 = game_state.unit_related_array_1[param_1].coord_3;
    psVar6 = (short *)&game_state.field_0xb8a61;
    bVar3 = game_state.unit_related_array_1[param_1].coord_2;
    iVar5 = 8;
    bVar4 = game_state.unit_related_array_1[param_1].coord_4;
    do {
      if ((((*psVar6 != 0) && (*(byte *)(psVar6 + 1) == (bVar1 & 0xfe))) &&
          (*(byte *)((int)psVar6 + 3) == (bVar3 & 0xfe))) &&
         ((*(byte *)(psVar6 + 3) == (bVar2 & 0xfe) && (*(byte *)((int)psVar6 + 7) == (bVar4 & 0xfe))
          ))) {
        *psVar6 = 0;
      }
      psVar6 = psVar6 + 5;
      iVar5 = iVar5 + -1;
    } while (iVar5 != 0);
  }
  return;
}
