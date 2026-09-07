/* Ghidra 12.1.3 pseudocode; entry 004a6cc0; FUN_004a6cc0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_004a6cc0(int param_1)

{
  ushort *puVar1;
  uint uVar2;
  uint uVar3;
  undefined2 extraout_var;
  undefined2 extraout_var_00;
  undefined2 uVar4;

  *(undefined1 *)(param_1 + 0x2f) = 0xff;
  puVar1 = (ushort *)(param_1 + 0x3d);
  FUN_004a8660(puVar1);
  *puVar1 = (*puVar1 & 0xfe00) + 0x100;
  *(ushort *)(param_1 + 0x3f) = (*(ushort *)(param_1 + 0x3f) & 0xfe00) + 0x100;
  FUN_004a8ce0(puVar1);
  uVar3 = game_state.pseudo_random_val * 0x24a1 + 0x24df;
  uVar2 = uVar3 >> 0xd;
  game_state.pseudo_random_val = uVar2 | uVar3 * 0x80000;
  *puVar1 = *puVar1 + (0x20 - ((ushort)uVar2 & 0x3f));
  uVar3 = game_state.pseudo_random_val * 0x24a1 + 0x24df;
  uVar2 = uVar3 >> 0xd;
  game_state.pseudo_random_val = uVar2 | uVar3 * 0x80000;
  *(short *)(param_1 + 0x3f) = *(short *)(param_1 + 0x3f) + (0x20 - ((ushort)uVar2 & 0x3f));
  insert_unit_into_land_tile(param_1,puVar1);
  uVar4 = extraout_var;
  if ((*(byte *)(param_1 + 0xe) & 0x10) == 0) {
    empty_unit_function(param_1);
    *(undefined1 *)(param_1 + 0x2c) = 4;
    init_unit_class(param_1);
    uVar4 = extraout_var_00;
  }
  uVar2 = *(uint *)(param_1 + 0x14);
  *(uint *)(param_1 + 0x14) = uVar2 | 0x100;
  *(uint *)(param_1 + 0x14) = uVar2 | 0x300;
  FUN_004a66c0(param_1,unit_type_array_scenery[*(byte *)(param_1 + 0x2b)].obj_related_index,
               CONCAT22(uVar4,unit_type_array_scenery[*(byte *)(param_1 + 0x2b)].obj_index));
  *(undefined2 *)(param_1 + 0x1c) = 0xffe0;
  FUN_004a79f0(param_1,(int)unit_type_array_scenery[*(byte *)(param_1 + 0x2b)].field2_0x4,0xffffffff
              );
  return;
}
