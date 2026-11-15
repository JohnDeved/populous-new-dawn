/* Ghidra 12.1.3 pseudocode; entry 004ba9b0; FUN_004ba9b0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_004ba9b0(int param_1,char param_2,int param_3,undefined2 param_4)

{
  int iVar1;
  short sVar2;
  undefined4 uVar3;
  ushort local_6;
  undefined2 local_4;
  ushort local_2;

  if ((*(int *)(param_1 + 0x931) != 0) && (*(char *)(param_1 + 0xc5c) < '\b')) {
    sVar2 = 0;
    if (param_2 == '\0') {
      uVar3 = 6;
      local_4 = *(undefined2 *)(param_3 + 0x24);
      local_6 = CONCAT11((char)((ushort)*(undefined2 *)(param_3 + 0x3f) >> 8),
                         (char)((ushort)*(undefined2 *)(param_3 + 0x3d) >> 8)) & 0xfefe;
      local_2 = local_6;
    }
    else {
      uVar3 = 0xb;
      local_4 = param_4;
      local_2 = 0x606;
    }
    for (iVar1 = *(int *)(param_1 + 0x881); iVar1 != 0; iVar1 = *(int *)(iVar1 + 8)) {
      if ((*(byte *)(iVar1 + 0x7a) & 0x80) != 0) {
        if (*(char *)(param_1 + 0xc5c) == '\0') {
          FUN_00436ca0(iVar1);
          *(uint *)(iVar1 + 0xc) = *(uint *)(iVar1 + 0xc) | 0x10;
          *(undefined1 *)(iVar1 + 0xa6) = 0;
        }
        if (sVar2 == 0) {
          sVar2 = FUN_00436c20();
          if ((sVar2 == 0) || (FUN_00438730(sVar2,uVar3,&local_4,0), sVar2 == 0)) goto LAB_004baa96;
        }
        FUN_00436d00(iVar1,sVar2,*(undefined1 *)(param_1 + 0xc5c));
      }
LAB_004baa96:
    }
    *(char *)(param_1 + 0xc5c) = *(char *)(param_1 + 0xc5c) + '\x01';
  }
  return;
}
