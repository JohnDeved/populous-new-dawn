/* Ghidra 12.1.3 pseudocode; entry 00459d00; FUN_00459d00.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_00459d00(int param_1,int param_2,int param_3)

{
  FUN_00459d60(param_1 - ((int)((DAT_00a69070 - (uint)(*(ushort *)(param_3 + 4) >> 1)) - param_1) >>
                         5),
               param_2 - ((int)((DAT_00a69074 - (uint)(*(ushort *)(param_3 + 6) >> 1)) - param_2) >>
                         5),param_3,1);
  return;
}
