/* Ghidra 12.1.3 pseudocode; entry 0044ac00; FUN_0044ac00.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_0044ac00(void)

{
  char cVar1;
  short sVar2;
  short sVar3;
  int iVar4;
  int iVar5;
  int iVar6;
  int *piVar7;
  short *psVar8;
  short sVar9;
  int iStack_10;
  int iStack_c;
  int iStack_8;
  int iStack_4;

  sVar9 = 1;
  if (1 < DAT_00684508) {
    do {
      iVar4 = (int)(short)(&DAT_00684220)[sVar9 * 3];
      iVar5 = iVar4 * 0x3e;
      iVar6 = *(int *)((int)&DAT_0068428c + iVar5);
      if (iVar6 == 0) {
LAB_0044ac8f:
        cVar1 = '\0';
      }
      else {
        if (iVar6 == 1) {
          if ((&DAT_00684262)[iVar4 * 0x1f] == 0) {
            (&DAT_00684262)[iVar4 * 0x1f] = 1;
          }
          else {
            sVar2 = (&DAT_00684262)[iVar4 * 0x1f] + -1;
            (&DAT_00684262)[iVar4 * 0x1f] = sVar2;
            if (sVar2 == 0) {
              sVar2 = (&DAT_005cd084)[(short)(&DAT_00684298)[iVar4 * 0x1f] * 0x1f];
              (&DAT_00684262)[iVar4 * 0x1f] = sVar2;
              if (sVar2 == 0) {
                (&DAT_00684262)[iVar4 * 0x1f] = 1;
              }
              *(undefined4 *)((int)&DAT_0068428c + iVar5) = 2;
              cVar1 = '\x01';
              goto LAB_0044ac91;
            }
          }
          goto LAB_0044ac8f;
        }
        if (iVar6 != 3) goto LAB_0044ac8f;
        if ((&DAT_00684262)[iVar4 * 0x1f] == 0) {
          cVar1 = -1;
        }
        else {
          sVar2 = (&DAT_00684262)[iVar4 * 0x1f] + -1;
          (&DAT_00684262)[iVar4 * 0x1f] = sVar2;
          if (0 < sVar2) goto LAB_0044ac8f;
          cVar1 = -1;
        }
      }
LAB_0044ac91:
      if ((cVar1 == -1) && (*(int *)((int)&DAT_0068428c + iVar5) != 0)) {
        *(undefined4 *)((int)&DAT_0068428c + iVar5) = 0;
        sVar2 = (&DAT_0068429a)[iVar4 * 0x1f];
        while (iVar6 = sVar2 * 0x71, iVar6 != 0) {
          if (*(int *)((int)&DAT_00684530 + iVar6) != 0) {
            *(undefined4 *)((int)&DAT_00684530 + iVar6) = 0;
          }
          sVar2 = *(short *)((int)&DAT_00684599 + iVar6);
        }
        sVar2 = FUN_0044c620(*(undefined4 *)((int)&DAT_0068425e + iVar5));
        if (sVar2 != 0) {
          if ((int)sVar2 < DAT_00684508 + -1) {
            do {
              iVar6 = (int)sVar2;
              sVar2 = sVar2 + 1;
              *(undefined4 *)((int)&DAT_0068421c + iVar6 * 6) =
                   *(undefined4 *)((int)&DAT_00684222 + iVar6 * 6);
              (&DAT_00684220)[iVar6 * 3] = (&DAT_00684226)[iVar6 * 3];
            } while ((int)sVar2 < DAT_00684508 + -1);
          }
          DAT_00684508 = DAT_00684508 + -1;
          *(undefined4 *)((int)&DAT_0068421c + DAT_00684508 * 6) = 0;
          (&DAT_00684220)[DAT_00684508 * 3] = 0;
        }
        do {
          iVar6 = 1;
          if (0 < DAT_00684508) {
            psVar8 = &DAT_00684226;
            do {
              iVar5 = *(int *)((int)&DAT_0068428c + *psVar8 * 0x3e);
              if (((iVar5 == 2) || (iVar5 == 1)) &&
                 ((&DAT_00684294)[*psVar8 * 0x1f] == (&DAT_00684296)[iVar4 * 0x1f]))
              goto LAB_0044ada0;
              psVar8 = psVar8 + 3;
              iVar6 = iVar6 + 1;
            } while (iVar6 <= DAT_00684508);
          }
          iVar6 = 0;
LAB_0044ada0:
          if ((short)iVar6 == 0) break;
          sVar2 = (&DAT_00684220)[(short)iVar6 * 3];
          *(undefined4 *)((int)&DAT_0068428c + sVar2 * 0x3e) = 3;
          while (sVar3 = FUN_0044dc30((int)&DAT_0068425e + sVar2 * 0x3e), sVar3 != 0) {
            FUN_0044dc90((int)&DAT_0068425e + (short)(&DAT_00684220)[sVar3 * 3] * 0x3e);
          }
        } while( true );
      }
      sVar9 = sVar9 + 1;
    } while (sVar9 < DAT_00684508);
  }
  sVar9 = 1;
  if (1 < DAT_00684508) {
    do {
      iVar5 = (int)(short)(&DAT_00684220)[sVar9 * 3];
      iVar6 = iVar5 * 0x3e;
      if ((*(int *)((int)&DAT_0068428c + iVar6) != 0) && (*(int *)((int)&DAT_00684290 + iVar6) != 0)
         ) {
        if ((*(int *)((int)&DAT_0068428c + iVar6) == 2) ||
           (((&DAT_00684262)[iVar5 * 0x1f] == 0 ||
            ((&DAT_005cd084)[(short)(&DAT_00684298)[iVar5 * 0x1f] * 0x1f] == 0)))) {
          vertices_flags = vertices_flags & 0xfffffff7;
        }
        else {
          vertices_flags = vertices_flags | 8;
        }
        if (*(code **)((int)&DAT_0068427c + iVar6) != (code *)0x0) {
          (**(code **)((int)&DAT_0068427c + iVar6))((int)&DAT_0068425e + iVar6);
        }
        if (*(int *)((int)&DAT_0068428c + iVar6) == 2) {
          sVar2 = (&DAT_0068429a)[iVar5 * 0x1f];
          while( true ) {
            iVar6 = sVar2 * 0x71;
            if ((undefined4 *)((int)&DAT_0068452c + iVar6) == &DAT_0068452c) break;
            if (((*(code **)((int)&DAT_0068457f + iVar6) != (code *)0x0) &&
                (*(int *)((int)&DAT_0068453c + iVar6) != 0)) &&
               ((*(int *)((int)&DAT_00684530 + iVar6) != 0 &&
                (*(short *)((int)&DAT_00684597 + iVar6) == (&DAT_00684296)[iVar5 * 0x1f])))) {
              (**(code **)((int)&DAT_0068457f + iVar6))((undefined4 *)((int)&DAT_0068452c + iVar6));
            }
            sVar2 = *(short *)((int)&DAT_00684599 + iVar6);
          }
          if (-1 < DAT_0068c6c9) {
            iStack_4 = 0;
            iStack_8 = 0;
            iStack_c = 0;
            iStack_10 = 0;
            piVar7 = (int *)((int)&DAT_0068452c + (short)(&DAT_0068429a)[iVar5 * 0x1f] * 0x71);
            if (piVar7 != &DAT_0068452c) {
              do {
                if ((((*(int *)((int)piVar7 + 0x53) != 0) && (piVar7[4] != 0)) && (piVar7[1] != 0))
                   && ((*(short *)((int)piVar7 + 0x6b) == (&DAT_00684296)[iVar5 * 0x1f] &&
                       ((int)DAT_0068c6c9 == *piVar7)))) {
                  iVar6 = *(int *)((int)piVar7 + 0x43) * (int)screen_height +
                          (int)(screen_height / 2);
                  iStack_c = (int)(iVar6 + (iVar6 >> 0x1f & 0xffffU)) >> 0x10;
                  iVar6 = (*(int *)((int)piVar7 + 0x4b) + *(int *)((int)piVar7 + 0x43)) *
                          (int)screen_height + (int)(screen_height / 2);
                  iStack_4 = (int)(iVar6 + (iVar6 >> 0x1f & 0xffffU)) >> 0x10;
                  iVar6 = *(int *)((int)piVar7 + 0x3f) * (int)screen_width;
                  iStack_10 = (int)(iVar6 + (iVar6 >> 0x1f & 0xffffU)) >> 0x10;
                  iVar6 = (*(int *)((int)piVar7 + 0x47) + *(int *)((int)piVar7 + 0x3f)) *
                          (int)screen_width;
                  iStack_8 = (int)(iVar6 + (iVar6 >> 0x1f & 0xffffU)) >> 0x10;
                  FUN_00525bd0(&iStack_10);
                  break;
                }
                piVar7 = (int *)((int)&DAT_0068452c + *(short *)((int)piVar7 + 0x6d) * 0x71);
              } while (piVar7 != &DAT_0068452c);
            }
          }
        }
      }
      sVar9 = sVar9 + 1;
    } while (sVar9 < DAT_00684508);
  }
  return;
}
