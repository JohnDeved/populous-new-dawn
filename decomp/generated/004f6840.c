/* Ghidra 12.1.3 pseudocode; entry 004f6840; FUN_004f6840.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_004f6840(int param_1,int param_2)

{
  byte bVar1;
  int iVar2;
  uint uVar3;
  undefined1 uVar4;
  bool bVar5;
  undefined2 local_6;
  undefined4 local_4;

  if ((*(uint *)(param_1 + 0x596) & 2) == 0) {
    if (*(char *)(param_2 + 0x4f) == '\x14') {
      *(uint *)(param_1 + 0x596) = *(uint *)(param_1 + 0x596) | 2;
    }
    else {
      iVar2 = FUN_004f2290(param_1,param_2);
      bVar5 = false;
      if (iVar2 != 0) goto LAB_004f68c0;
      *(uint *)(param_1 + 0x596) = *(uint *)(param_1 + 0x596) | 2;
    }
    *(char *)(param_1 + 0x5b3) = (char)(((param_2 - param_1) + -0x36) / 0x52);
    bVar5 = true;
  }
  else {
    bVar5 = ((param_2 - param_1) + -0x36) / 0x52 == (uint)*(byte *)(param_1 + 0x5b3);
  }
LAB_004f68c0:
  if (bVar5) {
    for (iVar2 = *(int *)(param_1 + 0x881); iVar2 != 0; iVar2 = *(int *)(iVar2 + 8)) {
      if (*(char *)(iVar2 + 0x2c) == '\x0e') {
        FUN_00436ca0(iVar2);
        FUN_004e9b40(iVar2);
        if ((*(byte *)(iVar2 + 0xe) & 0x10) == 0) {
          *(undefined1 *)(iVar2 + 0x7d) = *(undefined1 *)(iVar2 + 0x2c);
          if ((game_state.level_flags & 2) == 0) {
            bVar1 = *(byte *)(iVar2 + 0x2b);
LAB_004f6929:
            uVar4 = unit_type_array_person[bVar1].next_state;
          }
          else {
            bVar1 = *(byte *)(iVar2 + 0x2b);
            if (bVar1 != 7) goto LAB_004f6929;
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
                       [(ushort)(&game_state.level_data[0].unit_index_2)[uVar3 * 2] & 0x3ff],
                       &local_4);
        }
        *(undefined4 *)(iVar2 + 0x68) = local_4;
        FUN_00405090((undefined4 *)(iVar2 + 0x68));
        *(byte *)(iVar2 + 0x82) = *(byte *)(iVar2 + 0x82) & 0xf0;
        *(undefined1 *)(iVar2 + 0x82) = 0;
      }
    }
    if (((param_2 - param_1) + -0x36) / 0x52 == (uint)*(byte *)(param_1 + 0x5b3)) {
      *(uint *)(param_1 + 0x596) = *(uint *)(param_1 + 0x596) & 0xfffffffd;
      *(undefined1 *)(param_1 + 0x5b3) = 10;
    }
  }
  return;
}
