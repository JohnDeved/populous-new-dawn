/* Ghidra 12.1.3 pseudocode; entry 004e05e0; FUN_004e05e0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_004e05e0(int param_1)

{
  uint uVar1;
  uint uVar2;
  unit_struct *puVar3;
  unit_struct *puVar4;
  undefined2 local_2;

  *(uint *)(param_1 + 0xc) = *(uint *)(param_1 + 0xc) | 0x100000;
  *(undefined2 *)(param_1 + 0x5f) = 0;
  *(undefined1 *)(param_1 + 0x2d) = 0;
  FUN_00445750(param_1,0,0);
  uVar1 = *(uint *)(param_1 + 0x10);
  uVar2 = *(uint *)(param_1 + 0xc);
  *(uint *)(param_1 + 0x10) = uVar1 | 0x80;
  *(uint *)(param_1 + 0xc) = uVar2 | 0x4000;
  *(uint *)(param_1 + 0x10) = uVar1 | 0x480;
  *(uint *)(param_1 + 0xc) = uVar2 | 0x84000;
  if (*(ushort *)(param_1 + 0x9f) != 0) {
    puVar3 = unit_land_array[*(ushort *)(param_1 + 0x9f)];
    puVar4 = (unit_struct *)0x0;
    if (((*(byte *)&puVar3->flags_2 & 1) == 0) && (puVar3->unit_class != '\0')) {
      puVar4 = puVar3;
    }
    if (puVar4 != (unit_struct *)0x0) {
      puVar3 = unit_land_array[*(short *)(param_1 + 0x72)];
      puVar4->flags_3 = puVar4->flags_3 | 8;
      FUN_004e93f0(&puVar4->vec2,&puVar4->pos,0x28,(int)*(short *)&puVar3->field_0x5d);
    }
    FUN_00466c80(param_1,1);
  }
  if ((*(byte *)(param_1 + 0xe) & 0x80) != 0) {
    local_2 = CONCAT11((char)((ushort)*(undefined2 *)(param_1 + 0x3f) >> 8),
                       (char)((ushort)*(undefined2 *)(param_1 + 0x3d) >> 8));
    puVar3 = unit_land_array[*(short *)(param_1 + 0x72)];
    puVar4 = unit_land_array
             [(ushort)(&game_state.level_data[0].unit_index_2)
                      [((local_2 & 0xfe) * 2 | local_2 & 0xfe00) * 2] & 0x3ff];
    remove_person_from_hut(puVar4,param_1);
    puVar4->field_0xaf = puVar3->tribe_index;
    *(short *)&puVar4->field_0x9e =
         *(short *)&unit_type_array_building[(byte)puVar4->unit_type].field_0x2e + 0x10;
    *(undefined2 *)(param_1 + 0x1c) = 0;
  }
  uVar1 = *(uint *)(param_1 + 0xc);
  *(uint *)(param_1 + 0xc) = uVar1 | 0x4000;
  *(uint *)(param_1 + 0xc) = uVar1 | 0x84000;
  *(uint *)(param_1 + 0x10) = *(uint *)(param_1 + 0x10) | 0x400;
  *(undefined2 *)(param_1 + 0x43) = 0;
  *(undefined2 *)(param_1 + 0x47) = 0;
  *(undefined2 *)(param_1 + 0x45) = 0;
  FUN_004d3ea0(param_1);
  return;
}
