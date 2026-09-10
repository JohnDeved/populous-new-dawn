/* Ghidra 12.1.3 pseudocode; entry 0048b2c0; add_object_to_rendering_queue_type_3.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


int add_object_to_rendering_queue_type_3(int param_1)

{
  int iVar1;
  int iVar2;
  undefined2 local_c;
  undefined2 local_a;
  undefined4 local_8;
  undefined2 local_4;

  iVar1 = (int)player_tribe_num;
  local_8._0_2_ = game_state.tribes_array[iVar1].x;
  local_8._2_2_ = game_state.tribes_array[iVar1].y;
  local_4 = *(undefined2 *)&game_state.tribes_array[iVar1].field_0x28;
  move_pos_angle_length
            (&local_8,CONCAT22((short)((uint)(iVar1 * 0xc65 + 0x89d1c8) >> 0x10),
                               game_state.tribes_array[iVar1].angle_1),0xfffff000);
  local_c = (undefined2)local_8;
  local_a = local_8._2_2_;
  iVar2 = calc_squared_distance_toroidal(param_1 + 0x3d,&local_c);
  iVar1 = -1;
  if (iVar2 < 0x9000001) {
    iVar1 = iVar2;
  }
  return iVar1;
}
