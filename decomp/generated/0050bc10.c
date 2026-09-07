/* Ghidra 12.1.3 pseudocode; entry 0050bc10; process_simple_blast.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void process_simple_blast(int param_1)

{
  int iVar1;
  short sVar2;
  undefined2 uVar3;
  undefined4 in_EAX;

  sVar2 = *(short *)(param_1 + 0x6a);
  iVar1 = CONCAT22((short)((uint)in_EAX >> 0x10),sVar2) + -1;
  *(short *)(param_1 + 0x6a) = (short)iVar1;
  if (sVar2 == 0) {
    update_after_unit_alloc(param_1);
    return;
  }
  sVar2 = *(short *)(param_1 + 0x6c) + *(short *)(param_1 + 0x72);
  *(short *)(param_1 + 0x6c) = sVar2;
  if (*(short *)(param_1 + 0x72) < 1) {
    if (*(short *)(param_1 + 0x70) <= sVar2) goto LAB_0050bc51;
  }
  else if (sVar2 <= *(short *)(param_1 + 0x70)) goto LAB_0050bc51;
  *(undefined2 *)(param_1 + 0x6c) = *(undefined2 *)(param_1 + 0x6e);
LAB_0050bc51:
  if ((*(uint *)(param_1 + 0xc) & 4) == 0) {
    return;
  }
  *(uint *)(param_1 + 0xc) = *(uint *)(param_1 + 0xc) & 0xfffffffb;
  uVar3 = calc_point_height(CONCAT22((short)((uint)(param_1 + 0x68) >> 0x10),
                                     *(undefined2 *)(param_1 + 0x3d)),
                            CONCAT22((short)((uint)iVar1 >> 0x10),*(undefined2 *)(param_1 + 0x3f)));
  *(undefined2 *)(param_1 + 0x41) = uVar3;
  *(uint *)(param_1 + 0x10) = *(uint *)(param_1 + 0x10) & 0xfffffbff;
  *(short *)(param_1 + 0x41) = *(short *)(param_1 + 0x41) + 0x40;
  return;
}
