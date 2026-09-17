/* Ghidra 12.1.3 pseudocode; entry 004d9420; FUN_004d9420.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


uint FUN_004d9420(int param_1)

{
  short sVar1;
  undefined4 in_EAX;
  int iVar2;
  int iVar3;
  unit_struct *puVar4;
  ushort uVar5;
  unit_struct *local_4;

  uVar5 = *(ushort *)(param_1 + 0x89);
  puVar4 = (unit_struct *)CONCAT22((short)((uint)in_EAX >> 0x10),uVar5);
  if (uVar5 != 0) {
    puVar4 = unit_land_array[uVar5];
    local_4 = (unit_struct *)0x0;
    if (((*(byte *)&puVar4->flags_2 & 1) == 0) && (puVar4->unit_class != '\0')) {
      local_4 = puVar4;
    }
  }
  if ((*(byte *)(param_1 + 0x2e) & 3) == 0) {
    uVar5 = *(short *)(param_1 + 0x70) - 1;
    *(ushort *)(param_1 + 0x70) = uVar5;
    iVar2 = (-(uint)((uVar5 & 1) == 0) & 0xfeac) + 0xaa;
    puVar4 = (unit_struct *)
             (CONCAT22((short)((uint)iVar2 >> 0x10),(short)iVar2 + *(short *)(param_1 + 0x26)) &
             0xffff07ff);
    sVar1 = (short)puVar4;
    if ((*(uint *)(param_1 + 0xc) & 0x80) != 0) {
      *(short *)(param_1 + 0x57) = sVar1;
    }
    *(short *)(param_1 + 0x5d) = sVar1;
    if ((*(uint *)(param_1 + 0xc) & 0x8000) != 0) {
      puVar4 = (unit_struct *)(CONCAT22((short)((uint)puVar4 >> 0x10),sVar1 + 0x400) & 0xffff07ff);
    }
    *(short *)(param_1 + 0x26) = (short)puVar4;
    if ((short)uVar5 < 1) {
      ptr_unit_related_20B->field0_0x0 = (int)*(short *)(param_1 + 0x3d);
      ptr_unit_related_20B->field1_0x4 = (int)*(short *)(param_1 + 0x3f);
      sVar1 = *(short *)(param_1 + 0x26);
      ptr_unit_related_20B->unit_ptr = (unit_struct *)(int)sVar1;
      ptr_unit_related_20B->field3_0xc = 0;
      ptr_unit_related_20B->field4_0x10 = 0;
      ptr_unit_related_20B = ptr_unit_related_20B + 1;
      unit_allocation_flag = 1;
      iVar2 = alloc_unit(1,2,CONCAT31((int3)(char)((ushort)sVar1 >> 8),
                                      *(undefined1 *)(param_1 + 0x85)),(short *)(param_1 + 0x3d));
      puVar4 = (unit_struct *)0x0;
      if (iVar2 != 0) {
        iVar3 = alloc_unit(7,0x3a,0xff,iVar2 + 0x3d);
        if (iVar3 != 0) {
          FUN_0048a050(iVar2,5,0);
          *(undefined2 *)(iVar3 + 0x72) = *(undefined2 *)(iVar2 + 0x24);
        }
        if (local_4 != (unit_struct *)0x0) {
          FUN_0043b180(iVar2,local_4);
          *(uint *)(param_1 + 0x14) = *(uint *)(param_1 + 0x14) | 1;
        }
        puVar4 = (unit_struct *)FUN_004d4b50(param_1);
      }
    }
  }
  return (uint)puVar4 & 0xffffff00;
}
