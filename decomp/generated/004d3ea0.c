/* Ghidra 12.1.3 pseudocode; entry 004d3ea0; FUN_004d3ea0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_004d3ea0(int param_1)

{
  int iVar1;
  int iVar2;

  iVar1 = 1;
  iVar2 = -1;
  if ((*(uint *)(param_1 + 0xc) & 0x80000) == 0) {
    switch(*(undefined1 *)(param_1 + 0x2c)) {
    case 1:
    case 3:
    case 0xc:
    case 0x13:
    case 0x19:
    case 0x1d:
    case 0x27:
    case 0x2c:
      iVar1 = 0;
      break;
    case 0xb:
    case 0xe:
      iVar1 = 3;
      break;
    case 0xf:
      iVar2 = 2;
      break;
    case 0x10:
      iVar2 = 3;
      break;
    case 0x18:
      iVar1 = 0xc;
      break;
    case 0x1a:
    case 0x1f:
    case 0x28:
      iVar1 = 0x19;
    }
    if ((iVar1 == 1) && (*(short *)(param_1 + 0x5f) == 0)) {
      iVar1 = 0;
    }
  }
  else {
    iVar1 = 0xc;
    if ((*(byte *)(param_1 + 0x11) & 4) == 0) {
      iVar1 = 2;
      *(uint *)(param_1 + 0xc) = *(uint *)(param_1 + 0xc) & 0xffff7fff;
    }
  }
  if (((unit_type_array_person[*(byte *)(param_1 + 0x2b)].flags & 2) != 0) &&
     (*(short *)(param_1 + 0x78) != 0)) {
    if (iVar1 == 0) {
      iVar1 = 4;
    }
    else if (iVar1 == 1) {
      iVar1 = 5;
    }
  }
  if ((iVar2 != -1) ||
     (iVar2 = (int)unit_type_to_obj_indexes_map[iVar1 * 9 + (uint)*(byte *)(param_1 + 0x2b)],
     iVar2 != -1)) {
    unit_set_object_upper(param_1,iVar2);
  }
  return;
}
