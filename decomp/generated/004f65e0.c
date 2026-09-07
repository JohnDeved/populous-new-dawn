/* Ghidra 12.1.3 pseudocode; entry 004f65e0; FUN_004f65e0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_004f65e0(int param_1)

{
  byte bVar1;
  int iVar2;
  uint uVar3;
  undefined1 uVar4;
  undefined2 local_6;
  undefined4 local_4;

  iVar2 = *(int *)(param_1 + 0x881);
  do {
    if (iVar2 == 0) {
      game_state.level_flags = game_state.level_flags;
      game_state.field2_0x5 = game_state.field2_0x5;
      game_state.field3_0x6 = game_state.field3_0x6;
      game_state.field4_0x7 = game_state.field4_0x7;
      return;
    }
    if (*(char *)(iVar2 + 0x2c) == '\x0e') {
      FUN_00436ca0(iVar2);
      FUN_004e9b40(iVar2);
      if ((*(uint *)(iVar2 + 0xc) & 0x100000) == 0) {
        *(undefined1 *)(iVar2 + 0x7d) = *(undefined1 *)(iVar2 + 0x2c);
        if ((game_state._4_4_ & 2) == 0) {
          bVar1 = *(byte *)(iVar2 + 0x2b);
LAB_004f6654:
          uVar4 = unit_type_array_person[bVar1].next_state;
        }
        else {
          bVar1 = *(byte *)(iVar2 + 0x2b);
          if (bVar1 != 7) goto LAB_004f6654;
          uVar4 = 0x27;
        }
        empty_unit_function(iVar2);
        *(undefined1 *)(iVar2 + 0x2c) = uVar4;
        init_unit_class(iVar2);
      }
      local_4 = *(undefined4 *)(iVar2 + 0x3d);
      local_6 = CONCAT11((char)((uint)local_4 >> 0x18),(char)((uint)local_4 >> 8));
      uVar3 = (local_6 & 0xfe) * 2 | local_6 & 0xfe00;
      if ((*(byte *)((int)&game_state.level_data[0].flags + uVar3 * 4 + 1) & 2) != 0) {
        FUN_004044b0(unit_land_array
                     [(ushort)(&game_state.level_data[0].unit_index_2)[uVar3 * 2] & 0x3ff],&local_4)
        ;
      }
      *(undefined4 *)(iVar2 + 0x68) = local_4;
      *(ushort *)(iVar2 + 0x68) = ((ushort)local_4 & 0xfe00) + 0x100;
      *(ushort *)(iVar2 + 0x6a) = (*(ushort *)(iVar2 + 0x6a) & 0xfe00) + 0x100;
      *(byte *)(iVar2 + 0x82) = *(byte *)(iVar2 + 0x82) & 0xf0;
      *(undefined1 *)(iVar2 + 0x82) = 0;
    }
    iVar2 = *(int *)(iVar2 + 8);
  } while( true );
}
