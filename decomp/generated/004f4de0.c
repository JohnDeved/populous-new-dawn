/* Ghidra 12.1.3 pseudocode; entry 004f4de0; alloc_spell_unit.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void alloc_spell_unit(int param_1,int param_2,ushort param_3)

{
  int iVar1;
  undefined4 uVar2;
  undefined2 local_a;
  short local_8;
  short sStack_6;
  undefined2 local_4;

  iVar1 = *(int *)(param_1 + 0x89d);
  if (iVar1 != 0) {
    local_a = CONCAT11((char)((ushort)*(undefined2 *)(iVar1 + 0x3f) >> 8),
                       (char)((ushort)*(undefined2 *)(iVar1 + 0x3d) >> 8)) & 0xfefe;
    *(ushort *)(param_1 + 0xa09) = local_a;
    local_a._1_1_ = (byte)(param_3 >> 8) & 0xfe;
    local_8 = ((param_3 & 0xfe) + 1) * 0x100;
    uVar2 = CONCAT22(sStack_6,local_8);
    sStack_6 = (local_a._1_1_ + 1) * 0x100;
    local_4 = calc_point_height(uVar2,CONCAT22(local_4,sStack_6));
    iVar1 = get_struct_56B_spell_type(param_2,(int)*(char *)(param_1 + 0xc22));
    if (iVar1 == 3) {
      uVar2 = 0;
      iVar1 = struct_56B_get_spell_array_val((int)*(char *)(param_1 + 0xc22),param_2);
      if (iVar1 != 0) {
        set_struct_56B_array_spell_val((int)*(char *)(param_1 + 0xc22),param_2,iVar1 + -1);
      }
    }
    else {
      uVar2 = *(undefined4 *)((int)&DAT_005a80d4 + param_2 * 0x3e);
    }
    ptr_unit_related_20B->field0_0x0 = uVar2;
    ptr_unit_related_20B->field1_0x4 = 0;
    ptr_unit_related_20B->unit_ptr = (unit_struct *)0x0;
    ptr_unit_related_20B->field3_0xc = 0;
    ptr_unit_related_20B->field4_0x10 = 0;
    ptr_unit_related_20B = ptr_unit_related_20B + 1;
    unit_allocation_flag = 1;
    alloc_unit(0xb,param_2,*(undefined1 *)(param_1 + 0xc22),&local_8);
    *(undefined1 *)(param_1 + 0x5bd) =
         *(undefined1 *)((int)game_state.start_n1 + *(char *)(param_1 + 0xc22) * 0x30 + -5);
  }
  return;
}
