/* Ghidra 12.1.3 pseudocode; entry 004783a0; FUN_004783a0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_004783a0(int param_1,int param_2,int param_3,undefined2 *param_4)

{
  int iVar1;
  int iVar2;
  uint uVar3;
  undefined4 uVar4;
  uint local_c;
  undefined4 local_8;
  undefined2 local_4;

  local_8 = *(undefined4 *)(param_1 + 0x3d);
  local_4 = *(undefined2 *)(param_1 + 0x41);
  switch(*(undefined1 *)(param_1 + 0x80 + param_3)) {
  case 0:
    local_c = 0;
    break;
  case 1:
    local_c = 0x400;
    break;
  case 2:
    local_c = 0x200;
    break;
  case 3:
    local_c = 0x600;
  }
  if (param_2 < 1) {
    if (param_2 < 0) {
      uVar3 = game_state.pseudo_random_val * 0x24a1 + 0x24df;
      game_state.pseudo_random_val = uVar3 >> 0xd | uVar3 * 0x80000;
      uVar4 = 0xec0;
      local_c = (local_c - game_state.pseudo_random_val % 0x11c) - 0x8e;
    }
    else {
      uVar4 = 0xd40;
      local_c = local_c - 0x8e & 0x7ff;
    }
  }
  else {
    iVar1 = game_state.tribes_array[param_3].num_persons;
    iVar1 = (int)(iVar1 + (iVar1 >> 0x1f & 7U)) >> 3;
    if (iVar1 < 6) {
      iVar1 = 6;
    }
    iVar2 = (param_2 + -1) / iVar1;
    move_pos_angle_length
              (&local_8,(((param_2 + -1) % iVar1) * (int)(0xaa / (longlong)iVar1) + local_c) - 0x55
                        & 0x7ff,0xa00);
    uVar4 = CONCAT22((short)((uint)iVar2 >> 0x10),(short)iVar2 * 0xa0);
  }
  move_pos_angle_length(&local_8,local_c,uVar4);
  *param_4 = (undefined2)local_8;
  param_4[1] = local_8._2_2_;
  return;
}
