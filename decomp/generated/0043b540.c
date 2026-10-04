/* Ghidra 12.1.3 pseudocode; entry 0043b540; FUN_0043b540.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


undefined4 FUN_0043b540(int param_1,undefined2 param_2)

{
  bool bVar1;
  uint uVar2;
  int iVar3;
  undefined1 *puVar4;
  undefined2 local_4;
  undefined1 local_2;
  undefined1 local_1;

  iVar3 = 0;
  uVar2 = 0;
  puVar4 = &DAT_00938830 + DAT_0096aa78 * 10;
  bVar1 = false;
  while( true ) {
    if ((undefined1 *)0x93a76f < puVar4) {
      puVar4 = &DAT_0093883a;
    }
    if (*(short *)(puVar4 + 2) == 0) break;
    iVar3 = iVar3 + 1;
    puVar4 = puVar4 + 10;
    if (799 < iVar3) {
LAB_0043b586:
      if (bVar1) {
        puVar4[1] = 0;
        uVar2 = (int)(puVar4 + -0x938830) / 10;
        *puVar4 = 0;
        DAT_0096aa78 = (short)uVar2 + 1;
        *(undefined2 *)(puVar4 + 4) = 0;
        if (799 < DAT_0096aa78) {
          DAT_0096aa78 = 1;
        }
      }
      uVar2 = uVar2 & 0xffff;
      if (uVar2 == 0) {
        return 0;
      }
      local_4 = param_2;
      local_2 = 4;
      iVar3 = 0;
      local_1 = 4;
      FUN_00438730(uVar2,0x13,&local_4,0);
      *(uint *)(param_1 + 0xc) = *(uint *)(param_1 + 0xc) | 0x10;
      *(undefined1 *)(param_1 + 0xa6) = 0;
      do {
        if (*(short *)(param_1 + 0x8b + iVar3 * 2) != 0) {
          FUN_004364d0(param_1,iVar3);
        }
        iVar3 = iVar3 + 1;
      } while (iVar3 < 8);
      if (*(short *)(param_1 + 0x9b) != 0) {
        FUN_004364d0(param_1,0xffffffff);
      }
      *(uint *)(param_1 + 0xc) = *(uint *)(param_1 + 0xc) & 0xf7ffffff;
      *(uint *)(param_1 + 0x10) = *(uint *)(param_1 + 0x10) & 0xfffffdff;
      FUN_00436d00(param_1,uVar2,*(undefined1 *)(param_1 + 0xa6));
      return 1;
    }
  }
  bVar1 = true;
  goto LAB_0043b586;
}
