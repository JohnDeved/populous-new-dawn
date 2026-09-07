/* Ghidra 12.1.3 pseudocode; entry 0048a900; FUN_0048a900.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */

void FUN_0048a900(void)

{
  ushort uVar1;
  ushort uVar2;
  undefined4 *puVar3;
  unit_struct *puVar4;
  undefined4 *puVar5;
  int iVar6;
  undefined4 uVar7;
  bool bVar8;
  unit_struct *puVar9;
  undefined1 local_130 [12];
  undefined4 local_124;
  undefined1 local_98 [152];

  puVar3 = DAT_0089ce6d;
  while( true ) {
    while( true ) {
      while( true ) {
        puVar5 = puVar3;
        if (puVar5 == (undefined4 *)0x0) {
          return;
        }
        uVar1 = *(ushort *)(puVar5 + 6);
        puVar3 = (undefined4 *)*puVar5;
        if ((uVar1 & 8) == 0) break;
        puVar9 = (unit_struct *)0x0;
        uVar2 = *(ushort *)(puVar5 + 3);
        if (((uVar2 != 0) && (puVar4 = unit_land_array[uVar2], (*(byte *)&puVar4->flags_2 & 1) == 0)
            ) && (puVar4->unit_class != '\0')) {
          puVar9 = puVar4;
        }
        if (puVar9 == (unit_struct *)0x0) {
          if (uVar2 == 0) {
            FUN_0048ae00(puVar5);
          }
          else {
            FUN_0048ad50();
          }
        }
        else if (((&DAT_005acf64)[(uint)*(ushort *)(puVar5 + 4) * 0xc] == -1) ||
                ((uint)(byte)(puVar9->object).f2 ==
                 (int)(char)(&DAT_005acf64)[(uint)*(ushort *)(puVar5 + 4) * 0xc])) {
          if ((uVar1 & 0x10) == 0) {
            FUN_0048ae00(puVar5);
          }
          else if ((uint)*(ushort *)((int)puVar5 + 0x1a) == (int)(short)(puVar9->object).obj_index)
          {
            FUN_0048ae00();
          }
          else {
            FUN_0048ad50(puVar5);
          }
        }
      }
      if ((uVar1 & 0x20) == 0) break;
      if ((uVar1 & 0x10) == 0) {
        FUN_0048ad50(puVar5);
      }
      else {
        puVar9 = (unit_struct *)0x0;
        if (((*(ushort *)(puVar5 + 3) != 0) &&
            (puVar4 = unit_land_array[*(ushort *)(puVar5 + 3)], (*(byte *)&puVar4->flags_2 & 1) == 0
            )) && (puVar4->unit_class != '\0')) {
          puVar9 = puVar4;
        }
        if ((puVar9 == (unit_struct *)0x0) ||
           ((uint)*(ushort *)((int)puVar5 + 0x1a) != (int)(short)(puVar9->object).obj_index)) {
          FUN_0048ad50(puVar5);
        }
        else {
          *(ushort *)(puVar5 + 6) = uVar1 & 0xffdf;
          *(ushort *)(puVar5 + 6) = uVar1 & 0xffdf | 8;
          if (puVar5[7] != 0) {
            free_2(puVar5[7]);
            puVar5[7] = 0;
          }
          _DAT_005ae29c = _DAT_005ae29c + 1;
        }
      }
    }
    uVar2 = *(ushort *)(puVar5 + 3);
    bVar8 = true;
    puVar9 = (unit_struct *)0x0;
    if (((uVar2 != 0) && (puVar4 = unit_land_array[uVar2], (puVar4->flags_2 & 1) == 0)) &&
       (puVar4->unit_class != '\0')) {
      puVar9 = puVar4;
    }
    if ((uVar1 & 4) == 0) break;
    FUN_004895c0(puVar5,1);
LAB_0048ab3c:
    if (puVar5[8] != 0) {
LAB_0048ab42:
      if (bVar8) {
        FUN_0056ccf0();
        uVar7 = FUN_0056e650(*(undefined4 *)(puVar5[8] + 4),0,*(undefined4 *)(puVar5[8] + 8));
        FUN_0056ce10(uVar7);
        local_124 = 0x3c;
        (**(code **)(*sound_related + 0x14))(puVar5[2],local_130);
        (*(code *)**(undefined4 **)puVar5[8])();
      }
    }
  }
  if ((uVar1 & 1) != 0) goto LAB_0048ab3c;
  if (puVar9 == (unit_struct *)0x0) {
    if (((uVar2 != 0) && ((uVar1 & 0x42) != 0)) && ((uVar1 & 0x200) == 0)) {
      FUN_0048b010(puVar5,1);
    }
    goto LAB_0048ab3c;
  }
  iVar6 = FUN_0048b100(puVar5,1);
  if (iVar6 == 0) {
    bVar8 = false;
    goto LAB_0048ab3c;
  }
  if (puVar5[8] == 0) {
    FUN_0056ccf0();
    uVar7 = __ftol();
    uVar7 = FUN_0056e680(uVar7,(0x7f - (uint)*(byte *)(puVar5 + 10)) * 0x10,0);
    FUN_0056ce10(uVar7);
    (**(code **)(*sound_related + 0x14))(puVar5[2],local_98);
    goto LAB_0048ab3c;
  }
  goto LAB_0048ab42;
}
