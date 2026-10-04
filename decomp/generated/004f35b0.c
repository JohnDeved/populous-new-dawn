/* Ghidra 12.1.3 pseudocode; entry 004f35b0; FUN_004f35b0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_004f35b0(int param_1,undefined4 param_2,int param_3)

{
  int iVar1;
  int iVar2;
  byte bVar3;
  int iVar4;
  byte bVar5;
  int iVar6;
  int iVar7;
  char local_c;
  char cStack_b;
  undefined2 local_a;

  local_c = (char)param_2;
  cStack_b = (char)((uint)param_2 >> 8);
  cStack_b = cStack_b + (char)param_3 * -2;
  iVar1 = param_3 * 2 + 1;
  for (iVar2 = iVar1; local_a = CONCAT11(cStack_b,local_c + (char)param_3 * -2), iVar7 = iVar1,
      iVar2 != 0; iVar2 = iVar2 + -1) {
    for (; iVar7 != 0; iVar7 = iVar7 + -1) {
      for (iVar4 = (&DAT_00890390)
                   [(short)(&DAT_008a03ea)[((local_a & 0xfe) * 2 | local_a & 0xfe00) * 2]];
          iVar4 != 0; iVar4 = (&DAT_00890390)[*(ushort *)(iVar4 + 0x20)]) {
        if (*(char *)(iVar4 + 0x2a) == '\x01') {
          bVar3 = *(byte *)(param_1 + 0xc22);
          bVar5 = *(byte *)(iVar4 + 0x2f);
          if (bVar3 != bVar5) {
            if (((bVar3 == 0xff) || (bVar5 == 0xff)) || (bVar3 == bVar5)) {
              bVar5 = 1;
            }
            else {
              bVar5 = *(byte *)((int)&DAT_009608b6 + (int)(char)bVar3) & '\x01' << (bVar5 & 0x1f);
            }
            if (((bVar5 == 0) && (iVar6 = FUN_004de7b0(iVar4,(int)(char)bVar3), iVar6 != 0)) &&
               ((*(byte *)(iVar4 + 0x11) & 0x10) == 0)) {
              FUN_004de7f0(iVar4);
            }
          }
        }
      }
      local_a = CONCAT11(local_a._1_1_,(char)local_a + '\x02');
    }
    cStack_b = local_a._1_1_ + '\x02';
  }
  return;
}
