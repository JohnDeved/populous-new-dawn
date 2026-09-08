/* Ghidra 12.1.3 pseudocode; entry 004a6e20; FUN_004a6e20.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_004a6e20(int param_1)

{
  unit_struct *puVar1;
  bool bVar2;
  int iVar3;
  undefined2 unaff_retaddr;
  undefined2 uStack_2;

  bVar2 = true;
  if ((*(char *)(param_1 + 0x2b) == '\t') && (*(char *)(param_1 + 0x2c) != '\f')) {
    iVar3 = 0;
    uStack_2 = CONCAT11((char)((ushort)*(undefined2 *)(param_1 + 0x3f) >> 8),
                        (char)((ushort)*(undefined2 *)(param_1 + 0x3d) >> 8));
    for (puVar1 = unit_land_array
                  [(short)(&game_state.level_data[0].unit_index)
                          [((uStack_2 & 0xfe) * 2 | uStack_2 & 0xfe00) * 2]];
        puVar1 != (unit_struct *)0x0; puVar1 = unit_land_array[puVar1->next_unit_index]) {
      if ((puVar1->unit_class == '\x05') && (puVar1->unit_type == '\t')) {
        iVar3 = iVar3 + 1;
      }
    }
    if (iVar3 < 2) {
      bVar2 = false;
      *(uint *)(param_1 + 0xc) = *(uint *)(param_1 + 0xc) & 0xffefffff;
      empty_unit_function(param_1);
      *(undefined1 *)(param_1 + 0x2c) = 0xc;
      init_unit_class(param_1);
    }
  }
  if (bVar2) {
    update_after_unit_alloc(param_1);
    FUN_0044fad0(CONCAT22(unaff_retaddr,
                          CONCAT11((char)((ushort)*(undefined2 *)(param_1 + 0x3f) >> 8),
                                   (char)((ushort)*(undefined2 *)(param_1 + 0x3d) >> 8))) &
                 0xfffffefe);
    if ((unit_type_array_scenery[*(byte *)(param_1 + 0x2b)].flags & 1) != 0) {
      landscape_set_unit_shadow(param_1,0,0);
    }
  }
  return;
}
