/* Ghidra 12.1.3 pseudocode; entry 004c21e0; FUN_004c21e0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


/* WARNING: Removing unreachable block (ram,0x004c230c) */
/* WARNING: Removing unreachable block (ram,0x004c2316) */

int FUN_004c21e0(int param_1,undefined4 param_2,undefined4 param_3,short *param_4,
                undefined4 *param_5,undefined2 param_6,int param_7)

{
  undefined4 *puVar1;
  undefined4 uVar2;
  int iVar3;
  uint uVar4;
  uint uVar5;
  short sVar6;
  undefined4 local_8;
  undefined2 local_4;

  iVar3 = alloc_unit(8,param_2,param_3,param_4);
  if (iVar3 != 0) {
    puVar1 = (undefined4 *)(iVar3 + 0x76);
    *(undefined4 *)(iVar3 + 0x70) = *(undefined4 *)param_4;
    *(short *)(iVar3 + 0x74) = param_4[2];
    *puVar1 = *param_5;
    *(undefined2 *)(iVar3 + 0x7a) = *(undefined2 *)(param_5 + 1);
    *(undefined2 *)(iVar3 + 0x98) = param_6;
    sVar6 = *(short *)(iVar3 + 0x74) + 0x60;
    *(short *)(iVar3 + 0x74) = sVar6;
    if (param_7 != 0) {
      *(short *)(iVar3 + 0x74) = *(short *)(param_7 + 0x1c) + sVar6;
    }
    if ((*(short *)(iVar3 + 0x98) != 0) &&
       (((&DAT_005a80eb)[(uint)*(byte *)(param_1 + 0x2b) * 0x3e] & 0x40) != 0)) {
      *(byte *)(iVar3 + 0x6e) = *(byte *)(iVar3 + 0x6e) | 4;
    }
    *(undefined4 *)(param_1 + 0x57) = *param_5;
    *(undefined2 *)(param_1 + 0x5b) = *(undefined2 *)(param_5 + 1);
    *(undefined4 *)(param_1 + 0x72) = *(undefined4 *)(iVar3 + 0x70);
    *(undefined2 *)(param_1 + 0x76) = *(undefined2 *)(iVar3 + 0x74);
    *(undefined4 *)(param_1 + 0x6c) = *puVar1;
    *(undefined2 *)(param_1 + 0x70) = *(undefined2 *)(iVar3 + 0x7a);
    *(undefined2 *)(param_1 + 0x6a) = param_6;
    if (*(char *)(param_1 + 0x2b) == '\x03') {
      *(short *)(iVar3 + 0x7a) = *(short *)(iVar3 + 0x7a) + 0x400;
      uVar2 = *puVar1;
      local_4 = *(undefined2 *)(iVar3 + 0x7a);
      local_8._0_2_ = (short)uVar2;
      uVar5 = (uint)(ushort)(*param_4 - (short)local_8);
      local_8._2_2_ = (short)((uint)uVar2 >> 0x10);
      uVar4 = (uint)(ushort)(param_4[1] - local_8._2_2_);
      if (0x7fff < uVar5) {
        uVar5 = uVar5 - 0x10000;
      }
      if (0x7fff < uVar4) {
        uVar4 = uVar4 - 0x10000;
      }
      local_8 = uVar2;
      uVar5 = calc_angle_quadrant(uVar5,-uVar4,0x600);
      move_pos_angle_length(&local_8,uVar5 & 0xffff07ff);
      *(undefined4 *)(iVar3 + 0x57) = *puVar1;
      *(undefined2 *)(iVar3 + 0x5b) = *(undefined2 *)(iVar3 + 0x7a);
      *(undefined4 *)(param_1 + 0x57) = *puVar1;
      *(undefined2 *)(param_1 + 0x5b) = *(undefined2 *)(iVar3 + 0x7a);
      *puVar1 = local_8;
      *(undefined2 *)(iVar3 + 0x7a) = local_4;
      *(undefined4 *)(param_1 + 0x6c) = local_8;
      *(undefined2 *)(param_1 + 0x70) = local_4;
    }
    *(undefined1 *)(param_1 + 0x2d) = 2;
    *(uint *)(param_1 + 0xc) = *(uint *)(param_1 + 0xc) | 0x40000000;
    *(undefined2 *)(param_1 + 0x68) = *(undefined2 *)(iVar3 + 0x24);
    if ((char)param_2 == '\x04') {
      FUN_0048a050(param_1,0xa1,0);
    }
  }
  return iVar3;
}
