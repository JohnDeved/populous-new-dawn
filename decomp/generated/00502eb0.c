/* Ghidra 12.1.3 pseudocode; entry 00502eb0; FUN_00502eb0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_00502eb0(unit_struct *param_1)

{
  short sVar1;
  uint uVar2;
  char cVar3;
  undefined2 uVar4;
  uint uVar5;
  int iVar6;
  undefined2 local_16;
  short local_8;
  short local_6;
  short local_4;

  uVar4 = calc_point_height((param_1->pos).x,(param_1->pos).y);
  param_1->flags_4 = param_1->flags_4 & 0xfffffbff;
  (param_1->pos).z = uVar4;
  uVar5 = pseudo_random * 0x24a1 + 0x24df;
  uVar2 = uVar5 >> 0xd;
  local_8 = ((ushort)uVar2 & 0x3f) + (param_1->pos).x + -0x20;
  uVar5 = (uVar2 | uVar5 * 0x80000) * 0x24a1 + 0x24df;
  uVar2 = uVar5 >> 0xd;
  pseudo_random = uVar2 | uVar5 * 0x80000;
  local_6 = ((ushort)uVar2 & 0x3f) + (param_1->pos).y + -0x20;
  local_4 = (param_1->pos).z + 0x6e;
  if ((((DAT_0089ce61 != '\0') && ((DAT_0089ce61 - 1U & param_1->class_counter) == 0)) &&
      (cVar3 = FUN_004edae0(7,3), cVar3 != '\0')) &&
     (iVar6 = alloc_unit_2(7,3,player_tribe_num,&local_8), iVar6 != 0)) {
    uVar5 = pseudo_random * 0x24a1 + 0x24df;
    uVar2 = uVar5 >> 0xd;
    pseudo_random = uVar2 | uVar5 * 0x80000;
    *(ushort *)(iVar6 + 0x5f) = ((ushort)uVar2 & 0x1f) + 4;
  }
  FUN_004f0f60(param_1);
  if ((*(byte *)&param_1->flags_4 & 0x10) == 0) {
    FUN_0048a050(param_1,0xc0,0x40);
  }
  sVar1 = *(short *)&param_1->coord_scale_3;
  *(short *)&param_1->coord_scale_3 = sVar1 + 1;
  if ((sVar1 < 0xbb9) &&
     (local_16 = CONCAT11((char)((ushort)(param_1->pos).y >> 8),
                          (char)((ushort)(param_1->pos).x >> 8)),
     (*(byte *)(landscape_height_array +
               ((&game_state.level_data[0].c_3)[((local_16 & 0xfe) * 2 | local_16 & 0xfe00) * 4] &
               0xf)) & 0x3e) == 0)) {
    return;
  }
  if (param_1 != PTR_008922d8) {
    FUN_004ef180(param_1);
  }
  return;
}
