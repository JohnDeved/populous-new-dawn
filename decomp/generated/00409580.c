/* Ghidra 12.1.3 pseudocode; entry 00409580; FUN_00409580.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


int FUN_00409580(int param_1)

{
  ushort uVar1;
  unit_struct *puVar2;
  bool bVar3;
  int iVar4;
  uint uVar5;
  char *pcVar6;
  unit_struct *puVar7;
  int local_10;
  unit_struct *local_c;
  unit_struct *local_8;
  int local_4;

  iVar4 = 0;
  local_c = (unit_struct *)0x0;
  puVar7 = (unit_struct *)0x0;
  local_10 = -1;
  if (((*(ushort *)(param_1 + 0xa2) != 0) &&
      (puVar2 = unit_land_array[*(ushort *)(param_1 + 0xa2)], (*(byte *)&puVar2->flags_2 & 1) == 0))
     && (puVar2->unit_class != '\0')) {
    puVar7 = puVar2;
  }
  if (puVar7 == (unit_struct *)0x0) {
    *(undefined2 *)(param_1 + 0xa2) = 0;
  }
  local_4 = 0;
  puVar2 = local_c;
  while (local_c = puVar7, local_c != (unit_struct *)0x0) {
    local_8 = (unit_struct *)0x0;
    uVar1 = *(ushort *)((int)&local_c->loc_2_z + 1);
    if (((uVar1 != 0) && (puVar7 = unit_land_array[uVar1], (*(byte *)&puVar7->flags_2 & 1) == 0)) &&
       (puVar7->unit_class != '\0')) {
      local_8 = puVar7;
    }
    bVar3 = false;
    if ((local_c->unit_class == '\x01') && ((local_c->state == '\n' || (local_c->state == '\x0e'))))
    {
      pcVar6 = (char *)0x0;
      uVar5 = (uint)*(ushort *)&local_c->field_0x9b;
      if ((uVar5 != 0) ||
         (uVar5 = (uint)*(ushort *)
                         ((int)&local_c->loc_3_z + (uint)(byte)local_c->hut_people_inside * 2 + 1),
         uVar5 != 0)) {
        pcVar6 = (char *)((int)(game_state.sunlight_array + 0x32) + uVar5 * 10);
      }
      if ((((pcVar6 != (char *)0x0) && ((pcVar6[1] & 1U) == 0)) && (*pcVar6 == '\b')) &&
         ((*(short *)(param_1 + 0x24) == *(short *)(pcVar6 + 6) && (local_c->state_2 == '\x03')))) {
        bVar3 = true;
      }
    }
    if (bVar3) {
      iVar4 = iVar4 + 1;
    }
    else {
      if (puVar2 == (unit_struct *)0x0) {
        *(ushort *)(param_1 + 0xa2) = uVar1;
      }
      else {
        *(ushort *)((int)&puVar2->loc_2_z + 1) = uVar1;
      }
      if (local_10 < 0) {
        local_10 = local_4;
      }
      *(undefined2 *)((int)&local_c->loc_2_z + 1) = 0;
      local_c->flags_3 = local_c->flags_3 & 0xffffffdf;
      local_c = puVar2;
    }
    local_4 = local_4 + 1;
    puVar7 = local_8;
    puVar2 = local_c;
  }
  if (local_10 < 0) {
    local_10 = 0;
  }
  if (0xff < local_10) {
    local_10 = 0xff;
  }
  *(byte *)(param_1 + 0x9d) = *(byte *)(param_1 + 0x9d) | 0x20;
  *(undefined1 *)(param_1 + 0xac) = (undefined1)local_10;
  return iVar4;
}
