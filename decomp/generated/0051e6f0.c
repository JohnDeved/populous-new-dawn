/* Ghidra 12.1.3 pseudocode; entry 0051e6f0; FUN_0051e6f0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


char FUN_0051e6f0(int param_1)

{
  short sVar1;
  int iVar2;
  char local_7;
  undefined4 local_6;
  undefined1 local_2;
  undefined1 local_1;

  local_7 = '\0';
  iVar2 = FUN_0051ff60(param_1);
  if (iVar2 != 0) {
    iVar2 = (iVar2 / 2) * 2;
    local_6 = CONCAT31(local_6._1_3_,(char)((ushort)*(undefined2 *)(param_1 + 0x3d) >> 8)) &
              0xfffffffe;
    local_6 = CONCAT22(local_6._2_2_,
                       CONCAT11((char)((ushort)*(undefined2 *)(param_1 + 0x3f) >> 8),
                                (undefined1)local_6)) & 0xfffffeff;
    local_7 = FUN_0051ee10(param_1,local_6,iVar2,iVar2);
    if (local_7 != '\0') {
      sVar1 = FUN_00436c20();
      if (sVar1 != 0) {
        local_6 = CONCAT22((undefined2)local_6,(undefined2)local_6);
        local_2 = (undefined1)iVar2;
        local_1 = local_2;
        FUN_00438730(sVar1,0x15,(int)&local_6 + 2,0x20);
        *(uint *)(param_1 + 0xc) = *(uint *)(param_1 + 0xc) | 0x10;
        FUN_00436d00(param_1,sVar1,0xffffffff);
        FUN_00520480(param_1,sVar1);
      }
    }
  }
  return local_7;
}
