/* Ghidra 12.1.3 pseudocode; entry 004050c0; FUN_004050c0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_004050c0(int param_1)

{
  char *pcVar1;
  uint *puVar2;
  byte bVar3;
  ushort uVar4;
  unit_struct *puVar5;
  bool bVar6;
  unit_related_struct_20B *puVar7;
  char cVar8;
  short sVar9;
  short sVar10;
  short sVar11;
  int iVar12;
  undefined4 extraout_ECX;
  undefined2 uVar14;
  undefined4 extraout_ECX_00;
  undefined4 uVar13;
  unit_struct *puVar15;
  ushort *puVar16;
  undefined1 uStack_20;
  undefined1 uStack_1f;
  undefined2 uStack_1e;
  uint local_1c;
  undefined2 local_18;
  undefined2 local_16;
  undefined2 local_14;
  int local_10;
  undefined4 local_c;
  undefined4 local_8;
  undefined4 local_4;

  bVar6 = false;
  if (((*(byte *)(param_1 + 0x2e) & 0xf) == 0) &&
     (bVar3 = *(byte *)(param_1 + 0x2b), unit_type_array_building[bVar3].unit_type != '\0')) {
    if (*(char *)(param_1 + 0xa6) == '\0') {
      *(uint *)(param_1 + 0x14) = *(uint *)(param_1 + 0x14) & 0xffffefff;
    }
    else {
      iVar12 = *(char *)(param_1 + 0xa6) * 0x800;
      sVar9 = (short)(iVar12 + (iVar12 >> 0x1f & 0xffU) >> 8) + *(short *)(param_1 + 0xa0);
      *(short *)(param_1 + 0xa0) = sVar9;
      if (*(short *)&unit_type_array_building[bVar3].field_0x36 <= sVar9) {
        *(short *)(param_1 + 0xa0) = *(short *)&unit_type_array_building[bVar3].field_0x36;
        iVar12 = FUN_0040b4f0(param_1,0,0,0,0);
        if (iVar12 == 0) {
          bVar6 = true;
        }
      }
      if (bVar6) {
        local_8 = *(undefined4 *)(param_1 + 0x8a);
        local_c = *(undefined4 *)(param_1 + 0x86);
        local_4 = *(undefined4 *)(param_1 + 0x8e);
        local_18 = *(undefined2 *)(param_1 + 0x7a);
        local_16 = *(undefined2 *)(param_1 + 0x7c);
        local_14 = 0;
        ptr_unit_related_20B->field0_0x0 =
             (int)(short)((int)((int)*(short *)(param_1 + 0x26) +
                               ((int)*(short *)(param_1 + 0x26) >> 0x1f & 0x1ffU)) >> 9);
        ptr_unit_related_20B->field1_0x4 = 0;
        ptr_unit_related_20B->unit_ptr = (unit_struct *)0x2;
        ptr_unit_related_20B->field3_0xc = *(short *)(param_1 + 99) + 1;
        puVar7 = ptr_unit_related_20B;
        uVar4 = *(ushort *)(param_1 + 0x94);
        ptr_unit_related_20B->field4_0x10 = (uint)uVar4;
        ptr_unit_related_20B = ptr_unit_related_20B + 1;
        unit_allocation_flag = 1;
        iVar12 = alloc_unit(2,CONCAT31((int3)((uint)puVar7 >> 8),
                                       unit_type_array_building[bVar3].unit_type),
                            CONCAT11((char)(uVar4 >> 8),*(undefined1 *)(param_1 + 0x2f)),&local_18);
        if (iVar12 != 0) {
          *(undefined2 *)(param_1 + 0x94) = 0;
          if ((*(byte *)(param_1 + 0x14) & 0x40) == 0) {
            FUN_00403860(param_1);
            if (*(char *)(param_1 + 0xaf) != -1) {
              FUN_0041b550(*(char *)(param_1 + 0xaf),4,1);
            }
          }
          update_after_unit_alloc(param_1);
          FUN_00498140(iVar12);
          puVar15 = unit_land_array[*(short *)(iVar12 + 0x82)];
          *(undefined2 *)&puVar15->field_0x96 = 0;
          FUN_004ba2c0(puVar15,100);
          sVar9 = FUN_00436c20();
          if (sVar9 != 0) {
            local_1c = CONCAT22(CONCAT11((char)((ushort)(puVar15->pos).y >> 8),
                                         (char)((ushort)(puVar15->pos).x >> 8)),puVar15->unit_index)
                       & 0xfefeffff;
            FUN_00438730(sVar9,6,&local_1c,0x20);
            puVar16 = (ushort *)&local_c;
            do {
              if (*puVar16 != 0) {
                puVar15 = unit_land_array[*puVar16];
                puVar15->flags_2 = puVar15->flags_2 | 0x10;
                FUN_00436ca0(puVar15);
                cVar8 = FUN_00436b90(puVar15,6);
                if (cVar8 != '\0') {
                  FUN_00436d00(puVar15,sVar9,puVar15->hut_people_inside);
                }
              }
              puVar16 = puVar16 + 1;
            } while (puVar16 < &stack0x00000000);
            return;
          }
        }
      }
      else if (((*(byte *)(param_1 + 0x2e) & 0x7f) == 0) &&
              (*(uint *)(param_1 + 0x14) = *(uint *)(param_1 + 0x14) & 0xffffefff,
              iVar12 = *(short *)&unit_type_array_building[bVar3].field_0x36 * 0xc,
              (int)(iVar12 + (iVar12 >> 0x1f & 0xfU)) >> 4 <= (int)*(short *)(param_1 + 0xa0))) {
        iVar12 = FUN_0040b4f0(param_1,0,0,0,0);
        if (iVar12 != 0) {
          iVar12 = 0;
          puVar16 = (ushort *)(param_1 + 0x86);
          uStack_20 = 0;
          uStack_1f = 0;
          uStack_1e = 0;
          uVar13 = extraout_ECX;
          do {
            uVar14 = (undefined2)((uint)uVar13 >> 0x10);
            if (CONCAT22(uStack_1e,CONCAT11(uStack_1f,uStack_20)) != 0) goto LAB_004053c8;
            puVar15 = (unit_struct *)0x0;
            if (((*puVar16 != 0) &&
                (puVar5 = unit_land_array[*puVar16], (*(byte *)&puVar5->flags_2 & 1) == 0)) &&
               (puVar5->unit_class != '\0')) {
              puVar15 = puVar5;
            }
            if (puVar15 != (unit_struct *)0x0) {
              cVar8 = FUN_00436b90(puVar15,7);
              uVar13 = extraout_ECX_00;
              if (cVar8 != '\0') {
                uStack_20 = SUB41(puVar15,0);
                uStack_1f = (undefined1)((uint)puVar15 >> 8);
                uStack_1e = (undefined2)((uint)puVar15 >> 0x10);
              }
            }
            uVar14 = (undefined2)((uint)uVar13 >> 0x10);
            puVar16 = puVar16 + 1;
            iVar12 = iVar12 + 1;
          } while (iVar12 < 6);
          if (CONCAT22(uStack_1e,CONCAT11(uStack_1f,uStack_20)) != 0) {
LAB_004053c8:
            sVar9 = *(short *)(param_1 + 0x26);
            cVar8 = (&objs0_mem[*(short *)(param_1 + 0x33)].shapes_index)
                    [(short)((int)((int)sVar9 + ((int)sVar9 >> 0x1f & 0x1ffU)) >> 9)];
            pcVar1 = (char *)(param_1 + 0x66);
            FUN_004935c0(pcVar1,CONCAT13(uStack_1f,
                                         CONCAT12(uStack_20,
                                                  CONCAT11((char)((ushort)(((short)(char)shapes_mem
                                                                                         [cVar8].
                                                  field7_0x7 +
                                                  (ushort)(byte)shapes_mem[cVar8].y2 * -4) * 0x40 +
                                                  *(short *)(param_1 + 0x7c)) >> 8),
                                                  (char)((ushort)(((short)(char)shapes_mem[cVar8].
                                                                                field6_0x6 +
                                                                  (ushort)(byte)shapes_mem[cVar8].x2
                                                                  * -4) * 0x40 +
                                                                 *(short *)(param_1 + 0x7a)) >> 8)))
                                        ) & 0xfffffefe,CONCAT22(uVar14,sVar9),
                         CONCAT22(uStack_1e,CONCAT11(uStack_1f,uStack_20)));
            if (*pcVar1 != -1) {
              cVar8 = FUN_00493560(*pcVar1,1);
              if (cVar8 == '\0') {
                *(uint *)(param_1 + 0x14) = *(uint *)(param_1 + 0x14) | 0x1000;
                return;
              }
              FUN_004935a0(*pcVar1);
              cVar8 = FUN_00493540(*pcVar1);
              if (cVar8 != '\0') {
                cVar8 = FUN_00493910((int)*pcVar1,&local_10,
                                     CONCAT22(uStack_1e,CONCAT11(uStack_1f,uStack_20)),1,1);
                if (cVar8 == '\0') {
                  sVar9 = FUN_00436c20();
                  if (sVar9 != 0) {
                    sVar10 = FUN_00436c20();
                    if (sVar10 != 0) {
                      sVar11 = FUN_00436c20();
                      if (sVar11 != 0) {
                        local_1c = *(uint *)(local_10 + 0x3d);
                        FUN_00438730(sVar9,7,&local_1c,0x20);
                        local_1c = CONCAT22(local_1c._2_2_,*(undefined2 *)(param_1 + 0x24));
                        FUN_00438730(sVar10,8,&local_1c,0x20);
                        local_1c = CONCAT22(CONCAT11((char)((ushort)*(undefined2 *)(param_1 + 0x3f)
                                                           >> 8),
                                                     (char)((ushort)*(undefined2 *)(param_1 + 0x3d)
                                                           >> 8)),*(undefined2 *)(param_1 + 0x24)) &
                                   0xfefeffff;
                        FUN_00438730(sVar11,6,&local_1c,0x20);
                        iVar12 = CONCAT22(uStack_1e,CONCAT11(uStack_1f,uStack_20));
                        puVar2 = (uint *)(iVar12 + 0xc);
                        *puVar2 = *puVar2 | 0x10;
                        FUN_00436ca0(iVar12);
                        FUN_00436d00(CONCAT22(uStack_1e,CONCAT11(uStack_1f,uStack_20)),sVar9,0);
                        FUN_00436d00(CONCAT22(uStack_1e,CONCAT11(uStack_1f,uStack_20)),sVar10,1);
                        FUN_00436d00(CONCAT22(uStack_1e,CONCAT11(uStack_1f,uStack_20)),sVar11,2);
                        return;
                      }
                    }
                  }
                }
                else if (cVar8 == '\x03') {
                  *(uint *)(param_1 + 0x14) = *(uint *)(param_1 + 0x14) | 0x1000;
                  return;
                }
              }
            }
          }
        }
      }
    }
  }
  return;
}
