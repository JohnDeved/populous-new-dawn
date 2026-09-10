/* Ghidra 12.1.3 pseudocode; entry 004047b0; use_smoke.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void use_smoke(undefined4 param_1,int param_2,undefined4 param_3,short *param_4)

{
  int iVar1;

  iVar1 = -1;
  switch(param_1) {
  case 0x50:
    iVar1 = 0;
    break;
  case 0x51:
    iVar1 = 1;
    break;
  case 0x52:
    iVar1 = 2;
    break;
  case 0x6e:
    iVar1 = 3;
    break;
  case 0x6f:
    iVar1 = 4;
    break;
  case 0x70:
    iVar1 = 5;
    break;
  case 0x71:
    iVar1 = 6;
    break;
  case 0x72:
    iVar1 = 7;
    break;
  case 0x73:
    iVar1 = 8;
    break;
  case 0x74:
    iVar1 = 9;
    break;
  case 0x75:
    iVar1 = 10;
    break;
  case 0x76:
    iVar1 = 0xb;
    break;
  case 0x7a:
    iVar1 = 0xc;
    break;
  case 0x7b:
    iVar1 = 0xd;
    break;
  case 0x7c:
    iVar1 = 0xe;
    break;
  case 0x7d:
    iVar1 = 0xf;
    break;
  case 0x7e:
    iVar1 = 0x10;
    break;
  case 0x7f:
    iVar1 = 0x11;
    break;
  case 0x80:
    iVar1 = 0x12;
    break;
  case 0x81:
    iVar1 = 0x13;
    break;
  case 0x82:
    iVar1 = 0x14;
    break;
  case 0x86:
    iVar1 = 0x15;
    break;
  case 0x87:
    iVar1 = 0x16;
    break;
  case 0x88:
    iVar1 = 0x17;
    break;
  case 0x89:
    iVar1 = 0x18;
    break;
  case 0x8a:
    iVar1 = 0x19;
    break;
  case 0x8b:
    iVar1 = 0x1a;
    break;
  case 0x8c:
    iVar1 = 0x1b;
    break;
  case 0x8d:
    iVar1 = 0x1c;
    break;
  case 0x8e:
    iVar1 = 0x1d;
  }
  if (iVar1 != -1) {
    iVar1 = (param_2 + iVar1 * 4) * 6;
    *param_4 = *(short *)((int)&smoke_mem + iVar1) << 2;
    param_4[1] = *(short *)((int)&smoke_mem + iVar1 + 2) << 2;
    param_4[2] = *(short *)((int)&smoke_mem_2 + iVar1) << 2;
    return;
  }
  *param_4 = 0;
  param_4[1] = 0;
  param_4[2] = 0;
  return;
}
