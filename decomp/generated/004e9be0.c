/* Ghidra 12.1.3 pseudocode; entry 004e9be0; FUN_004e9be0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_004e9be0(int param_1,short *param_2,char param_3)

{
  uint *puVar1;
  uint uVar2;
  bool bVar3;
  char cVar4;
  short sVar5;
  short sVar6;
  byte bVar7;
  short sVar8;
  short sVar9;
  short sVar10;
  short *psVar11;
  undefined2 local_e;
  undefined2 local_c;

  bVar3 = true;
  local_c = CONCAT11((char)((ushort)param_2[1] >> 8),(char)((ushort)*param_2 >> 8));
  puVar1 = &game_state.level_data[0].flags + ((local_c & 0xfe) * 2 | local_c & 0xfe00);
  uVar2 = *puVar1;
  if ((uVar2 & 0x80200) != 0) {
    if (((*(uint *)(param_1 + 0x10) & 0x10007) != 0) && ((uVar2 & 0x200) != 0)) {
      cVar4 = FUN_00517f10(param_1,puVar1);
      if (cVar4 == '\0') {
        bVar3 = false;
      }
    }
    if (bVar3) {
      psVar11 = (short *)(param_1 + 0x49);
      sVar10 = -8;
      sVar8 = param_2[1];
      if (*psVar11 < 1) {
        sVar10 = 8;
      }
      sVar9 = -8;
      sVar6 = *param_2;
      if (*(short *)(param_1 + 0x4d) < 1) {
        sVar9 = 8;
      }
      do {
        sVar5 = sVar6;
        sVar6 = sVar5 + sVar10;
        bVar7 = (byte)((ushort)sVar6 >> 8);
        sVar8 = sVar8 + sVar9;
        local_e = CONCAT11((char)((ushort)sVar8 >> 8),bVar7);
      } while (((&game_state.level_data[0].flags)[(local_e & 0xfe) * 2 | local_e & 0xfe00] & 0x80200
               ) != 0);
      if (param_3 != '\0') {
        if (((byte)((ushort)sVar5 >> 8) & 0xfe) == (bVar7 & 0xfe)) {
          *(short *)(param_1 + 0x4d) = -*(short *)(param_1 + 0x4d);
        }
        else {
          *psVar11 = -*psVar11;
        }
      }
      *param_2 = sVar6;
      param_2[1] = sVar8;
    }
  }
  return;
}
