/* Ghidra 12.1.3 pseudocode; entry 004a6480; unit_processing_class_5_scenery.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void unit_processing_class_5_scenery(int param_1)

{
  byte bVar1;
  uint uVar2;
  short sVar3;
  int iVar4;
  undefined4 local_8;
  short local_4;

  if ((*(byte *)(param_1 + 0x15) & 2) != 0) {
    local_8 = *(undefined4 *)(param_1 + 0x3d);
    local_4 = *(short *)(param_1 + 0x41);
  }
  switch(*(undefined1 *)(param_1 + 0x2c)) {
  case 1:
    FUN_004a6f40(param_1);
    break;
  case 2:
    FUN_004a6fd0(param_1);
    break;
  case 3:
    FUN_004a7170(param_1);
    break;
  case 4:
    FUN_004a73d0(param_1);
    break;
  case 5:
    FUN_004a7bd0(param_1);
    break;
  case 6:
    FUN_004a7eb0(param_1);
    break;
  case 7:
    *(uint *)(param_1 + 0x10) = *(uint *)(param_1 + 0x10) | 0x2000;
    FUN_004e7a80(param_1);
    uVar2 = *(uint *)(param_1 + 0xc);
    *(ushort *)(param_1 + 0x33) =
         ((*(short *)(param_1 + 0x3f) >> 6) + (*(short *)(param_1 + 0x3d) >> 6) & 3U) +
         unit_type_array_scenery[*(byte *)(param_1 + 0x2b)].obj_index;
    if ((((uVar2 & 0x80000) == 0) && ((*(byte *)(param_1 + 0x11) & 4) == 0)) &&
       (iVar4 = *(short *)(param_1 + 0x5f) * 0x16,
       sVar3 = (short)((int)(iVar4 + (iVar4 >> 0x1f & 0x1fU)) >> 5),
       *(short *)(param_1 + 0x5f) = sVar3, sVar3 < 3)) {
      *(uint *)(param_1 + 0xc) = uVar2 | 4;
      if ((uVar2 & 0x100000) == 0) {
        empty_unit_function(param_1);
        *(undefined1 *)(param_1 + 0x2c) = 1;
        init_unit_class(param_1);
      }
      *(undefined2 *)(param_1 + 0x7c) = 0x80;
    }
    break;
  case 9:
    FUN_004a8370(param_1);
    break;
  case 10:
    FUN_004a8b00(param_1);
    break;
  case 0xb:
    FUN_004a8950(param_1);
    break;
  case 0xc:
    FUN_004a8950(param_1);
    break;
  case 0xd:
    FUN_004f1530(param_1,param_1 + 0x95);
  }
  if ((*(byte *)(param_1 + 0x15) & 2) != 0) {
    *(short *)(param_1 + 0x43) = *(short *)(param_1 + 0x3d) - (short)local_8;
    *(short *)(param_1 + 0x45) = *(short *)(param_1 + 0x3f) - local_8._2_2_;
    *(short *)(param_1 + 0x47) = *(short *)(param_1 + 0x41) - local_4;
  }
  if (((unit_type_array_scenery[*(byte *)(param_1 + 0x2b)].flags_1 & 4) != 0) &&
     (bVar1 = *(byte *)(param_1 + 0x32), bVar1 != 0)) {
    if (bVar1 < 2) {
      if (*(char *)(param_1 + 0x31) == '\0') {
        *(undefined1 *)(param_1 + 0x32) = 0;
      }
      else {
        *(char *)(param_1 + 0x31) = *(char *)(param_1 + 0x31) + -1;
      }
    }
    else {
      *(byte *)(param_1 + 0x32) = bVar1 - 1;
      if ((byte)(bVar1 - 1) == '\x01') {
        *(uint *)(param_1 + 0x10) = *(uint *)(param_1 + 0x10) & 0xffefffff;
      }
    }
  }
  if ((*(byte *)(param_1 + 0x2b) == 0xb) &&
     (iVar4 = *(int *)(param_1 + 0x99) + 1, *(int *)(param_1 + 0x99) = iVar4, 0x2a2f < iVar4)) {
    FUN_004a6e20(param_1);
  }
  return;
}
