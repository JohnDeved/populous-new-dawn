/* Ghidra 12.1.3 pseudocode; entry 004f8e10; FUN_004f8e10.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


int FUN_004f8e10(int param_1,int param_2)

{
  uint uVar1;
  byte bVar2;
  undefined2 uVar3;
  undefined2 uVar4;
  bool bVar5;
  int iVar6;
  uint uVar7;
  int iVar8;
  undefined2 local_c;
  ushort local_a;

  bVar5 = false;
  if (1 < *(byte *)(param_2 + 0x10)) {
    return 2;
  }
  do {
    bVar2 = *(byte *)(param_2 + 0x11);
    if (DAT_0096eac0 <= bVar2) break;
    if (((int)*(char *)(param_1 + 0xc22) != (uint)bVar2) &&
       (iVar6 = FUN_004f6800(param_1,(uint)bVar2), iVar6 == 0)) {
      iVar6 = (uint)*(byte *)(param_2 + 0x11) * 0xc65;
      if (*(char *)(param_2 + 0x10) == '\x01') {
        iVar6 = *(int *)((int)&DAT_0089da4d + iVar6);
      }
      else {
        iVar6 = *(int *)((int)&DAT_0089da49 + iVar6);
      }
      for (; iVar6 != 0; iVar6 = *(int *)(iVar6 + 8)) {
        local_c = CONCAT11((char)((ushort)*(undefined2 *)(iVar6 + 0x3f) >> 8),
                           (char)((ushort)*(undefined2 *)(iVar6 + 0x3d) >> 8));
        uVar7 = (local_c & 0xfe) * 2 | local_c & 0xfe00;
        uVar1 = uVar7 * 4;
        iVar8 = FUN_004f3ef0(param_1,&DAT_008a03e4 + uVar7);
        if (iVar8 != 0) {
          if ((*(char *)(iVar6 + 0x2a) == '\x02') ||
             (iVar8 = FUN_004de7b0(iVar6,(int)*(char *)(param_1 + 0xc22)), iVar8 == 0)) {
            iVar8 = FUN_004f3f20(param_1,iVar6);
            if (iVar8 == 0) {
              *(undefined2 *)(param_2 + 6) = *(undefined2 *)(iVar6 + 0x24);
              uVar3 = *(undefined2 *)(iVar6 + 0x3d);
              uVar4 = *(undefined2 *)(iVar6 + 0x3f);
              *(char *)(param_2 + 0x11) = *(char *)(param_2 + 0x11) + '\x01';
              local_a = CONCAT11((char)((ushort)uVar4 >> 8),(char)((ushort)uVar3 >> 8)) & 0xfefe;
              *(ushort *)(param_2 + 8) = local_a;
              return 0xd - (uint)(*(char *)(param_2 + 0x10) == '\x01');
            }
          }
          else {
            uVar7 = DAT_0089d178 * 0x24a1 + 0x24df;
            DAT_0089d178 = uVar7 >> 0xd | uVar7 * 0x80000;
            if ((DAT_0089d178 % 100 < (uint)(byte)(&DAT_00960812)[*(char *)(param_1 + 0xc22) * 0x30]
                ) || ((ushort)(byte)(&DAT_00960802)[*(char *)(param_1 + 0xc22) * 0x30] <
                      *(ushort *)(iVar6 + 0x87))) {
              FUN_004f35b0(param_1,(int)((uVar1 & 0x7f0) >> 1 | uVar1 & 0xfffff803) >> 2,1);
            }
          }
        }
      }
      bVar5 = true;
    }
    *(char *)(param_2 + 0x11) = *(char *)(param_2 + 0x11) + '\x01';
  } while (!bVar5);
  if (DAT_0096eac0 <= *(byte *)(param_2 + 0x11)) {
    *(undefined1 *)(param_2 + 0x11) = 0;
    *(char *)(param_2 + 0x10) = *(char *)(param_2 + 0x10) + '\x01';
  }
  return 0xf;
}
