/* Ghidra 12.1.3 pseudocode; entry 004c1b80; FUN_004c1b80.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


/* WARNING: Removing unreachable block (ram,0x004c1c41) */
/* WARNING: Removing unreachable block (ram,0x004c1c4b) */

void FUN_004c1b80(int param_1)

{
  char cVar1;
  undefined1 uVar2;
  undefined4 uVar3;
  unit_struct *puVar4;
  short sVar5;
  ushort uVar6;
  undefined2 uVar8;
  uint uVar7;
  uint uVar9;

  cVar1 = *(char *)(param_1 + 0x2f);
  uVar2 = *(undefined1 *)(param_1 + 0x2b);
  if ((*(byte *)(param_1 + 0xe) & 0x10) == 0) {
    empty_unit_function(param_1);
    *(undefined1 *)(param_1 + 0x2c) = uVar2;
    init_unit_class(param_1);
  }
  uVar3 = *(undefined4 *)(param_1 + 0x3d);
  *(undefined4 *)(param_1 + 0x6c) = uVar3;
  *(undefined2 *)(param_1 + 0x70) = *(undefined2 *)(param_1 + 0x41);
  puVar4 = game_state.tribes_array[cVar1].shaman;
  uVar8 = (undefined2)((uint)uVar3 >> 0x10);
  if (puVar4 == (unit_struct *)0x0) {
    if ((game_state.tribes_array[cVar1].field_0x93f & 8) == 0) {
      *(undefined1 *)(param_1 + 0x2d) = 4;
      *(uint *)(param_1 + 0xc) = *(uint *)(param_1 + 0xc) | 0x40000000;
      return;
    }
    if (*(char *)(param_1 + 0x2f) == player_tribe_num) {
      sVar5 = *(byte *)(param_1 + 0x2b) + 0x74;
    }
    else {
      sVar5 = *(byte *)(param_1 + 0x2b) + 0x8a;
    }
    FUN_0048a050(0,CONCAT22(uVar8,sVar5),1);
    *(undefined1 *)(param_1 + 0x2d) = 0;
    *(uint *)(param_1 + 0xc) = *(uint *)(param_1 + 0xc) | 0x40000000;
    return;
  }
  if (*(char *)(param_1 + 0x2f) == player_tribe_num) {
    sVar5 = *(byte *)(param_1 + 0x2b) + 0x74;
  }
  else {
    sVar5 = *(byte *)(param_1 + 0x2b) + 0x8a;
  }
  FUN_0048a050(puVar4,CONCAT22(uVar8,sVar5),0);
  if ((*(byte *)((int)&puVar4->flags_2 + 2) & 0x10) == 0) {
    *(undefined1 *)((int)&puVar4->loc_1_y + 1) = puVar4->state;
    empty_unit_function(puVar4);
    puVar4->state = 0x16;
    init_unit_class(puVar4);
  }
  uVar9 = (uint)(ushort)(*(short *)(param_1 + 0x3d) - (puVar4->pos).x);
  uVar7 = (uint)(ushort)(*(short *)(param_1 + 0x3f) - (puVar4->pos).y);
  if (0x7fff < uVar9) {
    uVar9 = uVar9 - 0x10000;
  }
  if (0x7fff < uVar7) {
    uVar7 = uVar7 - 0x10000;
  }
  uVar6 = calc_angle_quadrant(uVar9,-uVar7);
  uVar6 = uVar6 & 0x7ff;
  if ((*(byte *)&puVar4->flags_2 & 0x80) != 0) {
    puVar4->pos_x1 = uVar6;
  }
  *(ushort *)&puVar4->field_0x5d = uVar6;
  if ((*(byte *)((int)&puVar4->flags_2 + 1) & 0x80) != 0) {
    uVar6 = uVar6 + 0x400 & 0x7ff;
  }
  puVar4->maybe_shape_angle = uVar6;
  *(undefined1 *)(param_1 + 0xa8) = 1;
  if (*(char *)(param_1 + 0x7d) != '&') {
    *(undefined1 *)(param_1 + 0xa8) = 0;
  }
  *(undefined1 *)(param_1 + 0x2d) = 3;
  *(uint *)(param_1 + 0xc) = *(uint *)(param_1 + 0xc) | 0x40000000;
  return;
}
