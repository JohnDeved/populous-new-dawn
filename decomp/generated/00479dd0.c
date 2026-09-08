/* Ghidra 12.1.3 pseudocode; entry 00479dd0; set_data_to_rddata_chunk.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */

void set_data_to_rddata_chunk(undefined2 param_1,uint param_2,undefined4 param_3)

{
  bool bVar1;

  bVar1 = false;
  switch(param_1) {
  case 2:
    if ((char)rddata_chunk_data_0089798d.type == '\0') {
      rddata_chunk_data_0089798d.type._0_1_ = (char)param_1;
    }
    if ((param_2 & rddata_chunk_data_0089798d.type._1_1_) != 0) {
      rddata_chunk_data_0089798d.type._1_1_ = rddata_chunk_data_0089798d.type._1_1_ | 0x40;
    }
    rddata_chunk_data_0089798d.type._1_1_ = rddata_chunk_data_0089798d.type._1_1_ | (byte)param_2;
    goto LAB_00479e40;
  default:
    if ((char)rddata_chunk_data_0089798d.type != '\0') goto LAB_00479e40;
    break;
  case 0x23:
  case 0x25:
  case 0x6a:
  case 0x6c:
    break;
  case 0x6b:
    if (((char)rddata_chunk_data_0089798d.type == 'j') ||
       ((char)rddata_chunk_data_0089798d.type == 'l')) goto LAB_00479e40;
  }
  bVar1 = true;
LAB_00479e40:
  if (bVar1) {
    rddata_chunk_data_0089798d._2_4_ = param_2;
    ram0x00897993 = param_3;
    rddata_chunk_data_0089798d.type._0_1_ = (char)param_1;
  }
  return;
}
