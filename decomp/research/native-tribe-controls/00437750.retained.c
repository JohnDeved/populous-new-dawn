/* Ghidra 12.1.3 pseudocode; entry 00437750; FUN_00437750.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */

void FUN_00437750(void)

{
  unit_struct *puVar1;
  int iVar2;
  int iVar3;
  unit_struct *puVar4;
  uint uVar5;
  byte *pbVar6;
  undefined4 *puVar7;
  bool bVar8;
  uint local_44;
  int local_38;
  byte local_34 [24];
  uint local_1c;
  byte local_18 [24];

  iVar2 = (int)player_tribe_num;
  local_38 = 0;
  pbVar6 = local_18;
  for (iVar3 = 6; iVar3 != 0; iVar3 = iVar3 + -1) {
    pbVar6[0] = 0xff;
    pbVar6[1] = 0xff;
    pbVar6[2] = 0xff;
    pbVar6[3] = 0xff;
    pbVar6 = pbVar6 + 4;
  }
  if (((load_level_flags._2_1_ & 2) == 0) || ((load_level_flags._2_1_ & 4) != 0)) {
    local_38 = 1;
    local_18[0] = *(byte *)((int)&DAT_00895ea0 + (uint)DAT_00895e9d);
  }
  DAT_00895e9d = 0;
  if ((game_state.tribes_array[iVar2].field_0x93d & 4) == 0) {
    pbVar6 = local_34;
    for (iVar3 = 6; iVar3 != 0; iVar3 = iVar3 + -1) {
      pbVar6[0] = 0;
      pbVar6[1] = 0;
      pbVar6[2] = 0;
      pbVar6[3] = 0;
      pbVar6 = pbVar6 + 4;
    }
    bVar8 = (game_state.tribes_array[iVar2].field_0xc23 & 0x80) != 0;
    if (bVar8) {
      local_34[0] = 7;
      local_34[1] = 0;
      local_34[2] = 0;
      local_34[3] = 0;
    }
    local_44 = (uint)bVar8;
    if ((game_state.tribes_array[iVar2].field_0xc23 & 4) != 0) {
      pbVar6 = local_34 + local_44 * 4;
      pbVar6[0] = 2;
      pbVar6[1] = 0;
      pbVar6[2] = 0;
      pbVar6[3] = 0;
      local_44 = local_44 + 1;
    }
    if ((game_state.tribes_array[iVar2].field_0xc23 & 8) != 0) {
      pbVar6 = local_34 + local_44 * 4;
      pbVar6[0] = 3;
      pbVar6[1] = 0;
      pbVar6[2] = 0;
      pbVar6[3] = 0;
      local_44 = local_44 + 1;
    }
    if ((game_state.tribes_array[iVar2].field_0xc23 & 0x40) != 0) {
      pbVar6 = local_34 + local_44 * 4;
      pbVar6[0] = 6;
      pbVar6[1] = 0;
      pbVar6[2] = 0;
      pbVar6[3] = 0;
      local_44 = local_44 + 1;
    }
    if ((game_state.tribes_array[iVar2].field_0xc23 & 0x10) != 0) {
      pbVar6 = local_34 + local_44 * 4;
      pbVar6[0] = 4;
      pbVar6[1] = 0;
      pbVar6[2] = 0;
      pbVar6[3] = 0;
      local_44 = local_44 + 1;
    }
    if ((game_state.tribes_array[iVar2].field_0xc23 & 0x20) != 0) {
      pbVar6 = local_34 + local_44 * 4;
      pbVar6[0] = 5;
      pbVar6[1] = 0;
      pbVar6[2] = 0;
      pbVar6[3] = 0;
      local_44 = local_44 + 1;
    }
    uVar5 = 0;
    if (((DAT_00895e7a & 0x4000) != 0) && ((DAT_00895e7a & 0x620) == 0)) {
      uVar5 = 0x18;
    }
    iVar3 = 0;
    if (uVar5 == 0) {
LAB_00437902:
      if (((DAT_00895e7a & 0x40000) != 0) && ((DAT_00895e7a & 0x100000) != 0)) {
        uVar5 = 0x1e;
      }
      iVar3 = 0;
      if (uVar5 != 0) {
        bVar8 = false;
        if (local_44 != 0) {
          pbVar6 = local_34;
          do {
            if (bVar8) goto LAB_0043795d;
            if ((*(uint *)(&DAT_005a7dc4 + uVar5 * 0x16) & 1 << (*pbVar6 & 0x1f)) != 0) {
              bVar8 = true;
            }
            pbVar6 = pbVar6 + 4;
            iVar3 = iVar3 + 1;
          } while (iVar3 < (int)local_44);
        }
        if (!bVar8) {
          uVar5 = 0;
        }
      }
LAB_0043795d:
      iVar3 = 0;
      if (uVar5 == 0) {
        local_1c = DAT_00895e7a & 4;
        if ((local_1c != 0) && (game_state.tribes_array[iVar2].field_0xc23 == '\x10')) {
          uVar5 = (-(uint)((DAT_00895e7a & 0x1000000) == 0) & 0xffffffe7) + 0x1c;
          if (uVar5 != 0) {
            bVar8 = false;
            if (local_44 != 0) {
              pbVar6 = local_34;
              do {
                if (bVar8) goto LAB_004379dc;
                if ((*(uint *)(&DAT_005a7dc4 + (uVar5 & 0xff) * 0x16) & 1 << (*pbVar6 & 0x1f)) != 0)
                {
                  bVar8 = true;
                }
                pbVar6 = pbVar6 + 4;
                iVar3 = iVar3 + 1;
              } while (iVar3 < (int)local_44);
            }
            if (!bVar8) {
              uVar5 = 0;
            }
          }
LAB_004379dc:
          if (uVar5 != 0) goto LAB_00437f7b;
        }
        if (local_1c != 0) {
          uVar5 = 0x1c;
        }
        iVar3 = 0;
        if (uVar5 != 0) {
          bVar8 = false;
          if (local_44 != 0) {
            pbVar6 = local_34;
            do {
              if (bVar8) goto LAB_00437a37;
              if ((*(uint *)(&DAT_005a7dc4 + (uVar5 & 0xff) * 0x16) & 1 << (*pbVar6 & 0x1f)) != 0) {
                bVar8 = true;
              }
              pbVar6 = pbVar6 + 4;
              iVar3 = iVar3 + 1;
            } while (iVar3 < (int)local_44);
          }
          if (!bVar8) {
            uVar5 = 0;
          }
LAB_00437a37:
          if (uVar5 != 0) goto LAB_00437f7b;
        }
        if ((DAT_00895e7a & 8) != 0) {
          uVar5 = (-(uint)(game_state.tribes_array[iVar2].field_0xc23 == ' ') & 6) + 7;
        }
        iVar3 = 0;
        if (uVar5 != 0) {
          bVar8 = false;
          if (local_44 != 0) {
            pbVar6 = local_34;
            do {
              if (bVar8) goto LAB_00437aa3;
              if ((*(uint *)(&DAT_005a7dc4 + (uVar5 & 0xff) * 0x16) & 1 << (*pbVar6 & 0x1f)) != 0) {
                bVar8 = true;
              }
              pbVar6 = pbVar6 + 4;
              iVar3 = iVar3 + 1;
            } while (iVar3 < (int)local_44);
          }
          if (!bVar8) {
            uVar5 = 0;
          }
LAB_00437aa3:
          if (uVar5 != 0) goto LAB_00437f7b;
        }
        if ((DAT_00895e7a & 0x400) != 0) {
          uVar5 = 0x16;
        }
        iVar3 = 0;
        if (uVar5 != 0) {
          bVar8 = false;
          if (local_44 != 0) {
            pbVar6 = local_34;
            do {
              if (bVar8) goto LAB_00437afe;
              if ((*(uint *)(&DAT_005a7dc4 + (uVar5 & 0xff) * 0x16) & 1 << (*pbVar6 & 0x1f)) != 0) {
                bVar8 = true;
              }
              pbVar6 = pbVar6 + 4;
              iVar3 = iVar3 + 1;
            } while (iVar3 < (int)local_44);
          }
          if (!bVar8) {
            uVar5 = 0;
          }
LAB_00437afe:
          if (uVar5 != 0) goto LAB_00437f7b;
        }
        if ((DAT_00895e7a & 0x2000) != 0) {
          uVar5 = 0x10;
        }
        iVar3 = 0;
        if (uVar5 != 0) {
          bVar8 = false;
          if (local_44 != 0) {
            pbVar6 = local_34;
            do {
              if (bVar8) goto LAB_00437b59;
              if ((*(uint *)(&DAT_005a7dc4 + (uVar5 & 0xff) * 0x16) & 1 << (*pbVar6 & 0x1f)) != 0) {
                bVar8 = true;
              }
              pbVar6 = pbVar6 + 4;
              iVar3 = iVar3 + 1;
            } while (iVar3 < (int)local_44);
          }
          if (!bVar8) {
            uVar5 = 0;
          }
LAB_00437b59:
          if (uVar5 != 0) goto LAB_00437f7b;
        }
        if (((DAT_00895e7a & 0x400000) != 0) && ((DAT_00895e7a & 0x100000) != 0)) {
          uVar5 = 0x22;
        }
        iVar3 = 0;
        if (uVar5 != 0) {
          bVar8 = false;
          if (local_44 != 0) {
            pbVar6 = local_34;
            do {
              if (bVar8) goto LAB_00437bbb;
              if ((*(uint *)(&DAT_005a7dc4 + (uVar5 & 0xff) * 0x16) & 1 << (*pbVar6 & 0x1f)) != 0) {
                bVar8 = true;
              }
              pbVar6 = pbVar6 + 4;
              iVar3 = iVar3 + 1;
            } while (iVar3 < (int)local_44);
          }
          if (!bVar8) {
            uVar5 = 0;
          }
LAB_00437bbb:
          if (uVar5 != 0) goto LAB_00437f7b;
        }
        if ((DAT_00895e7a & 2) != 0) {
          if (((DAT_00895e7a & 0x80) == 0) || ((DAT_00895e7a & 0x10000) != 0)) {
            uVar5 = 0x13;
          }
          else {
            uVar5 = (-(uint)((DAT_00895e7a & 0x8000) == 0) & 0xfffffffc) + 10;
          }
        }
        iVar3 = 0;
        if (uVar5 != 0) {
          bVar8 = false;
          if (local_44 != 0) {
            pbVar6 = local_34;
            do {
              if (bVar8) goto LAB_00437c3a;
              if ((*(uint *)(&DAT_005a7dc4 + (uVar5 & 0xff) * 0x16) & 1 << (*pbVar6 & 0x1f)) != 0) {
                bVar8 = true;
              }
              pbVar6 = pbVar6 + 4;
              iVar3 = iVar3 + 1;
            } while (iVar3 < (int)local_44);
          }
          if (!bVar8) {
            uVar5 = 0;
          }
LAB_00437c3a:
          if (uVar5 != 0) goto LAB_00437f7b;
        }
        if ((DAT_00895e7a & 0x20) != 0) {
          if ((DAT_00895e7a & 0x80) == 0) {
            uVar5 = (-(uint)(game_state.tribes_array[iVar2].field_0xc23 == ' ') & 0xfffffffc) + 0x13
            ;
          }
          else if ((DAT_00895e7a & 0x10000) == 0) {
            uVar5 = (-(uint)((DAT_00895e7a & 0x8000) == 0) & 0xfffffffe) + 10;
          }
          else {
            uVar5 = 0x13;
          }
        }
        iVar3 = 0;
        if (uVar5 != 0) {
          bVar8 = false;
          if (local_44 != 0) {
            pbVar6 = local_34;
            do {
              if (bVar8) goto LAB_00437cd1;
              if ((*(uint *)(&DAT_005a7dc4 + (uVar5 & 0xff) * 0x16) & 1 << (*pbVar6 & 0x1f)) != 0) {
                bVar8 = true;
              }
              pbVar6 = pbVar6 + 4;
              iVar3 = iVar3 + 1;
            } while (iVar3 < (int)local_44);
          }
          if (!bVar8) {
            uVar5 = 0;
          }
LAB_00437cd1:
          if (uVar5 != 0) goto LAB_00437f7b;
        }
        if ((DAT_00895e7a & 0x1000) != 0) {
          uVar5 = 0xb;
        }
        bVar8 = false;
        if (uVar5 != 0) {
          iVar3 = 0;
          if (local_44 != 0) {
            pbVar6 = local_34;
            do {
              if (bVar8) goto LAB_00437d2d;
              if ((*(uint *)(&DAT_005a7dc4 + (uVar5 & 0xff) * 0x16) & 1 << (*pbVar6 & 0x1f)) != 0) {
                bVar8 = true;
              }
              pbVar6 = pbVar6 + 4;
              iVar3 = iVar3 + 1;
            } while (iVar3 < (int)local_44);
          }
          if (!bVar8) {
            uVar5 = 0;
          }
LAB_00437d2d:
          if (uVar5 != 0) goto LAB_00437f7b;
        }
        if (((DAT_00895e7a & 0x200) != 0) && (game_state.tribes_array[iVar2].field_0xc23 == -0x80))
        {
          uVar5 = 0x14;
        }
        bVar8 = false;
        if (uVar5 != 0) {
          iVar3 = 0;
          if (local_44 != 0) {
            pbVar6 = local_34;
            do {
              if (bVar8) goto LAB_00437d96;
              if ((*(uint *)(&DAT_005a7dc4 + (uVar5 & 0xff) * 0x16) & 1 << (*pbVar6 & 0x1f)) != 0) {
                bVar8 = true;
              }
              pbVar6 = pbVar6 + 4;
              iVar3 = iVar3 + 1;
            } while (iVar3 < (int)local_44);
          }
          if (!bVar8) {
            uVar5 = 0;
          }
LAB_00437d96:
          if (uVar5 != 0) goto LAB_00437f7b;
        }
        if ((DAT_00895e7a & 0x20000) != 0) {
          uVar5 = 0x1d;
        }
        bVar8 = false;
        if (uVar5 != 0) {
          iVar3 = 0;
          if (local_44 != 0) {
            pbVar6 = local_34;
            do {
              if (bVar8) goto LAB_00437df1;
              if ((*(uint *)(&DAT_005a7dc4 + (uVar5 & 0xff) * 0x16) & 1 << (*pbVar6 & 0x1f)) != 0) {
                bVar8 = true;
              }
              pbVar6 = pbVar6 + 4;
              iVar3 = iVar3 + 1;
            } while (iVar3 < (int)local_44);
          }
          if (!bVar8) {
            uVar5 = 0;
          }
LAB_00437df1:
          if (uVar5 != 0) goto LAB_00437f7b;
        }
        if ((DAT_00895e7a & 0x800) != 0) {
          uVar5 = 0x1b;
        }
        bVar8 = false;
        if (uVar5 != 0) {
          iVar3 = 0;
          if (local_44 != 0) {
            pbVar6 = local_34;
            do {
              if (bVar8) goto LAB_00437e4c;
              if ((*(uint *)(&DAT_005a7dc4 + (uVar5 & 0xff) * 0x16) & 1 << (*pbVar6 & 0x1f)) != 0) {
                bVar8 = true;
              }
              pbVar6 = pbVar6 + 4;
              iVar3 = iVar3 + 1;
            } while (iVar3 < (int)local_44);
          }
          if (!bVar8) {
            uVar5 = 0;
          }
LAB_00437e4c:
          if (uVar5 != 0) goto LAB_00437f7b;
        }
        if ((DAT_00895e7a & 0x80000) != 0) {
          uVar5 = 0x21;
        }
        bVar8 = false;
        if (uVar5 != 0) {
          iVar3 = 0;
          if (local_44 != 0) {
            pbVar6 = local_34;
            do {
              if (bVar8) goto LAB_00437ea7;
              if ((*(uint *)(&DAT_005a7dc4 + (uVar5 & 0xff) * 0x16) & 1 << (*pbVar6 & 0x1f)) != 0) {
                bVar8 = true;
              }
              pbVar6 = pbVar6 + 4;
              iVar3 = iVar3 + 1;
            } while (iVar3 < (int)local_44);
          }
          if (!bVar8) {
            uVar5 = 0;
          }
LAB_00437ea7:
          if (uVar5 != 0) goto LAB_00437f7b;
        }
        if ((DAT_00895e7a & 0x200000) != 0) {
          uVar5 = 0x13;
        }
        bVar8 = false;
        if (uVar5 != 0) {
          iVar3 = 0;
          if (local_44 != 0) {
            pbVar6 = local_34;
            do {
              if (bVar8) goto LAB_00437f02;
              if ((*(uint *)(&DAT_005a7dc4 + (uVar5 & 0xff) * 0x16) & 1 << (*pbVar6 & 0x1f)) != 0) {
                bVar8 = true;
              }
              pbVar6 = pbVar6 + 4;
              iVar3 = iVar3 + 1;
            } while (iVar3 < (int)local_44);
          }
          if (!bVar8) {
            uVar5 = 0;
          }
LAB_00437f02:
          if (uVar5 != 0) goto LAB_00437f7b;
        }
        if (((DAT_00895e7a & 0x100) != 0) &&
           ((game_state.tribes_array[iVar2].field_0xc23 != '\x10' ||
            (uVar5 = 3, (DAT_00895e7a & 0x1000000) != 0)))) {
          uVar5 = 0x13;
        }
        bVar8 = false;
        if (uVar5 != 0) {
          iVar2 = 0;
          if (local_44 != 0) {
            pbVar6 = local_34;
            do {
              if (bVar8) goto LAB_00437f72;
              if ((*(uint *)(&DAT_005a7dc4 + (uVar5 & 0xff) * 0x16) & 1 << (*pbVar6 & 0x1f)) != 0) {
                bVar8 = true;
              }
              pbVar6 = pbVar6 + 4;
              iVar2 = iVar2 + 1;
            } while (iVar2 < (int)local_44);
          }
          if (!bVar8) {
            uVar5 = 0;
          }
LAB_00437f72:
          if (uVar5 != 0) goto LAB_00437f7b;
        }
        uVar5 = 3;
      }
    }
    else {
      bVar8 = false;
      if (local_44 != 0) {
        pbVar6 = local_34;
        do {
          if (bVar8) goto LAB_004378fa;
          if ((*(uint *)(&DAT_005a7dc4 + uVar5 * 0x16) & 1 << (*pbVar6 & 0x1f)) != 0) {
            bVar8 = true;
          }
          pbVar6 = pbVar6 + 4;
          iVar3 = iVar3 + 1;
        } while (iVar3 < (int)local_44);
      }
      if (!bVar8) {
        uVar5 = 0;
      }
LAB_004378fa:
      if (uVar5 == 0) goto LAB_00437902;
    }
LAB_00437f7b:
    iVar2 = 0;
    bVar8 = false;
    if (local_38 != 0) {
      do {
        if (local_18[iVar2] == uVar5) {
          bVar8 = true;
          break;
        }
        iVar2 = iVar2 + 1;
      } while (iVar2 < local_38);
    }
    if (bVar8) goto LAB_004380ab;
  }
  else {
    if ((DAT_00895e7a & 4) == 0) {
      if ((DAT_00895e7a & 0x400) == 0) {
        if ((DAT_00895e7a & 2) == 0) {
          if ((DAT_00895e7a & 0x20) == 0) {
            uVar5 = (-(uint)((DAT_00895e7a & 0x1000) == 0) & 0xfffffff8) + 0xb;
          }
          else if ((DAT_00895e7a & 0x80) == 0) {
            uVar5 = 0x13;
          }
          else {
            puVar4 = (unit_struct *)0x0;
            if ((((ushort)DAT_00895e82 != 0) &&
                (puVar1 = unit_land_array[(ushort)DAT_00895e82],
                (*(byte *)&puVar1->flags_2 & 1) == 0)) && (puVar1->unit_class != '\0')) {
              puVar4 = puVar1;
            }
            if (((puVar4 == (unit_struct *)0x0) || (puVar4->unit_class != '\x02')) ||
               ((unit_type_array_building[(byte)puVar4->unit_type].field_0x48 & 1) == 0)) {
              uVar5 = 0x13;
              if ((puVar4 != (unit_struct *)0x0) && (puVar4->tribe_index == player_tribe_num)) {
                uVar5 = 3;
              }
            }
            else {
              uVar5 = 8;
            }
          }
        }
        else {
          uVar5 = (-(uint)((DAT_00895e7a & 0x80) == 0) & 0x10) + 3;
        }
      }
      else {
        uVar5 = 0x16;
      }
    }
    else {
      uVar5 = 0x1c;
    }
    iVar2 = 0;
    bVar8 = false;
    if (local_38 != 0) {
      do {
        if (local_18[iVar2] == uVar5) {
          bVar8 = true;
          break;
        }
        iVar2 = iVar2 + 1;
      } while (iVar2 < local_38);
    }
    if (bVar8) goto LAB_004380ab;
  }
  local_18[local_38] = (byte)uVar5;
  local_38 = local_38 + 1;
LAB_004380ab:
  DAT_00895e9f = (byte)local_38;
  pbVar6 = local_18;
  puVar7 = &DAT_00895ea0;
  for (iVar2 = 6; iVar2 != 0; iVar2 = iVar2 + -1) {
    *puVar7 = *(undefined4 *)pbVar6;
    pbVar6 = pbVar6 + 4;
    puVar7 = puVar7 + 1;
  }
  if (DAT_00895e9f != 0) {
    _DAT_00895e92 = (ushort)(0x800 / (ulonglong)(longlong)(int)(uint)DAT_00895e9f) & 0x7ff;
  }
  return;
}
