/* Ghidra 12.1.3 pseudocode; entry 0050c5c0; process_firecloud.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void process_firecloud(int param_1)

{
  ushort uVar1;
  undefined4 local_a;
  ushort local_6;
  undefined2 local_4;

  local_a = CONCAT31(local_a._1_3_,(char)((ushort)*(undefined2 *)(param_1 + 0x3d) >> 8)) &
            0xfffffffe;
  uVar1 = CONCAT11((char)((ushort)*(undefined2 *)(param_1 + 0x3f) >> 8),(undefined1)local_a);
  local_a = CONCAT22(local_a._2_2_,uVar1) & 0xfffffeff;
  (&game_state.level_data[0].height)[((uVar1 & 0xfe) * 2 | uVar1 & 0xfe00) * 2] = 0;
  land_level_processing_1(local_a,2,1);
  FUN_0044f2f0(1,local_a,1,0xffffffff);
  local_6 = (ushort)local_a;
  local_4 = 0;
  local_a = CONCAT22((local_6 & 0xfffe) << 8,local_6) & 0xfffffefe;
  local_6 = local_6 & 0xfe00;
  alloc_unit(7,4,*(undefined1 *)(param_1 + 0x2f),(int)&local_a + 2);
  update_after_unit_alloc(param_1);
  return;
}
