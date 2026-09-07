/* Ghidra 12.1.3 pseudocode; entry 004f14b0; unit_set_object_2.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void unit_set_object_2(int param_1,int param_2,undefined4 param_3,undefined4 param_4,
                      undefined4 param_5)

{
  undefined1 uVar1;
  ushort uVar2;

  *(short *)(param_1 + 0x33) = (short)param_2;
  uVar1 = objs0_mem[param_2].morph_index;
  *(undefined1 *)(param_1 + 0x3a) = 4;
  *(undefined1 *)(param_1 + 0x3b) = uVar1;
  uVar2 = *(ushort *)(param_1 + 0x35);
  *(ushort *)(param_1 + 0x35) = uVar2 | 8;
  *(ushort *)(param_1 + 0x35) = uVar2 & 0xfffd | 8;
  set_unit_anim(param_1,param_3,param_4,param_5);
  return;
}
