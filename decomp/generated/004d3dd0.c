/* Ghidra 12.1.3 pseudocode; entry 004d3dd0; FUN_004d3dd0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


uint FUN_004d3dd0(ushort *param_1,ushort *param_2)

{
  ushort *puVar1;

  if ((((*param_2 ^ *param_1) & 0xfe00) == 0) &&
     (puVar1 = param_2 + 1,
     param_2 = (ushort *)CONCAT22((short)((uint)param_2 >> 0x10),*puVar1 ^ param_1[1]),
     ((*puVar1 ^ param_1[1]) & 0xfe00) == 0)) {
    return CONCAT31((int3)((uint)param_2 >> 8),1);
  }
  return (uint)param_2 & 0xffffff00;
}
