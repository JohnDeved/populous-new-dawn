/* Ghidra 12.1.3 pseudocode; entry 004f3a70; FUN_004f3a70.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


int FUN_004f3a70(int param_1,ushort param_2)

{
  short sVar1;
  int iVar2;
  undefined2 local_a;
  char local_8;
  char local_7;
  undefined1 local_4;
  undefined1 local_3;

  local_4 = (undefined1)((ushort)*(undefined2 *)(param_1 + 0x3d) >> 8);
  local_3 = (undefined1)((ushort)*(undefined2 *)(param_1 + 0x3f) >> 8);
  local_a = param_2 & 0xfefe;
  local_8 = (char)local_a + '\x01';
  local_7 = local_a._1_1_ + '\x01';
  sVar1 = FUN_004ea920(param_1,&local_4,&local_8,0);
  iVar2 = (int)sVar1;
  if (iVar2 == 0) {
    *(uint *)(param_1 + 0x10) = *(uint *)(param_1 + 0x10) & 0xefffffff;
    iVar2 = 0;
  }
  return iVar2;
}
