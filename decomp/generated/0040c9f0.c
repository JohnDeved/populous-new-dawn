/* Ghidra 12.1.3 pseudocode; entry 0040c9f0; animate_3d_morph.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void animate_3d_morph(int param_1)

{
  ushort uVar1;
  ushort *puVar2;
  uint uVar3;
  int iVar4;
  int iVar5;

  iVar5 = (int)*(char *)(param_1 + 0x3b);
  uVar1 = *(ushort *)(param_1 + 0x35);
  if ((uVar1 & 0x1000) != 0) {
    if ((uVar1 & 0x400) == 0) {
      uVar3 = (uint)(*(short *)(param_1 + 0x72) >> 2);
    }
    else {
      uVar3 = (uint)*(byte *)(param_1 + 0x71);
    }
    calc_points_median(objs0_mem + morph0_mem[iVar5 * 4].obj_index_1,
                       objs0_mem + *(short *)(param_1 + 0x74),objs0_mem + *(short *)(param_1 + 0x76)
                       ,uVar3,*(undefined1 *)(param_1 + 0x71));
    return;
  }
  uVar3 = (uint)((ulonglong)(*(ushort *)(param_1 + 0x37) >> 2) %
                (ulonglong)
                (longlong)
                (int)(*(ushort *)(iVar5 * 0x170 + 0x87ccae + morph0_mem[iVar5 * 4].field1_0x4 * 10)
                     + 1));
  if ((uVar1 & 0x800) == 0) {
    if ((uVar1 & 0x400) != 0) {
      uVar3 = (uint)*(byte *)(param_1 + 0x70);
    }
  }
  else if (*(byte *)(param_1 + 0x70) - uVar3 == 1) {
    *(ushort *)(param_1 + 0x35) = uVar1 & 0xf7ff;
  }
  iVar4 = 0;
  if (0 < (int)morph0_mem[iVar5 * 4].field1_0x4) {
    puVar2 = &morph0_mem[iVar5 * 4 + 1].field71_0x52;
    do {
      if ((*puVar2 <= uVar3) && (uVar3 <= puVar2[1])) break;
      puVar2 = puVar2 + 5;
      iVar4 = iVar4 + 1;
    } while (iVar4 < (int)morph0_mem[iVar5 * 4].field1_0x4);
  }
  *(ushort *)(param_1 + 0x74) = (&morph0_mem[iVar5 * 4 + 1].obj_index_2)[iVar4 * 5];
  calc_points_median(objs0_mem + morph0_mem[iVar5 * 4].obj_index_1,
                     objs0_mem + (&morph0_mem[iVar5 * 4 + 1].obj_index_2)[iVar4 * 5],
                     objs0_mem + (&morph0_mem[iVar5 * 4 + 1].obj_index_3)[iVar4 * 5],
                     uVar3 - (&morph0_mem[iVar5 * 4 + 1].field71_0x52)[iVar4 * 5],
                     (&morph0_mem[iVar5 * 4].field76_0x58)[iVar4] + 1);
  return;
}
