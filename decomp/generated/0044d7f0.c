/* Ghidra 12.1.3 pseudocode; entry 0044d7f0; FUN_0044d7f0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


uint FUN_0044d7f0(char param_1,ushort param_2,undefined2 param_3)

{
  ushort uVar1;
  uint uVar2;
  unit_struct *puVar3;
  unit_struct *puVar4;
  int iVar5;
  ushort local_2;

  DAT_0068c6a5 = 0;
  DAT_0068c6af = 0;
  DAT_0068b6a1 = 0;
  DAT_0068c6bb = 0;
  DAT_0068c6c0 = 0;
  DAT_0068c6bd = 0;
  DAT_0068c6a1 = 0;
  DAT_0068c6bf = 0;
  uVar2 = (param_2 & 0xfe) * 2 | param_2 & 0xfe00;
  puVar3 = (unit_struct *)(uVar2 * 4 + 0x8a03e4);
  switch(param_1) {
  case '\x01':
    puVar3 = (unit_struct *)(int)(short)(&game_state.level_data[0].unit_index)[uVar2 * 2];
    puVar4 = unit_land_array[(int)puVar3];
    if (puVar4 != (unit_struct *)0x0) {
      do {
        if ((puVar4->unit_class == '\x05') && (puVar4->unit_type == '\t')) break;
        puVar3 = (unit_struct *)(uint)puVar4->next_unit_index;
        puVar4 = unit_land_array[(int)puVar3];
      } while (puVar4 != (unit_struct *)0x0);
      if (puVar4 != (unit_struct *)0x0) {
        DAT_0068c6bb = puVar4->unit_index;
        DAT_0068c6c0 = 6;
        DAT_0068c6bd = param_3;
        iVar5 = FUN_004f0f90(puVar4,&local_2);
        puVar3 = (unit_struct *)0x0;
        if (iVar5 != 0) {
          uVar2 = _swprintf(&DAT_0068b6a1,u__s_00599970,(&DAT_00972ba8)[iVar5]);
          return uVar2 & 0xffffff00;
        }
      }
    }
    break;
  case '\x02':
    if ((*(byte *)((int)&game_state.level_data[0].flags + uVar2 * 4 + 1) & 2) != 0) {
      uVar1 = (&game_state.level_data[0].unit_index_2)[uVar2 * 2];
      puVar3 = (unit_struct *)(CONCAT22((short)((uint)puVar3 >> 0x10),uVar1) & 0xffff03ff);
      puVar4 = unit_land_array[uVar1 & 0x3ff];
      if (puVar4 != (unit_struct *)0x0) {
        DAT_0068c6bb = (ushort)puVar3;
        DAT_0068c6bd = param_3;
        DAT_0068c6c0 = 6;
        iVar5 = FUN_004f0f90(puVar4,&local_2);
        puVar3 = (unit_struct *)0x0;
        if (iVar5 != 0) {
          if (((char)local_2 == '\x01') && (puVar4->tribe_index != -1)) {
            uVar2 = printf_internal(&DAT_0068b6a1,(&DAT_00972ba8)[iVar5],
                                    (char)puVar4->tribe_index * 0x22 + 0x8a035c);
            return uVar2 & 0xffffff00;
          }
          uVar2 = _swprintf(&DAT_0068b6a1,u__s_00599970,(&DAT_00972ba8)[iVar5]);
          return uVar2 & 0xffffff00;
        }
      }
    }
    break;
  case '\x03':
  case '\x05':
  case '\x06':
  case '\a':
  case '\b':
    puVar3 = game_state.tribes_array[player_tribe_num].shaman;
    if (puVar3 != (unit_struct *)0x0) {
      switch(param_1) {
      case '\x03':
        iVar5 = 0x256;
        break;
      default:
        iVar5 = 0;
        break;
      case '\x05':
        iVar5 = 600;
        break;
      case '\x06':
        iVar5 = 600;
        break;
      case '\a':
        iVar5 = 600;
        break;
      case '\b':
        iVar5 = 0x259;
      }
      if (iVar5 != 0) {
        DAT_0068c6bb = puVar3->unit_index;
        DAT_0068c6bd = param_3;
        DAT_0068c6bf = 1;
        DAT_0068c6c0 = 4;
        uVar2 = _swprintf(&DAT_0068b6a1,u__s_00599970,(&DAT_00972ba8)[iVar5]);
        return uVar2 & 0xffffff00;
      }
    }
    break;
  case '\x04':
  case '\n':
    DAT_0068c6c0 = 8;
    DAT_0068c6bd = param_3;
    DAT_0068c6bf = 1;
    local_2 = CONCAT11((char)((ushort)DAT_0087cae4 >> 8),(char)((ushort)minimap_related_pos >> 8)) &
              0xfefe;
    DAT_0068c6bb = local_2;
    uVar2 = _swprintf(&DAT_0068b6a1,u__s_00599970,
                      (&DAT_00972ba8)[(-(uint)(param_1 == '\x04') & 0xfffffff4) + 0x261]);
    return uVar2 & 0xffffff00;
  case '\t':
    DAT_0068c6bd = param_3;
    DAT_0068c6bb = DAT_0089bc26;
    DAT_0068c6c0 = 8;
    DAT_0068c6bf = 1;
    _swprintf(&DAT_0068b6a1,u__s_00599970,DAT_00973514);
    puVar3 = (unit_struct *)FUN_0048a050(0,0xe1,1);
  }
  return (uint)puVar3 & 0xffffff00;
}
