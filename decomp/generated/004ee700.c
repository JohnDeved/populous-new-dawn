/* Ghidra 12.1.3 pseudocode; entry 004ee700; unit_set_object.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void unit_set_object(undefined2 *param_1,byte param_2,undefined2 param_3)

{
  undefined1 uVar1;
  ushort uVar2;
  uint uVar3;

  uVar3 = (uint)param_2;
  *param_1 = param_3;
  *(byte *)((int)param_1 + 7) = param_2;
  *(undefined1 *)(param_1 + 4) = 0;
  uVar2 = obj_related_array[uVar3 + 3].flags;
  param_1[1] = uVar2;
  uVar1 = obj_related_array[uVar3 + 3].palette_index;
  param_1[1] = uVar2 | 0x100;
  *(undefined1 *)((int)param_1 + 9) = uVar1;
  if ((char)obj_related_array[uVar3 + 3].f1 * 4 <= (int)(uint)(ushort)param_1[2]) {
    param_1[2] = 0;
  }
  if (obj_related_array[uVar3 + 3]._f4 != '\0') {
    param_1[2] = 0;
  }
  return;
}
