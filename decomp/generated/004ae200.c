/* Ghidra 12.1.3 pseudocode; entry 004ae200; FUN_004ae200.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


/* WARNING: Unknown calling convention */

void FUN_004ae200(undefined4 param_1)

{
  int iVar1;

  if (((((DAT_0098e908 & 1) == 0) && (DAT_0089c6e7 != '\x04')) && ((DAT_0098e908 & 0x28) == 0)) &&
     ((DAT_009845a1 == '\0' || (DAT_009846a1 != '\0')))) {
    if (((DAT_009845ae != '\0') && (DAT_009846ae == '\0')) ||
       ((DAT_0098462e != '\0' && (DAT_0098472e == '\0')))) {
      switch(param_1) {
      case 3:
        param_1 = 5;
        break;
      case 4:
        param_1 = 6;
        break;
      case 5:
        param_1 = 3;
        break;
      case 6:
        param_1 = 4;
      }
    }
    iVar1 = FUN_004999a0();
    if (iVar1 != 0) {
      switch(param_1) {
      case 3:
        param_1 = 5;
        break;
      case 4:
        param_1 = 6;
        break;
      case 5:
        param_1 = 3;
        break;
      case 6:
        param_1 = 4;
      }
    }
    switch(param_1) {
    case 1:
      set_data_to_rddata_chunk(2,1,0);
      if (((DAT_009845bb != '\0') && (DAT_009846bb == '\0')) ||
         ((DAT_009845c7 != '\0' && (DAT_009846c7 == '\0')))) {
        set_data_to_rddata_chunk(2,0x40,0);
        return;
      }
      break;
    case 2:
      set_data_to_rddata_chunk(2,2,0);
      if (((DAT_009845bb != '\0') && (DAT_009846bb == '\0')) ||
         ((DAT_009845c7 != '\0' && (DAT_009846c7 == '\0')))) {
        set_data_to_rddata_chunk(2,0x40,0);
        return;
      }
      break;
    case 3:
    case 199:
      set_data_to_rddata_chunk(2,4,0);
      if (((DAT_009845bb != '\0') && (DAT_009846bb == '\0')) ||
         ((DAT_009845c7 != '\0' && (DAT_009846c7 == '\0')))) {
        set_data_to_rddata_chunk(2,0x40,0);
        return;
      }
      break;
    case 4:
    case 200:
      set_data_to_rddata_chunk(2,8,0);
      if (((DAT_009845bb != '\0') && (DAT_009846bb == '\0')) ||
         ((DAT_009845c7 != '\0' && (DAT_009846c7 == '\0')))) {
        set_data_to_rddata_chunk(2,0x40,0);
        return;
      }
      break;
    case 5:
    case 0xc9:
      if (draw_mode == 2) {
        set_data_to_rddata_chunk(2,4,0);
        return;
      }
      iVar1 = FUN_00499a10();
      if (iVar1 != 0) {
        set_data_to_rddata_chunk(2,0x20,0);
        return;
      }
      set_data_to_rddata_chunk(2,0x10,0);
      return;
    case 6:
    case 0xca:
      if (draw_mode != 2) {
        iVar1 = FUN_00499a10();
        if (iVar1 != 0) {
          set_data_to_rddata_chunk(2,0x10,0);
          return;
        }
        set_data_to_rddata_chunk(2,0x20,0);
        return;
      }
      set_data_to_rddata_chunk(2,8,0);
    }
  }
  return;
}
