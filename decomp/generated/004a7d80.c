/* Ghidra 12.1.3 pseudocode; entry 004a7d80; FUN_004a7d80.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


/* WARNING: Removing unreachable block (ram,0x004a7e2c) */
/* WARNING: Removing unreachable block (ram,0x004a7e36) */

void FUN_004a7d80(int param_1)

{
  ushort *puVar1;
  char cVar2;
  ushort uVar3;
  uint uVar4;
  undefined2 extraout_var;
  uint uVar5;

  cVar2 = *(char *)(param_1 + 0x2f);
  if ((*(byte *)(param_1 + 0xe) & 0x10) == 0) {
    empty_unit_function(param_1);
    *(undefined1 *)(param_1 + 0x2c) = 6;
    init_unit_class(param_1);
  }
  puVar1 = (ushort *)(param_1 + 0x3d);
  insert_unit_into_land_tile(param_1,puVar1);
  *puVar1 = (*puVar1 & 0xfe00) + 0x100;
  *(ushort *)(param_1 + 0x3f) = (*(ushort *)(param_1 + 0x3f) & 0xfe00) + 0x100;
  FUN_004a66c0(param_1,unit_type_array_scenery[*(byte *)(param_1 + 0x2b)].obj_related_index,
               CONCAT22(extraout_var,unit_type_array_scenery[*(byte *)(param_1 + 0x2b)].obj_index));
  uVar5 = (uint)(ushort)(*puVar1 - *(short *)&game_state.tribes_array[cVar2].field_0x911);
  uVar4 = (uint)(ushort)(*(short *)(param_1 + 0x3f) -
                        *(short *)&game_state.tribes_array[cVar2].field_0x913);
  if (0x7fff < uVar5) {
    uVar5 = uVar5 - 0x10000;
  }
  if (0x7fff < uVar4) {
    uVar4 = uVar4 - 0x10000;
  }
  uVar3 = calc_angle_quadrant(uVar5,-uVar4);
  *(uint *)(param_1 + 0xc) = *(uint *)(param_1 + 0xc) | 0x40;
  *(ushort *)(param_1 + 0x26) = uVar3 & 0x7ff;
  landscape_set_unit_shadow
            (param_1,(int)(char)unit_type_array_scenery[*(byte *)(param_1 + 0x2b)].field11_0x13,1);
  *(undefined1 *)(param_1 + 0x2d) = 1;
  *(uint *)(param_1 + 0xc) = *(uint *)(param_1 + 0xc) | 0x40000000;
  FUN_004a7eb0(param_1);
  return;
}
