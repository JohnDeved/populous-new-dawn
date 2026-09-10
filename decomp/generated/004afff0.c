/* Ghidra 12.1.3 pseudocode; entry 004afff0; FUN_004afff0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_004afff0(undefined2 *param_1,short param_2)

{
  bool bVar1;
  int iVar2;
  undefined2 local_8;
  undefined2 local_6;
  undefined2 local_4;

  bVar1 = false;
  if (param_2 == 0) {
    if (param_1 != (undefined2 *)0x0) {
      DAT_0089bc20 = 0;
      local_8 = *param_1;
      bVar1 = true;
      local_6 = param_1[1];
      local_4 = 0;
      iVar2 = alloc_unit_2(7,0x3d,player_tribe_num,&local_8);
      if (iVar2 != 0) {
        *(short *)(iVar2 + 0x41) = *(short *)(iVar2 + 0x41) + -0xa0;
        *(undefined2 *)(iVar2 + 0x6c) = 4;
      }
    }
  }
  else {
    DAT_0089bc20 = param_2;
    bVar1 = true;
  }
  if (bVar1) {
    DAT_0089bc1e = 5;
    FUN_0048a050(0,0x6a,1);
  }
  return;
}
