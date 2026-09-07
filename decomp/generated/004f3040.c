/* Ghidra 12.1.3 pseudocode; entry 004f3040; FUN_004f3040.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


bool FUN_004f3040(int param_1,undefined4 param_2,undefined4 param_3)

{
  int iVar1;
  int iVar2;
  undefined2 unaff_retaddr;

  iVar1 = FUN_0049c720(param_2,CONCAT22(unaff_retaddr,
                                        CONCAT11((char)((ushort)*(undefined2 *)(param_1 + 0x3f) >> 8
                                                       ),(char)((ushort)*(undefined2 *)
                                                                         (param_1 + 0x3d) >> 8))) &
                               0xfffffefe);
  iVar2 = FUN_004c2e00(param_1,param_3);
  return iVar1 <= iVar2 * iVar2 + 2;
}
