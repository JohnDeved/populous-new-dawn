/* Ghidra 12.1.3 pseudocode; entry 00443d30; FUN_00443d30.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


/* WARNING: Removing unreachable block (ram,0x00443fb1) */
/* WARNING: Removing unreachable block (ram,0x00443e02) */
/* WARNING: Removing unreachable block (ram,0x00443e0c) */
/* WARNING: Removing unreachable block (ram,0x00443fbb) */

void FUN_00443d30(int param_1,byte *param_2)

{
  char cVar1;
  byte bVar2;
  short sVar3;
  ushort uVar4;
  uint uVar5;
  int iVar6;
  uint uVar7;
  uint uVar8;
  uint uVar9;
  uint local_20;

  cVar1 = *(char *)(param_1 + 0xc22);
  bVar2 = *param_2;
  if (bVar2 == 0x6a) {
    *(undefined1 *)(param_1 + 0x8b1) = 0;
    *(undefined4 *)(param_1 + 0x8b3) = *(undefined4 *)(param_2 + 6);
    *(undefined4 *)(param_1 + 0x8b7) = *(undefined4 *)(param_2 + 6);
    *(undefined4 *)(param_1 + 0x8bb) = *(undefined4 *)(param_2 + 6);
    if (*(int *)(param_2 + 2) != 0) {
      *(undefined1 *)(param_1 + 0x8b1) = 1;
    }
    FUN_0047a550(9,param_1);
    return;
  }
  if (bVar2 < 0x6b) {
    return;
  }
  if (0x6c < bVar2) {
    return;
  }
  iVar6 = *(int *)(param_2 + 6);
  *(int *)(param_1 + 0x8b7) = iVar6;
  if (iVar6 == -1) {
    *(undefined4 *)(param_1 + 0x8b7) = *(undefined4 *)(param_1 + 0x8bb);
    goto LAB_00443f55;
  }
  sVar3 = game_state.tribes_array[player_tribe_num].angle_1;
  uVar8 = (uint)(ushort)(*(short *)(param_1 + 0x8b7) - *(short *)(param_1 + 0x8b3));
  uVar5 = (uint)(ushort)(*(short *)(param_1 + 0x8b9) - *(short *)(param_1 + 0x8b5));
  if (0x7fff < uVar8) {
    uVar8 = uVar8 - 0x10000;
  }
  if (0x7fff < uVar5) {
    uVar5 = uVar5 - 0x10000;
  }
  uVar4 = calc_angle_quadrant(uVar8,-uVar5);
  iVar6 = calc_distance_toroidal(param_1 + 0x8b3,param_1 + 0x8b7);
  uVar8 = ((uVar4 & 0x7ff) - (int)sVar3) - 0x200 & 0x7ff;
  uVar5 = (uint)((longlong)iVar6 * (longlong)maybe_cos[uVar8]) >> 0x10 |
          (int)((ulonglong)((longlong)iVar6 * (longlong)maybe_cos[uVar8]) >> 0x20) << 0x10;
  uVar7 = (uint)((longlong)iVar6 * (longlong)maybe_sin[uVar8]) >> 0x10 |
          (int)((ulonglong)((longlong)iVar6 * (longlong)maybe_sin[uVar8]) >> 0x20) << 0x10;
  uVar8 = uVar5;
  if ((int)uVar5 < 0) {
    uVar8 = -uVar5;
  }
  uVar9 = uVar7;
  if ((int)uVar7 < 0) {
    uVar9 = -uVar7;
  }
  if ((int)uVar8 < 0x2801) {
    if ((int)uVar9 < 0x2801) goto LAB_00443f55;
    if (0x2800 < (int)uVar8) goto LAB_00443ee6;
  }
  else {
LAB_00443ee6:
    uVar8 = 0x2800;
  }
  if (0x2800 < (int)uVar9) {
    uVar9 = 0x2800;
  }
  if ((int)uVar5 < 1) {
    uVar8 = -uVar8;
  }
  if ((int)uVar7 < 1) {
    uVar9 = -uVar9;
  }
  *(undefined4 *)(param_1 + 0x8b7) = *(undefined4 *)(param_1 + 0x8b3);
  move_pos_angle_length
            (param_1 + 0x8b7,
             CONCAT22((short)((uint)*(undefined4 *)(param_1 + 0x8b3) >> 0x10),sVar3 + 0x200) &
             0xffff07ff,uVar8);
  move_pos_angle_length(param_1 + 0x8b7,CONCAT22(sVar3 >> 0xf,sVar3 + 0x400) & 0xffff07ff,uVar9);
LAB_00443f55:
  *(undefined4 *)(param_1 + 0x8bb) = *(undefined4 *)(param_1 + 0x8b7);
  if (*param_2 == 0x6c) {
    if (*(int *)(param_2 + 2) != 0) {
      *(byte *)(param_1 + 0x8b1) = *(byte *)(param_1 + 0x8b1) | 1;
    }
    bVar2 = *(byte *)(param_1 + 0x8b1);
    uVar8 = (uint)(ushort)(*(short *)(param_1 + 0x8b7) - *(short *)(param_1 + 0x8b3));
    uVar5 = (uint)(ushort)(*(short *)(param_1 + 0x8b9) - *(short *)(param_1 + 0x8b5));
    if (0x7fff < uVar8) {
      uVar8 = uVar8 - 0x10000;
    }
    if (0x7fff < uVar5) {
      uVar5 = uVar5 - 0x10000;
    }
    iVar6 = calc_distance_toroidal(param_1 + 0x8b3,param_1 + 0x8b7);
    uVar4 = calc_angle_quadrant(uVar8,-uVar5);
    uVar8 = local_20 ^
            ((int)((short)game_state.tribes_array[player_tribe_num].angle_1 / 2) ^ local_20) & 0x3ff
    ;
    set_tribe_command((int)cVar1,(-(uint)((bVar2 & 1) == 0) & 0xfffffff4) + 0x79,
                      *(undefined4 *)(param_1 + 0x8b3),
                      (uVar8 ^ ((uVar4 & 0x7ff) / 2 << 10 ^ uVar8) & 0xffc00) & 0xfffff ^
                      ((int)(iVar6 + (iVar6 >> 0x1f & 7U)) >> 3) << 0x14);
  }
  return;
}
