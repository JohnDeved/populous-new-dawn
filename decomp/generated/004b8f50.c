/* Ghidra 12.1.3 pseudocode; entry 004b8f50; FUN_004b8f50.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_004b8f50(void)

{
  ushort *puVar1;
  short sVar2;
  int iVar3;
  undefined4 uVar4;
  unit_struct *puVar5;
  char cVar6;
  byte bStack_d;
  uint local_c;
  short local_8;
  short sStack_6;
  undefined2 local_4;

  if (DAT_0089c6e7 == '\a') {
    land_flags_1 = land_flags_1 & 0xffdfffff;
    sVar2 = *(short *)(&DAT_005a8858 + DAT_00895de0 * 0x12);
    if ((sVar2 != 0x11) && ((DAT_00895dd4 & 0x10000) != 0)) {
      FUN_004b9190(DAT_00895dd4,CONCAT22((short)((uint)(DAT_00895de0 * 2) >> 0x10),sVar2),
                   DAT_00895de5,0,1);
    }
    DAT_00895de5 = (&DAT_005a885a)[DAT_00895de0 * 0x12];
    iVar3 = DAT_00895de0 * 0x12;
    DAT_00895dd4 = minimap_state_and_cache;
    if ((minimap_state_and_cache & 0x10000) != 0) {
      if (sVar2 != 0x11) {
        FUN_004b9190(minimap_state_and_cache,
                     CONCAT22((short)((uint)iVar3 >> 0x10),*(undefined2 *)(&DAT_005a8858 + iVar3)),
                     DAT_00895de5,player_tribe_num,0);
        return;
      }
      local_c = minimap_state_and_cache & 0xffff;
      cVar6 = FUN_004b98f0(local_c,0,0);
      if (cVar6 == '\0') {
        land_flags_1 = land_flags_1 | 0x200000;
        if (PTR_008922d8 != (unit_struct *)0x0) {
          FUN_004ef180(PTR_008922d8);
          PTR_008922d8 = (unit_struct *)0x0;
        }
      }
      else {
        bStack_d = (byte)(minimap_state_and_cache >> 8) & 0xfe;
        local_8 = (((ushort)minimap_state_and_cache & 0xfe) + 1) * 0x100;
        uVar4 = CONCAT22(sStack_6,local_8);
        sStack_6 = (bStack_d + 1) * 0x100;
        local_4 = calc_point_height(uVar4,CONCAT22(local_4,sStack_6));
        if ((PTR_008922d8 == (unit_struct *)0x0) &&
           (PTR_008922d8 = (unit_struct *)alloc_unit_2(10,0x10,player_tribe_num,&local_8),
           PTR_008922d8 != (unit_struct *)0x0)) {
          puVar1 = &(PTR_008922d8->object).flags;
          *puVar1 = *puVar1 & 0xff7f;
          puVar5 = PTR_008922d8;
          puVar5->coord_scale_3 = 0;
          puVar5->coord_scale_1 = 0;
        }
        local_c = minimap_state_and_cache & 0xffff;
        cVar6 = FUN_004b98f0(local_c,0,0);
        if (cVar6 == '\0') {
          land_flags_1 = land_flags_1 | 0x200000;
        }
        if (PTR_008922d8 != (unit_struct *)0x0) {
          add_unit_to_cell(PTR_008922d8,&local_8);
          return;
        }
      }
    }
  }
  return;
}
