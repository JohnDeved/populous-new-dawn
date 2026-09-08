/* Ghidra 12.1.3 pseudocode; entry 004a67d0; FUN_004a67d0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_004a67d0(int param_1)

{
  ushort *puVar1;
  char cVar2;
  char cVar3;
  byte bVar4;
  undefined1 uVar5;
  undefined2 uVar6;
  int iVar7;
  char cVar8;
  ushort uVar9;
  ushort uVar10;
  ushort uVar11;
  ushort uVar12;
  ushort uVar13;
  ushort uVar14;
  char cVar15;
  undefined2 extraout_var;
  undefined4 *puVar16;
  undefined2 extraout_var_00;
  undefined4 *puVar17;
  undefined2 local_4a;
  undefined4 local_48;
  undefined4 local_44;
  int local_40;
  ushort local_3c;
  int local_38;
  ushort local_34;
  int local_30;
  ushort local_2c;
  int local_28;
  ushort local_24;
  int local_20;
  ushort local_1c;
  int local_18;
  ushort local_14;
  int local_10;
  ushort local_c;
  int local_8;
  ushort local_4;

  iVar7 = param_1;
  bVar4 = *(byte *)(param_1 + 0x2b);
  *(undefined1 *)(param_1 + 0x2f) = 0xff;
  *(undefined1 *)(param_1 + 0x8f) = *(undefined1 *)&unit_type_array_scenery[bVar4].obj_index;
  uVar5 = unit_type_array_scenery[bVar4].field9_0x11;
  if ((*(byte *)(param_1 + 0xe) & 0x10) == 0) {
    empty_unit_function(param_1);
    *(undefined1 *)(iVar7 + 0x2c) = uVar5;
    init_unit_class(iVar7);
  }
  puVar1 = (ushort *)(iVar7 + 0x3d);
  *puVar1 = (*puVar1 & 0xfe00) + 0x100;
  *(ushort *)(iVar7 + 0x3f) = (*(ushort *)(iVar7 + 0x3f) & 0xfe00) + 0x100;
  insert_unit_into_land_tile(iVar7,puVar1);
  *(undefined1 *)(iVar7 + 0x30) = unit_type_array_scenery[bVar4].field10_0x12;
  FUN_004a66c0(iVar7,CONCAT22(extraout_var,unit_type_array_scenery[bVar4].obj_related_index),
               CONCAT22(extraout_var_00,unit_type_array_scenery[bVar4].obj_index));
  local_48 = CONCAT31(local_48._1_3_,(char)(*puVar1 >> 8)) & 0xfffffffe;
  local_48 = CONCAT22(local_48._2_2_,
                      CONCAT11((char)((ushort)*(undefined2 *)(iVar7 + 0x3f) >> 8),
                               (undefined1)local_48)) & 0xfffffeff;
  FUN_0044fad0(local_48);
  if ((unit_type_array_scenery[bVar4].flags_1 & 5) != 0) {
    *(undefined2 *)(iVar7 + 0x86) = unit_type_array_scenery[bVar4].field3_0x6;
    FUN_004a79f0(iVar7,(int)unit_type_array_scenery[bVar4].field2_0x4,0xffffffff);
  }
  if ((unit_type_array_scenery[bVar4].flags & 1) != 0) {
    *(uint *)(iVar7 + 0xc) = *(uint *)(iVar7 + 0xc) | 0x40;
    landscape_set_unit_shadow(iVar7,(int)(char)unit_type_array_scenery[bVar4].field11_0x13,1);
  }
  if (((unit_type_array_scenery[bVar4].field14_0x16 & 2) != 0) && (((byte)level_flags & 4) != 0)) {
    local_48._0_2_ =
         CONCAT11((char)((ushort)*(undefined2 *)(iVar7 + 0x3f) >> 8),(char)(*puVar1 >> 8)) & 0xfefe;
    local_4a._0_1_ = (char)(ushort)local_48;
    cVar8 = (char)local_4a;
    local_4a._1_1_ = (char)((ushort)local_48 >> 8);
    cVar15 = local_4a._1_1_;
    local_4a._1_1_ = local_4a._1_1_ + '\x02';
    local_4a = CONCAT11(local_4a._1_1_,(char)local_4a + -2);
    local_44._0_2_ = local_4a;
    local_4a = CONCAT11(local_4a._1_1_,cVar8);
    uVar9 = local_4a;
    local_3c = local_4a;
    cVar2 = cVar8 + '\x02';
    local_4a = CONCAT11(local_4a._1_1_,cVar2);
    uVar10 = local_4a;
    local_34 = local_4a;
    local_4a = CONCAT11(cVar15,cVar2);
    uVar11 = local_4a;
    local_2c = local_4a;
    cVar3 = cVar15 + -2;
    local_4a = CONCAT11(cVar3,cVar2);
    uVar12 = local_4a;
    local_24 = local_4a;
    local_4a = CONCAT11(cVar3,cVar8);
    uVar13 = local_4a;
    local_1c = local_4a;
    local_4a = CONCAT11(cVar3,cVar8 + -2);
    uVar14 = local_4a;
    local_14 = local_4a;
    local_4a = CONCAT11(cVar15,cVar8 + -2);
    local_c = local_4a;
    local_4 = (ushort)local_48;
    local_40 = ((uVar9 & 0xfe) * 2 | uVar9 & 0xfe00) * 4 + 0x8a03e4;
    local_38 = ((uVar10 & 0xfe) * 2 | uVar10 & 0xfe00) * 4 + 0x8a03e4;
    local_30 = ((uVar11 & 0xfe) * 2 | uVar11 & 0xfe00) * 4 + 0x8a03e4;
    local_28 = ((uVar12 & 0xfe) * 2 | uVar12 & 0xfe00) * 4 + 0x8a03e4;
    local_20 = ((uVar13 & 0xfe) * 2 | uVar13 & 0xfe00) * 4 + 0x8a03e4;
    local_18 = ((uVar14 & 0xfe) * 2 | uVar14 & 0xfe00) * 4 + 0x8a03e4;
    local_10 = ((local_4a & 0xfe) * 2 | local_4a & 0xfe00) * 4 + 0x8a03e4;
    puVar17 = &local_44;
    puVar16 = (undefined4 *)(((ushort)local_48 & 0xfe) * 2 | (ushort)local_48 & 0xfe00);
    local_8 = (int)puVar16 * 4 + 0x8a03e4;
    do {
      uVar6 = *(undefined2 *)puVar17;
      puVar17 = puVar17 + 2;
      FUN_00450610(2,CONCAT22((short)((uint)puVar16 >> 0x10),uVar6));
      puVar16 = &param_1;
    } while (puVar17 < puVar16);
  }
  *(uint *)(iVar7 + 0xc) = *(uint *)(iVar7 + 0xc) | 4;
  FUN_004a80b0(iVar7);
  return;
}
