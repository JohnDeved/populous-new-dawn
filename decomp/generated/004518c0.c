/* Ghidra 12.1.3 pseudocode; entry 004518c0; FUN_004518c0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


/* WARNING: Removing unreachable block (ram,0x004519fd) */
/* WARNING: Removing unreachable block (ram,0x00451a07) */

int FUN_004518c0(int param_1,uint param_2,int param_3,undefined4 *param_4,undefined4 param_5,
                char param_6)

{
  undefined4 uVar1;
  int iVar2;
  bool bVar3;
  char cVar4;
  ushort uVar5;
  short sVar6;
  int iVar7;
  uint uVar8;
  uint uVar9;
  short local_1c;
  short local_1a;
  int local_18;
  int local_14;
  int local_10;
  int local_c;
  undefined4 local_8;
  undefined2 local_4;

  local_c = 0;
  local_18 = param_1 * 0xc65 + 0x89d1c8;
  if ((game_state.tribes_array[param_1].field_0x93d & 0x80) == 0) {
    local_14 = 0xfffffff;
  }
  else {
    local_14 = fast_sqrt(0x2400000);
  }
  local_10 = 1;
  do {
    if (local_c != 0) {
      return local_c;
    }
    uVar1 = *param_4;
    local_4 = *(undefined2 *)(param_4 + 1);
    local_8._0_2_ = (ushort)uVar1;
    local_1c = ((ushort)local_8 & 0xfe00) + 0x100;
    local_8._2_2_ = (ushort)((uint)uVar1 >> 0x10);
    local_1a = (local_8._2_2_ & 0xfe00) + 0x100;
    local_8 = uVar1;
    for (iVar2 = *(int *)(local_18 + 0x881); iVar2 != 0; iVar2 = *(int *)(iVar2 + 8)) {
      cVar4 = FUN_004e3430(iVar2,param_5);
      if ((cVar4 != '\0') && ((param_2 == 0 || (*(byte *)(iVar2 + 0x2b) == param_2)))) {
        bVar3 = false;
        iVar7 = FUN_004513e0(iVar2);
        if (param_3 == 1) {
          if ((*(byte *)(iVar2 + 0x7a) & 0x80) != 0) goto LAB_004519c7;
        }
        else if (((param_3 == 0) || (iVar7 == param_3)) &&
                ((param_6 != '\0' || ((*(byte *)(iVar2 + 0x7a) & 0x80) == 0)))) {
LAB_004519c7:
          bVar3 = true;
        }
        if (bVar3) {
          if (local_10 == 0) {
            uVar8 = (uint)(ushort)(*(short *)(iVar2 + 0x3d) - local_1c);
            uVar9 = (uint)(ushort)(*(short *)(iVar2 + 0x3f) - local_1a);
            if (0x7fff < uVar8) {
              uVar8 = uVar8 - 0x10000;
            }
            if (0x7fff < uVar9) {
              uVar9 = uVar9 - 0x10000;
            }
            uVar5 = calc_angle_quadrant(uVar8,-uVar9);
            sVar6 = calc_angular_diff_shortest(uVar5 & 0x7ff,*(undefined2 *)(local_18 + 0x32));
            bVar3 = true;
            if (0x238 < sVar6) {
              bVar3 = false;
            }
          }
          else {
            bVar3 = true;
          }
          if ((bVar3) && (iVar7 = calc_distance_toroidal(&local_1c,iVar2 + 0x3d), iVar7 < local_14))
          {
            local_14 = iVar7;
            local_c = iVar2;
          }
        }
      }
    }
    local_10 = local_10 + 1;
    if (1 < local_10) {
      return local_c;
    }
  } while( true );
}
