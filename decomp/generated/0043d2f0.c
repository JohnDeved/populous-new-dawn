/* Ghidra 12.1.3 pseudocode; entry 0043d2f0; FUN_0043d2f0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


undefined1 FUN_0043d2f0(int param_1)

{
  ushort uVar1;
  undefined2 uVar2;
  undefined2 uVar3;
  unit_struct *puVar4;
  bool bVar5;
  char cVar6;
  int iVar7;
  uint uVar8;
  undefined1 *puVar9;
  unit_struct *puVar10;
  undefined1 local_7;
  ushort local_6;
  undefined2 local_4;
  ushort local_2;

  local_7 = 0;
  uVar1 = *(ushort *)(param_1 + 0xa1);
  if (uVar1 != 0) {
    if ((*(short *)(param_1 + 0x9f) == 0) || (bVar5 = true, (*(byte *)(param_1 + 0x13) & 2) == 0)) {
      bVar5 = false;
    }
    if (!bVar5) {
      puVar10 = (unit_struct *)0x0;
      if (((uVar1 != 0) && (puVar4 = unit_land_array[uVar1], (*(byte *)&puVar4->flags_2 & 1) == 0))
         && (puVar4->unit_class != '\0')) {
        puVar10 = puVar4;
      }
      if ((puVar10 != (unit_struct *)0x0) && (puVar10->unit_class == '\x04')) {
        if (((((unit_type_array_vehicle[(byte)puVar10->unit_type].field_0x15 & 1) != 0) &&
             ((puVar10->tribe_index == *(char *)(param_1 + 0x2f) || (puVar10->field_0x9e == '\0'))))
            && ((char)puVar10->field_0x9e <
                (char)unit_type_array_vehicle[(byte)puVar10->unit_type].field_0x8)) &&
           (((cVar6 = FUN_00465750(puVar10), cVar6 != '\0' &&
             (cVar6 = FUN_005178d0(param_1,&puVar10->pos), cVar6 == '\0')) &&
            (iVar7 = calc_distance_toroidal(param_1 + 0x3d,&puVar10->pos), iVar7 < 0x3001)))) {
          cVar6 = '\0';
          if ((*(byte *)(param_1 + 0x11) & 8) == 0) {
            cVar6 = '\x01' - ((1 << (*(byte *)(param_1 + 0x2b) & 0x1f) & DAT_005a7fa8) == 0);
          }
          else if ((DAT_005a7fb1 & 4) != 0) {
            cVar6 = '\x01';
          }
          iVar7 = 0;
          if (cVar6 != '\0') {
            uVar8 = 0;
            bVar5 = false;
            puVar9 = (undefined1 *)
                     ((int)(game_state.sunlight_array + 0x32) + (short)game_state._841984_2_ * 10);
            do {
              if (&game_state.field_0x9d5f7 < puVar9) {
                puVar9 = &game_state.field_0x9b6c2;
              }
              if (*(short *)(puVar9 + 2) == 0) {
                bVar5 = true;
                break;
              }
              iVar7 = iVar7 + 1;
              puVar9 = puVar9 + 10;
            } while (iVar7 < 800);
            if (bVar5) {
              puVar9[1] = 0;
              *puVar9 = 0;
              uVar8 = (int)(puVar9 + -0x938830) / 10;
              *(undefined2 *)(puVar9 + 4) = 0;
              game_state._841984_2_ = (short)uVar8 + 1;
              if (799 < (short)game_state._841984_2_) {
                game_state._841984_2_ = 1;
              }
            }
            uVar8 = uVar8 & 0xffff;
            if (uVar8 != 0) {
              local_7 = 1;
              local_4 = *(undefined2 *)(param_1 + 0xa1);
              uVar2 = (puVar10->pos).x;
              uVar3 = (puVar10->pos).y;
              *(undefined1 *)(param_1 + 0xa6) = 0;
              local_6 = CONCAT11((char)((ushort)uVar3 >> 8),(char)((ushort)uVar2 >> 8)) & 0xfefe;
              local_2 = local_6;
              FUN_00438730(uVar8,0x16,&local_4,0x20);
              FUN_00436d00(param_1,uVar8,*(undefined1 *)(param_1 + 0xa6));
            }
          }
        }
      }
    }
    *(undefined2 *)(param_1 + 0xa1) = 0;
  }
  return local_7;
}
