/* Ghidra 12.1.3 pseudocode; entry 004aa8b0; FUN_004aa8b0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */

void FUN_004aa8b0(char param_1,char param_2,char param_3)

{
  char cVar1;
  ushort uVar2;
  int iVar3;
  char cVar4;
  undefined4 uVar5;
  ushort local_a;
  undefined4 local_8;
  undefined2 local_4;

  if (DAT_00895e9b != '\0') {
    cVar1 = *(char *)((int)game_state.tribes_array[player_tribe_num].field1341_0x8bf + 1);
    cVar4 = '\0';
    if (cVar1 < '\a') {
      cVar4 = param_1;
    }
    uVar2 = (ushort)*(byte *)((int)&DAT_00895ea0 + (uint)DAT_00895e9d);
    local_8 = CONCAT22(local_8._2_2_,uVar2);
    if (uVar2 == 1) {
      uVar5 = 0x27;
    }
    else {
      if (uVar2 != 2) {
        local_8 = CONCAT22((short)DAT_00895e7e,uVar2);
        iVar3 = (-(uint)(cVar4 == '\0') & 0x20) + 0x37 + (int)cVar1;
        if (param_2 != '\0') {
          _minimap_centre_x = _minimap_centre_x | 0x20000;
        }
        if (param_3 != '\0') {
          _minimap_centre_x = _minimap_centre_x | 0x40000;
        }
        set_tribe_command(CONCAT31((int3)((uint)iVar3 >> 8),player_tribe_num),iVar3,local_8,
                          _minimap_centre_x);
        DAT_0089bc26 = (undefined2)_minimap_centre_x;
        _minimap_centre_x = _minimap_centre_x & 0xfff9ffff;
        _DAT_0089bc22 = game_state.offset_counter;
        if (cVar4 != '\0') {
          FUN_004386d0();
          FUN_004358f0();
          FUN_00437010(1);
        }
        if (unit_index_1 == 0) {
          if (unit_index_2 == 0) {
            DAT_0089bc20 = 0;
            local_a = _minimap_centre_x & 0xfefe;
            local_8 = CONCAT22(((local_a >> 8) + 1) * 0x100,((_minimap_centre_x & 0xfe) + 1) * 0x100
                              );
            local_4 = 0;
            iVar3 = alloc_unit_2(7,0x3d,player_tribe_num,&local_8);
            if (iVar3 != 0) {
              *(short *)(iVar3 + 0x41) = *(short *)(iVar3 + 0x41) + -0xa0;
              *(undefined2 *)(iVar3 + 0x6c) = 4;
            }
            DAT_0089bc1e = 5;
            FUN_0048a050(0,0x6a,1);
          }
          else if (unit_index_2 != 0) {
            DAT_0089bc20 = unit_index_2;
            DAT_0089bc1e = 5;
            FUN_0048a050(0,0x6a,1);
          }
        }
        else if (unit_index_1 != 0) {
          DAT_0089bc20 = unit_index_1;
          DAT_0089bc1e = 5;
          FUN_0048a050(0,0x6a,1);
        }
        goto LAB_004aaad6;
      }
      uVar5 = 0x1e;
    }
    set_tribe_command(player_tribe_num,uVar5,0,0);
  }
LAB_004aaad6:
  FUN_0047a550(0,player_tribe_num * 0xc65 + 0x89d1c8);
  return;
}
