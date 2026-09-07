/* Ghidra 12.1.3 pseudocode; entry 00461f90; FUN_00461f90.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_00461f90(int param_1)

{
  uint uVar1;
  uint uVar2;
  int iVar3;
  unit_struct *puVar4;
  unit_struct *puVar5;
  int iVar6;
  uint *puVar7;

  puVar7 = (uint *)(param_1 + 0x74);
  iVar6 = 10;
  do {
    uVar1 = *puVar7;
    if ((uVar1 & 1) != 0) {
      switch(*(undefined1 *)((int)puVar7 + 0x11)) {
      case 1:
        if ((ushort)puVar7[-0xe] != 0) {
          puVar5 = unit_land_array[(ushort)puVar7[-0xe]];
          puVar4 = (unit_struct *)0x0;
          if (((puVar5->flags_2 & 1) == 0) && (puVar5->unit_class != '\0')) {
            puVar4 = puVar5;
          }
          if (puVar4 == (unit_struct *)0x0) {
            *puVar7 = uVar1 | 2;
          }
        }
        break;
      case 3:
        if ((ushort)puVar7[-0xe] != 0) {
          puVar5 = unit_land_array[(ushort)puVar7[-0xe]];
          puVar4 = (unit_struct *)0x0;
          if (((puVar5->flags_2 & 1) == 0) && (puVar5->unit_class != '\0')) {
            puVar4 = puVar5;
          }
          if (puVar4 == (unit_struct *)0x0) {
            *puVar7 = uVar1 | 2;
          }
        }
        puVar5 = (unit_struct *)0x0;
        if ((((ushort)puVar7[-3] != 0) &&
            (puVar4 = unit_land_array[(ushort)puVar7[-3]], (puVar4->flags_2 & 1) == 0)) &&
           (puVar4->unit_class != '\0')) {
          puVar5 = puVar4;
        }
        if (puVar5 == (unit_struct *)0x0) {
          *puVar7 = *puVar7 | 2;
        }
        break;
      case 6:
      case 7:
      case 0x10:
        puVar5 = (unit_struct *)0x0;
        if ((((ushort)puVar7[-3] != 0) &&
            (puVar4 = unit_land_array[(ushort)puVar7[-3]], (puVar4->flags_2 & 1) == 0)) &&
           (puVar4->unit_class != '\0')) {
          puVar5 = puVar4;
        }
        if (puVar5 == (unit_struct *)0x0) {
          *puVar7 = uVar1 | 2;
        }
        break;
      case 8:
        if ((ushort)puVar7[1] < 3) {
          puVar5 = (unit_struct *)0x0;
          if ((((ushort)puVar7[-3] != 0) &&
              (puVar4 = unit_land_array[(ushort)puVar7[-3]], (puVar4->flags_2 & 1) == 0)) &&
             (puVar4->unit_class != '\0')) {
            puVar5 = puVar4;
          }
          if (puVar5 == (unit_struct *)0x0) {
            *puVar7 = uVar1 | 2;
          }
        }
        break;
      case 9:
        if ((ushort)puVar7[-0xd] != 0) {
          puVar5 = unit_land_array[(ushort)puVar7[-0xd]];
          puVar4 = (unit_struct *)0x0;
          if (((puVar5->flags_2 & 1) == 0) && (puVar5->unit_class != '\0')) {
            puVar4 = puVar5;
          }
          if (puVar4 == (unit_struct *)0x0) {
            *(undefined2 *)(puVar7 + -0xd) = 0;
          }
        }
        break;
      case 0xb:
        if (((short)puVar7[1] != 3) && ((short)puVar7[1] != 2)) {
          puVar5 = (unit_struct *)0x0;
          if (((ushort)puVar7[-3] != 0) &&
             ((puVar4 = unit_land_array[(ushort)puVar7[-3]], (puVar4->flags_2 & 1) == 0 &&
              (puVar4->unit_class != '\0')))) {
            puVar5 = puVar4;
          }
          if (puVar5 == (unit_struct *)0x0) {
            *puVar7 = uVar1 | 2;
          }
        }
        break;
      case 0xd:
        uVar2 = *(uint *)((int)puVar7 + -0x3e);
        if (uVar2 != 0) {
          puVar5 = (unit_struct *)0x0;
          if ((((short)uVar2 != 0) &&
              (puVar4 = unit_land_array[uVar2 & 0xffff], (puVar4->flags_2 & 1) == 0)) &&
             (puVar4->unit_class != '\0')) {
            puVar5 = puVar4;
          }
          if (puVar5 == (unit_struct *)0x0) {
            *puVar7 = uVar1 | 2;
          }
        }
        puVar5 = (unit_struct *)0x0;
        if ((((ushort)puVar7[-3] != 0) &&
            (puVar4 = unit_land_array[(ushort)puVar7[-3]], (puVar4->flags_2 & 1) == 0)) &&
           (puVar4->unit_class != '\0')) {
          puVar5 = puVar4;
        }
        if (puVar5 == (unit_struct *)0x0) {
          *puVar7 = *puVar7 | 2;
        }
        break;
      case 0xe:
        iVar3 = tribe_get_shaman(param_1);
        if (iVar3 == 0) {
          *puVar7 = *puVar7 | 2;
        }
        break;
      case 0xf:
        if (4 < (ushort)puVar7[1]) {
          puVar5 = (unit_struct *)0x0;
          if ((((ushort)puVar7[-3] != 0) &&
              (puVar4 = unit_land_array[(ushort)puVar7[-3]], (puVar4->flags_2 & 1) == 0)) &&
             (puVar4->unit_class != '\0')) {
            puVar5 = puVar4;
          }
          if (puVar5 == (unit_struct *)0x0) {
            *puVar7 = uVar1 | 2;
          }
        }
        break;
      case 0x11:
        if (*(ushort *)((int)puVar7 + -0x26) != 0) {
          puVar5 = unit_land_array[*(ushort *)((int)puVar7 + -0x26)];
          puVar4 = (unit_struct *)0x0;
          if (((puVar5->flags_2 & 1) == 0) && (puVar5->unit_class != '\0')) {
            puVar4 = puVar5;
          }
          if (puVar4 == (unit_struct *)0x0) {
            *puVar7 = uVar1 | 2;
          }
        }
        if ((ushort)puVar7[-10] != 0) {
          puVar5 = unit_land_array[(ushort)puVar7[-10]];
          puVar4 = (unit_struct *)0x0;
          if (((puVar5->flags_2 & 1) == 0) && (puVar5->unit_class != '\0')) {
            puVar4 = puVar5;
          }
          if (puVar4 == (unit_struct *)0x0) {
            *puVar7 = *puVar7 | 2;
          }
        }
        puVar5 = (unit_struct *)0x0;
        if ((((ushort)puVar7[-3] != 0) &&
            (puVar4 = unit_land_array[(ushort)puVar7[-3]], (puVar4->flags_2 & 1) == 0)) &&
           (puVar4->unit_class != '\0')) {
          puVar5 = puVar4;
        }
        if (puVar5 == (unit_struct *)0x0) {
          *puVar7 = *puVar7 | 2;
        }
        break;
      case 0x12:
        if (*(ushort *)((int)puVar7 + -0x26) != 0) {
          puVar5 = unit_land_array[*(ushort *)((int)puVar7 + -0x26)];
          puVar4 = (unit_struct *)0x0;
          if (((puVar5->flags_2 & 1) == 0) && (puVar5->unit_class != '\0')) {
            puVar4 = puVar5;
          }
          if (puVar4 == (unit_struct *)0x0) {
            *puVar7 = uVar1 | 2;
          }
        }
        uVar1 = puVar7[-3];
        if (uVar1 != 0) {
          puVar5 = (unit_struct *)0x0;
          if ((((short)uVar1 != 0) &&
              (puVar4 = unit_land_array[uVar1 & 0xffff], (puVar4->flags_2 & 1) == 0)) &&
             (puVar4->unit_class != '\0')) {
            puVar5 = puVar4;
          }
          if (puVar5 == (unit_struct *)0x0) {
            *puVar7 = *puVar7 | 2;
          }
        }
        break;
      case 0x13:
        if (*(ushort *)((int)puVar7 + -0x26) != 0) {
          puVar5 = unit_land_array[*(ushort *)((int)puVar7 + -0x26)];
          puVar4 = (unit_struct *)0x0;
          if (((puVar5->flags_2 & 1) == 0) && (puVar5->unit_class != '\0')) {
            puVar4 = puVar5;
          }
          if (puVar4 == (unit_struct *)0x0) {
            *puVar7 = uVar1 | 2;
          }
        }
        if ((ushort)puVar7[-10] != 0) {
          puVar5 = unit_land_array[(ushort)puVar7[-10]];
          puVar4 = (unit_struct *)0x0;
          if (((puVar5->flags_2 & 1) == 0) && (puVar5->unit_class != '\0')) {
            puVar4 = puVar5;
          }
          if (puVar4 == (unit_struct *)0x0) {
            *puVar7 = *puVar7 | 2;
          }
        }
        break;
      case 0x14:
        puVar5 = (unit_struct *)0x0;
        if ((((ushort)puVar7[-3] != 0) &&
            (puVar4 = unit_land_array[(ushort)puVar7[-3]], (puVar4->flags_2 & 1) == 0)) &&
           (puVar4->unit_class != '\0')) {
          puVar5 = puVar4;
        }
        if (puVar5 == (unit_struct *)0x0) {
          puVar7[-3] = 0;
        }
      }
    }
    puVar7 = (uint *)((int)puVar7 + 0x52);
    iVar6 = iVar6 + -1;
  } while (iVar6 != 0);
  return;
}
