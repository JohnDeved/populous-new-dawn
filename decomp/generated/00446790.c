/* Ghidra 12.1.3 pseudocode; entry 00446790; FUN_00446790.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


/* WARNING: Removing unreachable block (ram,0x0044688f) */

undefined1 FUN_00446790(int param_1)

{
  unit_struct *puVar1;
  short sVar2;
  uint uVar3;
  uint uVar4;
  undefined1 uVar5;
  unit_struct *puVar6;

  uVar5 = 0;
  puVar6 = (unit_struct *)0x0;
  if (((*(ushort *)(param_1 + 0x86) != 0) &&
      (puVar1 = unit_land_array[*(ushort *)(param_1 + 0x86)], (*(byte *)&puVar1->flags_2 & 1) == 0))
     && (puVar1->unit_class != '\0')) {
    puVar6 = puVar1;
  }
  if ((puVar6 == (unit_struct *)0x0) || ((short)puVar6->loc_2_z < 1)) {
    uVar5 = 2;
  }
  else {
    sVar2 = *(short *)(param_1 + 0x84) + -1;
    *(short *)(param_1 + 0x84) = sVar2;
    if (sVar2 < 1) {
      return 2;
    }
    if ((*(byte *)(param_1 + 0x2e) & 7) == 0) {
      FUN_004e9d80(param_1,&puVar6->pos);
    }
    uVar3 = (int)(short)(puVar6->pos).x - (int)*(short *)(param_1 + 0x3d);
    uVar4 = (int)uVar3 >> 0x1f;
    if (((int)((uVar3 ^ uVar4) - uVar4) < 0x42) &&
       (uVar3 = (int)(short)(puVar6->pos).y - (int)*(short *)(param_1 + 0x3f),
       uVar4 = (int)uVar3 >> 0x1f, (int)((uVar3 ^ uVar4) - uVar4) < 0x42)) {
      uVar3 = game_state.pseudo_random_val * 0x24a1 + 0x24df;
      game_state.pseudo_random_val = uVar3 >> 0xd | uVar3 * 0x80000;
      *(ushort *)(param_1 + 0x8a) =
           *(ushort *)&unit_type_creature_ARRAY_005a7848[*(byte *)(param_1 + 0x2b)].field_0xa +
           (short)(game_state.pseudo_random_val %
                  (uint)((int)(uint)*(ushort *)
                                     &unit_type_creature_ARRAY_005a7848[*(byte *)(param_1 + 0x2b)].
                                      field_0xa >> 1));
      FUN_004a79f0(puVar6,(uint)(byte)unit_type_creature_ARRAY_005a7848[*(byte *)(param_1 + 0x2b)].
                                      field_0x14 * -4,0xffffffff);
      if (0 < (short)puVar6->loc_2_z) {
        *(undefined2 *)(param_1 + 0x86) = 0;
      }
      return 7;
    }
  }
  return uVar5;
}
