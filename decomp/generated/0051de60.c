/* Ghidra 12.1.3 pseudocode; entry 0051de60; FUN_0051de60.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


undefined1 FUN_0051de60(int param_1,int param_2)

{
  int iVar1;
  uint uVar2;
  undefined1 local_5;

  local_5 = 0;
  if (*(short *)(param_2 + 0x9d) == 0) {
    iVar1 = alloc_unit(10,8,0xff,param_2 + 0x3d);
    if (iVar1 != 0) {
      local_5 = 1;
      *(undefined1 *)(iVar1 + 0x68) = 2;
      *(undefined1 *)(iVar1 + 0x69) = *(undefined1 *)(param_2 + 0x2f);
      *(undefined1 *)(iVar1 + 0x6a) = *(undefined1 *)(param_1 + 0x2f);
      *(undefined2 *)(iVar1 + 0x70) = *(undefined2 *)(param_2 + 0x24);
      *(undefined2 *)(iVar1 + 0x72) = *(undefined2 *)(param_1 + 0x24);
      *(undefined2 *)(iVar1 + 0x6c) = *(undefined2 *)(iVar1 + 0x70);
      if ((*(byte *)(param_1 + 0xe) & 0x10) == 0) {
        *(undefined1 *)(param_1 + 0x7d) = *(undefined1 *)(param_1 + 0x2c);
        empty_unit_function(param_1);
        *(undefined1 *)(param_1 + 0x2c) = 0x19;
        init_unit_class(param_1);
      }
      if ((*(byte *)(param_2 + 0xe) & 0x10) == 0) {
        *(undefined1 *)(param_2 + 0x7d) = *(undefined1 *)(param_2 + 0x2c);
        empty_unit_function(param_2);
        *(undefined1 *)(param_2 + 0x2c) = 0x19;
        init_unit_class(param_2);
      }
      *(undefined2 *)(param_1 + 0x9d) = *(undefined2 *)(iVar1 + 0x24);
      *(undefined2 *)(param_2 + 0x9d) = *(undefined2 *)(iVar1 + 0x24);
      uVar2 = game_state.pseudo_random_val * 0x24a1 + 0x24df;
      game_state.pseudo_random_val = uVar2 >> 0xd | uVar2 * 0x80000;
      *(short *)(iVar1 + 0x26) = (short)((ulonglong)game_state.pseudo_random_val % 0x168);
      FUN_00519d10(iVar1,1);
      FUN_00431ea0(iVar1,*(undefined1 *)(iVar1 + 0x69),*(undefined1 *)(iVar1 + 0x6a),1);
    }
  }
  return local_5;
}
