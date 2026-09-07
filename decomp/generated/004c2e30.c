/* Ghidra 12.1.3 pseudocode; entry 004c2e30; FUN_004c2e30.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


int FUN_004c2e30(int param_1,char param_2,byte param_3)

{
  short sVar1;
  unit_struct *puVar2;
  int iVar3;
  int iVar4;
  undefined2 local_2;

  if ((game_state.tribes_array[param_2].field_0x93f & 8) == 0) {
    if ((game_state.level_flags & 0x20) != 0) {
      return *(int *)(&DAT_005a80f2 + (uint)param_3 * 0x3e);
    }
    sVar1 = *(short *)(param_1 + 0x41);
    iVar3 = (int)(short)((int)((int)sVar1 + ((int)sVar1 >> 0x1f & 0x7fU)) >> 7);
    if (iVar3 < 0) {
      iVar3 = 0;
    }
    iVar4 = iVar3;
    if (7 < iVar3) {
      iVar4 = 7;
    }
    if (iVar3 < 7) {
      iVar3 = ((int)sVar1 + iVar4 * -0x80) * 0x100;
      iVar3 = ((int)(iVar3 + (iVar3 >> 0x1f & 0x7fU)) >> 7) *
              ((&DAT_005aa53c)[iVar4] - (&DAT_005aa538)[iVar4]);
      iVar3 = ((int)(iVar3 + (iVar3 >> 0x1f & 0xffU)) >> 8) + (&DAT_005aa538)[iVar4];
    }
    else {
      iVar3 = (&DAT_005aa538)[iVar4];
    }
    iVar4 = iVar3 * *(int *)(&DAT_005a80ee + (uint)param_3 * 0x3e) +
            (iVar3 * *(int *)(&DAT_005a80ee + (uint)param_3 * 0x3e) >> 0x1f & 0xffU);
    iVar3 = iVar4 >> 8;
    if ((*(byte *)(param_1 + 0xe) & 0x80) != 0) {
      local_2 = CONCAT11((char)((ushort)*(undefined2 *)(param_1 + 0x3f) >> 8),
                         (char)((ushort)*(undefined2 *)(param_1 + 0x3d) >> 8));
      puVar2 = unit_land_array
               [(ushort)(&game_state.level_data[0].unit_index_2)
                        [((local_2 & 0xfe) * 2 | local_2 & 0xfe00) * 2] & 0x3ff];
      if ((((puVar2 != (unit_struct *)0x0) && (puVar2->unit_class == '\x02')) &&
          (puVar2->unit_type == '\x04')) && (puVar2->state == '\x02')) {
        return iVar3 + (int)(CONCAT44(iVar4 >> 0x1f,iVar3) / 3);
      }
    }
  }
  else {
    iVar3 = 0xfffffff;
  }
  return iVar3;
}
