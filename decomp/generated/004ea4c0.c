/* Ghidra 12.1.3 pseudocode; entry 004ea4c0; get_gc_coords_unit_related_struct.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


bool get_gc_coords_unit_related_struct(int param_1,int param_2,short *param_3)

{
  int iVar1;
  bool bVar2;
  byte local_2;
  byte bStack_1;

  bVar2 = (int)(uint)(byte)game_state.unit_related_array_1[param_1].sub_array_counter <= param_2;
  if (bVar2) {
    local_2 = game_state.unit_related_array_1[param_1].coord_1;
    bStack_1 = game_state.unit_related_array_1[param_1].coord_2;
  }
  else {
    iVar1 = param_1 * 0x6d + 0x955c29 + param_2 * 4;
    local_2 = *(byte *)(iVar1 + 0xc);
    bStack_1 = *(byte *)(iVar1 + 0xd);
  }
  bStack_1 = bStack_1 & 0xfe;
  *param_3 = ((local_2 & 0xfe) + 1) * 0x100;
  param_3[1] = (bStack_1 + 1) * 0x100;
  return !bVar2;
}
