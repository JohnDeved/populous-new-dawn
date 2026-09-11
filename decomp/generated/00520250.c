/* Ghidra 12.1.3 pseudocode; entry 00520250; FUN_00520250.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_00520250(void)

{
  char cVar1;
  int iVar2;
  int iVar3;
  int iVar4;
  char *pcVar5;
  short *psVar6;
  undefined4 uVar7;

  iVar4 = 0;
  if (0 < DAT_00afc288) {
    psVar6 = &DAT_00afc291;
    do {
      iVar2 = DAT_00afc288;
      if (*(uint *)(psVar6 + 3) < 0x600) {
        cVar1 = *(char *)((int)psVar6 + -1);
        if (cVar1 == '\x01') {
          uVar7 = 0x2d;
        }
        else if (cVar1 == '\x02') {
          uVar7 = 0x2e;
        }
        else if (cVar1 == '\x03') {
          uVar7 = 0x2f;
        }
        else {
          uVar7 = 0x30;
        }
        FUN_0048a050(unit_land_array[*psVar6],uVar7,0);
        iVar2 = DAT_00afc288 + -1;
        if (iVar4 < iVar2) {
          iVar3 = (DAT_00afc288 - iVar4) + -1;
          pcVar5 = (char *)((int)psVar6 + -1);
          do {
            iVar3 = iVar3 + -1;
            *(undefined4 *)pcVar5 = *(undefined4 *)(pcVar5 + 0xb);
            *(undefined4 *)(pcVar5 + 4) = *(undefined4 *)(pcVar5 + 0xf);
            *(undefined2 *)(pcVar5 + 8) = *(undefined2 *)(pcVar5 + 0x13);
            pcVar5[10] = pcVar5[0x15];
            pcVar5 = pcVar5 + 0xb;
          } while (iVar3 != 0);
        }
      }
      DAT_00afc288 = iVar2;
      psVar6 = (short *)((int)psVar6 + 0xb);
      iVar4 = iVar4 + 1;
    } while (iVar4 < DAT_00afc288);
  }
  return;
}
