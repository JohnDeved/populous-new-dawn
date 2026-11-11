#include "guest_memory_port.h"
#include <assert.h>
#include <stdio.h>
int main(void){assert(!gm_create(0));assert(!gm_create(5));GuestMemoryPort *m=gm_create(4);assert(m);
assert(gm_map_page(m,0x10000)==GM_OK);assert(gm_map_page(m,0x20000)==GM_OK);assert(gm_map_page(m,0xfe000000)==GM_OK);assert(gm_map_page(m,0xffff0000)==GM_OK);assert(gm_map_page(m,0x10000)==GM_OK);assert(gm_mapped_pages(m)==4);assert(gm_map_page(m,0x400000)==GM_BUDGET);
const uint32_t addresses[]={0x10000,0x1fffe,0xfe000000,0xfffffffc};uint32_t v=0;
for(unsigned i=0;i<4;i++){assert(gm_write_u32(m,addresses[i],0xdeadbeef)==GM_OK);assert(gm_read_u32(m,addresses[i],&v)==GM_OK);assert(v==0xdeadbeef);}
assert(gm_protect_page(m,0x20000,0)==GM_OK);assert(gm_write_u32(m,0x1fffe,0)==GM_READONLY);assert(gm_read_u32(m,0x1fffe,&v)==GM_OK&&v==0xdeadbeef);
v=123;assert(gm_read_u32(m,0,&v)==GM_OVERFLOW&&v==123);assert(gm_read_u32(m,0xfffffffe,&v)==GM_OVERFLOW&&v==123);assert(gm_read_u32(m,0x400000,&v)==GM_UNMAPPED&&v==123);
uint8_t snapshot[4];assert(gm_copy_out(m,0x10000,snapshot,4)==GM_OK);snapshot[0]=0;assert(gm_read_u32(m,0x10000,&v)==GM_OK&&v==0xdeadbeef);
assert(gm_copy_in(m,0x10000,NULL,4)==GM_ARGUMENT);assert(gm_copy_out(m,0x10000,snapshot,65537)==GM_ARGUMENT);assert(gm_map_page(m,1)==GM_ARGUMENT);assert(gm_protect_page(m,0x20000,2)==GM_ARGUMENT);
gm_destroy(m);puts("PASS synthetic C sparse-memory scalar/copy/protection contract; no original game");return 0;}
