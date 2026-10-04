/* Ghidra 12.1.3 pseudocode; entry 00442b50; FUN_00442b50.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */

void FUN_00442b50(void)

{
  short *psVar1;
  short sVar2;
  int iVar3;
  undefined4 uVar4;
  uint uVar5;

  DAT_00895819 = 0xffffffff;
  FUN_00462d70();
  DAT_0096aa74 = &DAT_0096aaba;
  if (((byte)DAT_0089c661 & 2) == 0) {
    FUN_0041b5c0(0);
  }
  FUN_00494930(0);
  FUN_004ee300();
  FUN_004ecac0();
  FUN_00503230();
  FUN_00503f60();
  FUN_004776c0();
  FUN_00480e70();
  FUN_0042a500(DAT_0096ead0);
  uVar4 = FUN_0040c670(DAT_0096ead1);
  uVar4 = FUN_0042cd60(CONCAT31((int3)((uint)uVar4 >> 8),DAT_0096ead2) & 0xffffff01);
  uVar5 = CONCAT31((int3)((uint)uVar4 >> 8),DAT_0096ead2) & 0xffffff02;
  FUN_0042cd90(CONCAT31((int3)(uVar5 >> 8),(byte)uVar5 >> 1));
  FUN_0042b910();
  iVar3 = DAT_0089c6f0 * 0x5e2;
  psVar1 = (short *)((int)&DAT_008979d3 + iVar3);
  if (*(short *)((int)&DAT_008979d7 + iVar3) == 0) {
    *(undefined2 *)((int)&DAT_008979d7 + iVar3) = 1;
    *(undefined4 *)((int)&DAT_00897997 + DAT_0089c6f0 * 0xf) = DAT_0089d184;
    iVar3 = DAT_0089c6f0 * 0xf;
    sVar2 = *psVar1;
    *(undefined4 *)((int)psVar1 + sVar2 * 0xf + 6) = *(undefined4 *)((int)&DAT_00897997 + iVar3);
    *(undefined4 *)((int)psVar1 + sVar2 * 0xf + 10) = *(undefined4 *)((int)&DAT_0089799b + iVar3);
    *(undefined4 *)((int)psVar1 + sVar2 * 0xf + 0xe) = *(undefined4 *)((int)&DAT_0089799f + iVar3);
    *(undefined2 *)((int)psVar1 + sVar2 * 0xf + 0x12) = *(undefined2 *)((int)&DAT_008979a3 + iVar3);
    *(undefined1 *)((int)psVar1 + sVar2 * 0xf + 0x14) = (&DAT_008979a5)[iVar3];
    sVar2 = *psVar1;
    *psVar1 = sVar2 + 1;
    if (99 < (short)(sVar2 + 1)) {
      *psVar1 = 0;
    }
  }
  FUN_0043e3c0();
  _DAT_0087ca1c = _DAT_0087ca1c | 0x80;
  FUN_004bdd40(0,0x40);
  FUN_004f2760();
  FUN_004319e0();
  FUN_004a2620((DAT_0089d17c & 0x20) >> 5);
  return;
}
