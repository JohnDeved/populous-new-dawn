/* Ghidra 12.1.3 pseudocode; entry 0056db50; FUN_0056db50.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


/* WARNING: Removing unreachable block (ram,0x0056dca7) */
/* WARNING: Removing unreachable block (ram,0x0056dcb6) */

int __thiscall FUN_0056db50(int param_1,undefined4 param_2,int param_3,int param_4)

{
  byte bVar1;
  int iVar2;
  undefined4 uVar3;
  uint uVar4;
  undefined4 uStack_20;
  undefined1 auStack_18 [24];

  if ((param_4 == -1) && (param_4 = FUN_00570ca0(param_2), param_4 == -1)) {
    return 0x12d;
  }
  if ((*(uint *)(param_3 + 0xc) & 0x1a) != 0) {
    (**(code **)(**(int **)(param_1 + 0x24) + 0x60))(param_4,*(uint *)(param_3 + 0xc));
  }
  uVar4 = *(uint *)(param_3 + 0x14);
  if ((*(uint *)(param_3 + 0xc) & 0x3000) != 0) {
    uVar4 = uVar4 | 0x4000;
  }
  bVar1 = 0;
  do {
    if (uVar4 == 0) {
      return 0;
    }
    if ((uVar4 & 1) != 0) {
      iVar2 = 1 << (bVar1 & 0x1f);
      if (iVar2 < 0x21) {
        if (iVar2 == 0x20) {
          iVar2 = FUN_00570bd0(param_4);
          iVar2 = (**(code **)(**(int **)(param_1 + 0x24) + 0x84))
                            (*(undefined2 *)(iVar2 + 0x58),param_4,*(undefined4 *)(param_3 + 0x2c));
          if (iVar2 != 0) {
            return iVar2;
          }
        }
        else if (iVar2 == 1) {
          FUN_00570b70(auStack_18,param_4);
          if (((*(byte *)(param_1 + 0x30) & 2) == 0) && ((*(byte *)(param_3 + 0xc) & 0x20) == 0)) {
            uStack_20 = 0;
          }
          else {
            uStack_20 = 1;
          }
          iVar2 = FUN_00570bd0(param_4);
          iVar2 = (**(code **)(**(int **)(param_1 + 0x24) + 0x6c))
                            (param_4,auStack_18,param_3 + 0x38,uStack_20,
                             *(undefined1 *)(iVar2 + 0x21),(*(uint *)(param_3 + 0xc) & 0x80) == 0);
          if (iVar2 != 0) {
            return iVar2;
          }
          FUN_00570b50(param_4,param_3 + 0x38);
        }
        else if (iVar2 == 2) {
          uVar3 = FUN_0056dab0(*(undefined4 *)(param_3 + 0x30));
          iVar2 = (**(code **)(**(int **)(param_1 + 0x24) + 0x74))(param_4,uVar3);
          if (iVar2 != 0) {
            return iVar2;
          }
          *(undefined4 *)(**(int **)(param_1 + 0x20) + 0x70 + param_4 * 0x94) = uVar3;
        }
      }
      else if (iVar2 < 0x101) {
        if (iVar2 == 0x100) {
          iVar2 = (**(code **)(**(int **)(param_1 + 0x24) + 0x70))(param_4,param_3 + 0x50);
          if (iVar2 != 0) {
            return iVar2;
          }
        }
        else if (iVar2 == 0x40) {
LAB_0056dd3e:
          iVar2 = FUN_00570ba0(param_2,param_3);
          if (iVar2 != 0) {
            return iVar2;
          }
          uVar4 = uVar4 & 0xfff7ffbf;
        }
      }
      else if (iVar2 == 0x200) {
        iVar2 = (**(code **)(**(int **)(param_1 + 0x24) + 0x58))(param_4,param_3 + 0x70);
        if (iVar2 != 0) {
          return iVar2;
        }
      }
      else if (iVar2 == 0x4000) {
        uVar4 = uVar4 & 0xffff7fff;
        FUN_0056d890(param_3,param_4,0);
      }
      else if (iVar2 == 0x80000) goto LAB_0056dd3e;
    }
    uVar4 = uVar4 >> 1;
    bVar1 = bVar1 + 1;
  } while( true );
}
