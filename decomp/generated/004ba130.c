/* Ghidra 12.1.3 pseudocode; entry 004ba130; FUN_004ba130.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_004ba130(int param_1,short *param_2)

{
  byte bVar1;
  shape_entry *psVar2;
  ushort uVar3;
  undefined2 local_2;

  psVar2 = shapes_mem;
  bVar1 = *(byte *)(param_1 + 0x9b);
  local_2 = *(ushort *)(param_1 + 0x68) & 0xfffe;
  uVar3 = local_2;
  local_2._1_1_ = (byte)(local_2 >> 8) & 0xfe;
  *param_2 = uVar3 * 0x100;
  param_2[1] = (ushort)local_2._1_1_ * 0x100;
  *param_2 = (char)psVar2[bVar1].field_0x4 * 0x40 + uVar3 * 0x100;
  param_2[1] = (char)psVar2[bVar1].field_0x5 * 0x40 + (ushort)local_2._1_1_ * 0x100;
  return;
}
