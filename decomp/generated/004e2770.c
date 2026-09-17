/* Ghidra 12.1.3 pseudocode; entry 004e2770; FUN_004e2770.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_004e2770(int param_1)

{
  uint uVar1;
  int iVar2;
  undefined2 local_2;

  uVar1 = *(uint *)(param_1 + 0xc);
  *(uint *)(param_1 + 0xc) = uVar1 | 0x100000;
  *(uint *)(param_1 + 0xc) = uVar1 | 0x300000;
  *(uint *)(param_1 + 0xc) = uVar1 | 0x300200;
  *(uint *)(param_1 + 0xc) = uVar1 | 0x310200;
  FUN_00445750(param_1,0,0);
  uVar1 = *(uint *)(param_1 + 0x10);
  *(undefined1 *)(param_1 + 0x2d) = 0;
  *(uint *)(param_1 + 0x10) = uVar1 | 0x80;
  *(uint *)(param_1 + 0xc) = *(uint *)(param_1 + 0xc) | 0x40000000;
  *(uint *)(param_1 + 0x10) = uVar1 | 0x180;
  *(uint *)(param_1 + 0x10) = uVar1 & 0xfffefff8 | 0x180;
  local_2 = CONCAT11((char)((ushort)*(undefined2 *)(param_1 + 0x3f) >> 8),
                     (char)((ushort)*(undefined2 *)(param_1 + 0x3d) >> 8));
  *(uint *)(param_1 + 0x10) = uVar1 & 0xfffefff8 | 0x184;
  *(ushort *)(param_1 + 0x89) =
       (&game_state.level_data[0].unit_index_2)[((local_2 & 0xfe) * 2 | local_2 & 0xfe00) * 2] &
       0x3ff;
  iVar2 = get_adjacent_unit(param_1,0x13);
  if (iVar2 != 0) {
    FUN_00407150(param_1,iVar2);
    *(uint *)(param_1 + 0xc) = *(uint *)(param_1 + 0xc) & 0xffffbfff;
    local_2 = CONCAT11((char)((ushort)*(undefined2 *)(iVar2 + 0x3f) >> 8),
                       (char)((ushort)*(undefined2 *)(iVar2 + 0x3d) >> 8)) & 0xfefe;
    *(ushort *)(param_1 + 0x72) = local_2;
  }
  return;
}
