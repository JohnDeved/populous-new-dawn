/* Ghidra 12.1.3 pseudocode; entry 0042d060; set_tex_struct_x_y.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void __thiscall
set_tex_struct_x_y(int param_1,int param_2,int param_3,undefined4 param_4,undefined4 param_5,
                  undefined4 param_6)

{
  int iVar1;
  int iVar2;
  longlong lVar3;
  int *piVar4;
  int iVar5;
  int iVar6;

  iVar1 = *(int *)(param_1 + 0x18);
  iVar2 = *(int *)(param_1 + 0x1c);
  *(int *)(param_1 + 0x18) = param_2;
  *(int *)(param_1 + 0x1c) = param_3;
  *(undefined4 *)(param_1 + 0x50) = param_4;
  *(undefined4 *)(param_1 + 0x54) = param_5;
  iVar6 = 0x2000;
  *(undefined4 *)(param_1 + 0x58) = param_6;
  piVar4 = (int *)(param_1 + 0x5c);
  iVar5 = 0x10;
  do {
    lVar3 = (longlong)-(iVar1 - param_2) * (longlong)iVar6;
    *piVar4 = *piVar4 + ((uint)lVar3 >> 0x10 | (int)((ulonglong)lVar3 >> 0x20) << 0x10);
    lVar3 = (longlong)(iVar2 - param_3) * (longlong)iVar6;
    piVar4[0x10] = piVar4[0x10] + ((uint)lVar3 >> 0x10 | (int)((ulonglong)lVar3 >> 0x20) << 0x10);
    iVar6 = iVar6 + 0x600;
    piVar4 = piVar4 + 1;
    iVar5 = iVar5 + -1;
  } while (iVar5 != 0);
  return;
}
