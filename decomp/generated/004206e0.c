/* Ghidra 12.1.3 pseudocode; entry 004206e0; set_landscape_texture_minimap_full.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void set_landscape_texture_minimap_full(int param_1,int param_2)

{
  longlong lVar1;
  ushort uVar2;
  undefined1 uVar3;
  int iVar4;
  undefined1 uVar5;
  uint uVar6;
  int iVar7;
  undefined1 *puVar8;
  int iVar9;
  undefined2 local_12;
  int local_10;

  uVar3 = DAT_0089c6f5;
  if ((landscape_texture_minimap_full == (void *)0x0) &&
     (landscape_texture_minimap_full = _malloc(param_2 * param_1),
     landscape_texture_minimap_full == (void *)0x0)) {
    landscape_flags_2 = landscape_flags_2 | 1;
  }
  else {
    landscape_flags_2 = landscape_flags_2 & 0xfffffffe;
  }
  if ((landscape_flags_2 & 1) == 0) {
    puVar8 = (undefined1 *)((param_2 + -1) * param_1 + (int)landscape_texture_minimap_full);
    lVar1 = (longlong)param_2;
    local_10 = 0;
    for (; param_2 != 0; param_2 = param_2 + -1) {
      iVar4 = 0;
      local_12 = (ushort)(byte)((uint)local_10 >> 0x10) << 8;
      for (iVar9 = param_1; iVar9 != 0; iVar9 = iVar9 + -1) {
        uVar2 = local_12 >> 8;
        local_12 = CONCAT11((char)uVar2,(char)((uint)iVar4 >> 0x10));
        uVar6 = (local_12 & 0xfe) * 2 | local_12 & 0xfe00;
        if ((((byte)level_flags & 4) == 0) ||
           ((*(byte *)(&game_state.level_data[0].flags + uVar6) & 8) != 0)) {
          if ((&game_state.level_data[0].cliff_index)[uVar6 * 4] == '\0') {
            uVar5 = *(undefined1 *)
                     ((short)(&game_state.level_data[0].height)[uVar6 * 2] * 0x100 + 0x7840 +
                     bigf0_mem);
          }
          else {
            iVar7 = (short)(&game_state.level_data[0].height)[uVar6 * 2] + 0x8c;
            if (0x47f < iVar7) {
              iVar7 = 0x47f;
            }
            uVar5 = *(undefined1 *)
                     (iVar7 * 0x100 + bigf0_mem +
                     (uint)(byte)(&game_state.level_data[0].brightness)[uVar6 * 4]);
          }
          *puVar8 = uVar5;
        }
        else {
          *puVar8 = uVar3;
        }
        iVar4 = iVar4 + (int)(0x1000000 / (longlong)param_1);
        puVar8 = puVar8 + 1;
      }
      puVar8 = puVar8 + param_1 * -2;
      local_10 = local_10 + (int)(0x1000000 / lVar1);
    }
    landscape_flags_2 = landscape_flags_2 & 0xfffffffd;
  }
  return;
}
