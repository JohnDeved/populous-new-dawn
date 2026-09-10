/* Ghidra 12.1.3 pseudocode; entry 00433800; FUN_00433800.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


uint FUN_00433800(int param_1)

{
  vector_48b *pvVar1;
  ushort uVar2;
  undefined4 in_EAX;
  int iVar3;
  uint uVar4;
  unit_struct *puVar5;
  uint uVar6;
  unit_struct *puVar7;
  bool bVar8;
  undefined1 local_7;
  ushort local_6;
  undefined1 local_4 [4];

  puVar7 = (unit_struct *)0x0;
  uVar2 = *(ushort *)(param_1 + 0x72);
  puVar5 = (unit_struct *)CONCAT22((short)((uint)in_EAX >> 0x10),uVar2);
  local_7 = 0;
  if (((uVar2 != 0) && (puVar5 = unit_land_array[uVar2], (*(byte *)&puVar5->flags_2 & 1) == 0)) &&
     (puVar5->unit_class != '\0')) {
    puVar7 = puVar5;
  }
  if (puVar7 == (unit_struct *)0x0) {
    local_7 = 1;
  }
  else {
    puVar5 = *(unit_struct **)(param_1 + 0xc);
    bVar8 = ((uint)puVar5 & 0x40000000) != 0;
    if (bVar8) {
      *(uint *)(param_1 + 0xc) = (uint)puVar5 & 0xbfffffff;
      *(uint *)(param_1 + 0xc) = (uint)puVar5 & 0xbfdfffff;
      FUN_004d4f40(param_1);
      *(undefined2 *)(param_1 + 0x89) = 1;
    }
    else if ((*(byte *)(param_1 + 0x2e) & 3) != 0) goto LAB_004339fc;
    iVar3 = get_adjacent_unit(puVar7,0);
    if (iVar3 == 0) {
      pvVar1 = &puVar7->pos;
      puVar5 = (unit_struct *)((byte)((ushort)(puVar7->pos).y >> 8) & 0xfffffffe);
      local_6 = CONCAT11((char)puVar5,(char)((ushort)pvVar1->x >> 8)) & 0xfffe;
      if (*(ushort *)(param_1 + 0x89) == local_6) {
        if ((bVar8) || ((*(byte *)(param_1 + 0x2e) & 7) == 0)) {
          uVar4 = FUN_004e9d80(param_1,pvVar1);
          return uVar4 & 0xffffff00;
        }
      }
      else {
        *(ushort *)(param_1 + 0x89) = local_6;
        uVar4 = (int)(short)pvVar1->x - (int)*(short *)(param_1 + 0x3d);
        uVar6 = (int)uVar4 >> 0x1f;
        puVar5 = (unit_struct *)((uVar4 ^ uVar6) - uVar6);
        if (((int)puVar5 < 0x438) &&
           (uVar4 = (int)(short)(puVar7->pos).y - (int)*(short *)(param_1 + 0x3f),
           uVar6 = (int)uVar4 >> 0x1f, puVar5 = (unit_struct *)((uVar4 ^ uVar6) - uVar6),
           (int)puVar5 < 0x438)) {
          if ((bVar8) || ((*(byte *)(param_1 + 0x2e) & 3) == 0)) {
            uVar4 = FUN_004e9dd0(param_1,pvVar1);
            return uVar4 & 0xffffff00;
          }
        }
        else if ((bVar8) || ((*(byte *)(param_1 + 0x2e) & 0xf) == 0)) {
          uVar4 = FUN_004e9d80(param_1,pvVar1);
          return uVar4 & 0xffffff00;
        }
      }
    }
    else {
      if (*(short *)(param_1 + 0x89) == 1) {
        *(undefined2 *)(param_1 + 0x89) = 3;
        FUN_004044b0(iVar3,local_4);
        FUN_004e9d80(param_1,local_4);
      }
      uVar4 = (int)*(short *)(param_1 + 0x4f) - (int)*(short *)(param_1 + 0x3d);
      uVar6 = (int)uVar4 >> 0x1f;
      puVar5 = (unit_struct *)((uVar4 ^ uVar6) - uVar6);
      if (((int)puVar5 < 0x1b8) &&
         (uVar4 = (int)*(short *)(param_1 + 0x51) - (int)*(short *)(param_1 + 0x3f),
         uVar6 = (int)uVar4 >> 0x1f, puVar5 = (unit_struct *)((uVar4 ^ uVar6) - uVar6),
         (int)puVar5 < 0x1b8)) {
        *(uint *)(param_1 + 0x14) = *(uint *)(param_1 + 0x14) | 0x800;
        FUN_004d4690(param_1);
        uVar4 = (int)*(short *)(param_1 + 0x4f) - (int)*(short *)(param_1 + 0x3d);
        uVar6 = (int)uVar4 >> 0x1f;
        puVar5 = (unit_struct *)((uVar4 ^ uVar6) - uVar6);
        if (((int)puVar5 < 0x138) &&
           (uVar4 = (int)*(short *)(param_1 + 0x51) - (int)*(short *)(param_1 + 0x3f),
           uVar6 = (int)uVar4 >> 0x1f, puVar5 = (unit_struct *)((uVar4 ^ uVar6) - uVar6),
           (int)puVar5 < 0x138)) {
          return CONCAT31((int3)((uint)puVar5 >> 8),1);
        }
      }
    }
  }
LAB_004339fc:
  return CONCAT31((int3)((uint)puVar5 >> 8),local_7);
}
