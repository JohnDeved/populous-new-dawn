/* Ghidra 12.1.3 pseudocode; entry 0050ee00; process_land_bridge.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void process_land_bridge(int param_1)

{
  short sVar1;
  int iVar2;
  undefined4 uVar3;
  short sVar4;
  uint uVar5;
  undefined2 extraout_var;
  uint uVar6;
  int iVar7;
  undefined2 unaff_retaddr;
  undefined4 uVar8;
  undefined4 local_4;

  sVar4 = *(short *)(param_1 + 0x6c) + 1;
  *(short *)(param_1 + 0x6c) = sVar4;
  local_4 = CONCAT22(*(undefined2 *)(param_1 + 0x8a),*(undefined2 *)(param_1 + 0x8c));
  if (sVar4 == 1) {
    *(undefined4 *)(param_1 + 0x72) = *(undefined4 *)(param_1 + 0x3d);
    *(undefined4 *)(param_1 + 0x76) = *(undefined4 *)(param_1 + 0x57);
    local_4._0_2_ =
         CONCAT11((char)((ushort)*(undefined2 *)(param_1 + 0x3f) >> 8),
                  (char)((uint)*(undefined4 *)(param_1 + 0x3d) >> 8)) & 0xfefe;
    *(ushort *)(param_1 + 0x8a) = (ushort)local_4;
    local_4._0_2_ =
         CONCAT11((char)((ushort)*(undefined2 *)(param_1 + 0x59) >> 8),
                  (char)((ushort)*(undefined2 *)(param_1 + 0x57) >> 8)) & 0xfefe;
    *(ushort *)(param_1 + 0x8c) = (ushort)local_4;
    uVar5 = (uint)*(byte *)(param_1 + 0x8c) - (uint)*(byte *)(param_1 + 0x8a);
    if (0x80 < (int)uVar5) {
      uVar5 = uVar5 - 0x100;
    }
    if ((int)uVar5 < -0x80) {
      uVar5 = uVar5 + 0x100;
    }
    uVar6 = (uint)*(byte *)(param_1 + 0x8d) - (uint)*(byte *)(param_1 + 0x8b);
    if (0x80 < (int)uVar6) {
      uVar6 = uVar6 - 0x100;
    }
    if ((int)uVar6 < -0x80) {
      uVar6 = uVar6 + 0x100;
    }
    if ((int)((uVar6 ^ (int)uVar6 >> 0x1f) - ((int)uVar6 >> 0x1f)) <
        (int)((uVar5 ^ (int)uVar5 >> 0x1f) - ((int)uVar5 >> 0x1f))) {
      *(undefined4 *)(param_1 + 0x86) = 0;
      iVar7 = (int)*(short *)(param_1 + 0x78) - (int)*(short *)(param_1 + 0x74);
      uVar6 = uVar5;
    }
    else {
      *(undefined4 *)(param_1 + 0x86) = 1;
      iVar7 = (int)*(short *)(param_1 + 0x76) - (int)*(short *)(param_1 + 0x72);
    }
    if (0x8000 < iVar7) {
      iVar7 = iVar7 + -0x10000;
    }
    if (iVar7 < -0x8000) {
      iVar7 = iVar7 + 0x10000;
    }
    uVar5 = (int)uVar6 >> 0x1f;
    if (uVar6 != 0) {
      iVar7 = iVar7 / (int)(((int)uVar6 >> 1 ^ uVar5) - uVar5);
    }
    iVar2 = ((int)uVar6 >> 1 ^ uVar5) - uVar5;
    if ((int)uVar6 < 1) {
      uVar3 = 0xfffffffe;
      if (-1 < (int)uVar6) {
        uVar3 = 0;
      }
    }
    else {
      uVar3 = 2;
    }
    *(undefined4 *)(param_1 + 0x7a) = uVar3;
    *(int *)(param_1 + 0x82) = iVar7;
    sVar4 = calc_point_height(CONCAT22((short)(uVar6 >> 0x10),*(undefined2 *)(param_1 + 0x76)),
                              CONCAT22((short)((uint)uVar3 >> 0x10),*(undefined2 *)(param_1 + 0x78))
                             );
    sVar1 = calc_point_height(*(undefined2 *)(param_1 + 0x72),
                              CONCAT22(extraout_var,*(undefined2 *)(param_1 + 0x74)));
    *(int *)(param_1 + 0x7e) = (int)sVar4 - (int)sVar1;
    if (iVar2 != 0) {
      *(int *)(param_1 + 0x7e) = ((int)sVar4 - (int)sVar1) / iVar2;
    }
    *(undefined1 *)(param_1 + 0x8e) = 1;
    return;
  }
  if (*(int *)(param_1 + 0x86) == 0) {
    uVar8 = 2;
    uVar3 = 0;
  }
  else {
    uVar8 = 0;
    uVar3 = 2;
  }
  FUN_0050f010(param_1,CONCAT22(unaff_retaddr,*(undefined2 *)(param_1 + 0x8a)),local_4,uVar3,uVar8);
  if (*(short *)(param_1 + 0x6c) - DAT_005aa5a8 == -1) {
    update_after_unit_alloc(param_1);
  }
  return;
}
