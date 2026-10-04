/* Ghidra 12.1.3 pseudocode; entry 00451080; FUN_00451080.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_00451080(int param_1,undefined4 param_2,int param_3,uint param_4)

{
  int iVar1;
  ushort uVar2;
  undefined4 uStack_4;

  iVar1 = DAT_0089c6f0 * 0xc65;
  if ((((((byte)DAT_0089d17c & 0x20) == 0) && (DAT_0089c6c1 != 2)) && (DAT_0089ce36 == '\0')) &&
     ((DAT_0089c6e7 != '\t' && (DAT_0089c6e7 != '\x0f')))) {
    uStack_4 = CONCAT31(uStack_4._1_3_,(char)((ushort)*(undefined2 *)(&DAT_0089d1ec + iVar1) >> 8))
               & 0xfffffffe;
    uVar2 = CONCAT11((char)((ushort)*(undefined2 *)(&DAT_0089d1ee + iVar1) >> 8),
                     (undefined1)uStack_4);
    uStack_4 = CONCAT22(uStack_4._2_2_,uVar2) & 0xfffffeff;
    if (param_1 == 0) {
      uStack_4 = 0x81;
    }
    else if (param_1 == 4) {
      uStack_4 = 0x7f;
    }
    else if (param_1 == 5) {
      uStack_4 = 0x80;
    }
    FUN_00479cf0(CONCAT31((int3)(uStack_4 >> 8),(&DAT_0089ddea)[iVar1]),uStack_4,
                 param_3 << 0x10 | param_4,uVar2 & 0xfeff);
  }
  return;
}
