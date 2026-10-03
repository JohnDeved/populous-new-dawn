/* Ghidra 12.1.3 pseudocode; entry 0044eb40; FUN_0044eb40.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


int FUN_0044eb40(undefined1 *param_1)

{
  int iVar1;
  int iVar2;
  int iVar3;
  int iVar4;
  undefined2 local_2;

  iVar1 = 0;
  iVar3 = 0;
  local_2._1_1_ = param_1[4];
  for (iVar4 = *(int *)(param_1 + 0xc); local_2 = CONCAT11(local_2._1_1_,*param_1), iVar4 != 0;
      iVar4 = iVar4 + -1) {
    for (iVar2 = *(int *)(param_1 + 8); iVar2 != 0; iVar2 = iVar2 + -1) {
      iVar3 = iVar3 + 1;
      iVar1 = iVar1 + (short)(&DAT_008a03e8)[((local_2 & 0xfe) * 2 | local_2 & 0xfe00) * 2];
      local_2 = CONCAT11(local_2._1_1_,(char)local_2 + '\x02');
    }
    local_2._1_1_ = local_2._1_1_ + '\x02';
  }
  if (iVar3 != 0) {
    iVar1 = iVar1 / iVar3;
  }
  return iVar1;
}
