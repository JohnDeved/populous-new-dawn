/* Ghidra 12.1.3 pseudocode; entry 00500ec0; unit_processing_class_10_internal.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void unit_processing_class_10_internal(int param_1)

{
  short sVar1;
  unit_struct *puVar2;
  undefined2 uVar3;
  short sVar4;
  uint uVar5;
  int iVar6;
  ushort *puVar7;
  unit_struct *puVar8;

  switch(*(byte *)(param_1 + 0x2c)) {
  case 5:
    break;
  default:
    return;
  case 7:
    FUN_00502660(param_1);
    return;
  case 0xc:
    FUN_005029d0(param_1);
    return;
  case 0xf:
    FUN_00502eb0(param_1);
    return;
  case 0x11:
    if (*(char *)(param_1 + 0x66) != '\0') {
      *(undefined1 *)(param_1 + 0x66) = 0;
      FUN_005032a0(param_1);
    }
    puVar7 = (ushort *)(param_1 + 0x68);
    iVar6 = 0x10;
    do {
      if (*puVar7 != 0) {
        puVar2 = unit_land_array[*puVar7];
        puVar8 = (unit_struct *)0x0;
        if (((puVar2->flags_2 & 1) == 0) && (puVar2->unit_class != '\0')) {
          puVar8 = puVar2;
        }
        if (puVar8 == (unit_struct *)0x0) {
          *puVar7 = 0;
        }
      }
      puVar7 = puVar7 + 2;
      iVar6 = iVar6 + -1;
    } while (iVar6 != 0);
    return;
  case 0x12:
    FUN_00503550(param_1);
    return;
  }
  sVar1 = *(short *)(param_1 + 0x26);
  uVar3 = (undefined2)(*(byte *)(param_1 + 0x2c) - 5 >> 0x10);
  uVar5 = CONCAT22(uVar3,sVar1) + 0x138U & 0xffff07ff;
  sVar4 = (short)uVar5;
  *(short *)(param_1 + 0x26) = sVar4;
  sVar4 = sVar4 - sVar1;
  *(short *)(param_1 + 0x28) = sVar4;
  if (sVar4 < 0x401) {
    if (-0x401 < sVar4) goto LAB_00500f1f;
    sVar4 = sVar4 + 0x800;
  }
  else {
    sVar4 = sVar4 + -0x800;
  }
  *(short *)(param_1 + 0x28) = sVar4;
LAB_00500f1f:
  uVar3 = calc_point_height(CONCAT22((short)(uVar5 >> 0x10),*(undefined2 *)(param_1 + 0x3d)),
                            CONCAT22(uVar3,*(undefined2 *)(param_1 + 0x3f)));
  *(undefined2 *)(param_1 + 0x41) = uVar3;
  *(uint *)(param_1 + 0x10) = *(uint *)(param_1 + 0x10) & 0xfffffbff;
  return;
}
