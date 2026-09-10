/* Ghidra 12.1.3 pseudocode; entry 0047aac0; FUN_0047aac0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_0047aac0(void)

{
  bool bVar1;
  int iVar2;
  uint uVar3;

  bVar1 = false;
  if ((char)DAT_00895d97 == '\0') {
    return;
  }
  iVar2 = (int)(char)player_tribe_num;
  if (temp_tribe_command_buffer[iVar2].cmd == '\x1c') {
    return;
  }
  if (temp_tribe_command_buffer[iVar2].cmd == '\f') {
    return;
  }
  temp_tribe_command_buffer[iVar2].f1 = 0;
  temp_tribe_command_buffer[iVar2].arg1 = 0;
  temp_tribe_command_buffer[iVar2].arg2 = 0;
  temp_tribe_command_buffer[iVar2].cmd = 0;
  temp_tribe_command_buffer[iVar2].field4_0xd = 0;
  temp_tribe_command_buffer[iVar2].field5_0xe = 0;
  uVar3 = (uint)player_tribe_num;
  if ((land_flags_1 & 0x800) != 0) {
    DAT_00895d8b = 0;
    DAT_00895d8f = 0;
    DAT_00895d93 = 0;
    DAT_00895d97 = 0;
    DAT_00895d99 = 0;
    return;
  }
  switch(DAT_00895d97 & 0xff) {
  case 0xc:
  case 0x1c:
    land_flags_1 = land_flags_1 | 0x800800;
    bVar1 = true;
    break;
  default:
    if (temp_tribe_command_buffer[uVar3].cmd != '\0') break;
  case 0x23:
  case 0x25:
  case 0x2d:
  case 0x2e:
  case 0x2f:
  case 0x30:
  case 0x52:
    bVar1 = true;
  }
  if (bVar1) {
    temp_tribe_command_buffer[uVar3].cmd = (char)DAT_00895d97;
    temp_tribe_command_buffer[uVar3].arg1 = DAT_00895d8f;
    temp_tribe_command_buffer[uVar3].arg2 = DAT_00895d93;
  }
  DAT_00895d99 = 0;
  DAT_00895d97 = 0;
  DAT_00895d93 = 0;
  DAT_00895d8f = 0;
  DAT_00895d8b = 0;
  return;
}
