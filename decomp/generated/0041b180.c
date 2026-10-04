/* Ghidra 12.1.3 pseudocode; entry 0041b180; FUN_0041b180.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_0041b180(int param_1,char param_2,uint param_3,uint param_4,uint param_5)

{
  byte bVar1;
  uint uVar2;
  undefined1 uVar3;
  int iVar4;

  iVar4 = *(int *)(param_1 + 0x881);
  if (iVar4 != 0) {
    do {
      if ((((uint)*(byte *)(iVar4 + 0x2c) == (int)param_2) &&
          (((uVar2 = (uint)*(byte *)(iVar4 + 0x2b), uVar2 == param_3 || (uVar2 == param_4)) ||
           (uVar2 == param_5)))) && (FUN_004e9b40(iVar4), (*(byte *)(iVar4 + 0xe) & 0x10) == 0)) {
        *(undefined1 *)(iVar4 + 0x7d) = *(undefined1 *)(iVar4 + 0x2c);
        if (((byte)DAT_0089d17c & 2) == 0) {
          bVar1 = *(byte *)(iVar4 + 0x2b);
LAB_0041b1fd:
          uVar3 = (&DAT_005a7064)[(uint)bVar1 * 0x32];
        }
        else {
          bVar1 = *(byte *)(iVar4 + 0x2b);
          if (bVar1 != 7) goto LAB_0041b1fd;
          uVar3 = 0x27;
        }
        FUN_004ed6f0(iVar4);
        *(undefined1 *)(iVar4 + 0x2c) = uVar3;
        FUN_004ed640(iVar4);
      }
      iVar4 = *(int *)(iVar4 + 8);
    } while (iVar4 != 0);
  }
  return;
}
