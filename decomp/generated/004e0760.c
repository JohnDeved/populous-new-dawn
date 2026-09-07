/* Ghidra 12.1.3 pseudocode; entry 004e0760; FUN_004e0760.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


uint FUN_004e0760(int param_1)

{
  ushort uVar1;
  undefined4 in_EAX;
  uint uVar2;
  unit_struct *puVar3;
  unit_struct *puVar4;

  puVar4 = (unit_struct *)0x0;
  uVar1 = *(ushort *)(param_1 + 0x72);
  puVar3 = (unit_struct *)CONCAT22((short)((uint)in_EAX >> 0x10),uVar1);
  if (((uVar1 != 0) && (puVar3 = unit_land_array[uVar1], (*(byte *)&puVar3->flags_2 & 1) == 0)) &&
     (puVar3->unit_class != '\0')) {
    puVar4 = puVar3;
  }
  if ((*(char *)(param_1 + 0x2d) != '\0') || (puVar4 == (unit_struct *)0x0)) {
    uVar2 = *(uint *)(param_1 + 0xc);
    *(uint *)(param_1 + 0xc) = uVar2 & 0xffefffff;
    if ((*(uint *)(param_1 + 0x10) & 0x800) == 0) {
      *(uint *)(param_1 + 0xc) = uVar2 & 0xffefbfff;
      *(uint *)(param_1 + 0x10) = *(uint *)(param_1 + 0x10) | 0x2000;
      *(undefined1 *)(param_1 + 0x7d) = *(undefined1 *)(param_1 + 0x2c);
      empty_unit_function(param_1);
      *(undefined1 *)(param_1 + 0x2c) = 0x1f;
      init_unit_class(param_1);
      if (*(byte *)(param_1 + 0x2b) == 7) {
        uVar2 = unit_set_object_upper(param_1,unit_type_to_obj_indexes_map[7]);
        return uVar2 & 0xffffff00;
      }
      uVar2 = unit_set_object_upper
                        (param_1,unit_type_to_obj_indexes_map[*(byte *)(param_1 + 0x2b) + 0x6c]);
      return uVar2 & 0xffffff00;
    }
    puVar3 = (unit_struct *)FUN_004ef180(param_1);
  }
  return (uint)puVar3 & 0xffffff00;
}
