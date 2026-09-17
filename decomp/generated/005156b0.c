/* Ghidra 12.1.3 pseudocode; entry 005156b0; FUN_005156b0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


undefined1 FUN_005156b0(char tribe_index,unit_struct *param_2)

{
  char cVar1;
  undefined1 uVar2;

  uVar2 = 0;
  if (((((param_2->unit_class == '\x01') && (param_2->tribe_index == tribe_index)) &&
       (cVar1 = param_2->unit_type, cVar1 != '\b')) && ((cVar1 != '\a' && (cVar1 != '\x01')))) &&
     (((param_2->flags_4 & 0x800) == 0 &&
      (((*(byte *)((int)&param_2->flags_3 + 1) & 0x80) == 0 && ((param_2->flags_4 & 0x4000) == 0))))
     )) {
    uVar2 = 1;
  }
  return uVar2;
}
