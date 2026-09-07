/* Ghidra 12.1.3 pseudocode; entry 0040c920; set_obj_pnts_and_facs.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void set_obj_pnts_and_facs(void)

{
  objs0_struct *poVar1;

  if (objs0_0_loaded == '\x01') {
    poVar1 = objs0_mem;
    if (objs0_mem < obj_mem_end) {
      do {
        if (poVar1->facs0_ptr == (facs0_struct *)0x0) {
          poVar1->facs0_ptr = (facs0_struct *)0x0;
        }
        else {
          poVar1->facs0_ptr = facs0_mem + (int)&poVar1->facs0_ptr[-1].flags;
        }
        if (poVar1->facs0_ptr_end == (facs0_struct *)0x0) {
          poVar1->facs0_ptr_end = (facs0_struct *)0x0;
        }
        else {
          poVar1->facs0_ptr_end = facs0_mem + (int)&poVar1->facs0_ptr_end[-1].flags;
        }
        if (poVar1->pnts0_ptr == (pnts0_struct *)0x0) {
          poVar1->pnts0_ptr = (pnts0_struct *)0x0;
        }
        else {
          poVar1->pnts0_ptr = pnts0_mem + (int)((int)&poVar1->pnts0_ptr[-1].z + 1);
        }
        if (poVar1->pnts0_ptr_end == (pnts0_struct *)0x0) {
          poVar1->pnts0_ptr_end = (pnts0_struct *)0x0;
        }
        else {
          poVar1->pnts0_ptr_end = pnts0_mem + (int)((int)&poVar1->pnts0_ptr_end[-1].z + 1);
        }
        poVar1 = poVar1 + 1;
      } while (poVar1 < obj_mem_end);
    }
    objs0_0_loaded = '\x02';
  }
  return;
}
