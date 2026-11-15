#include "guest_abi.h"
#include <assert.h>
#include <stdio.h>
#include <string.h>
static int dispatch(GuestMemoryPort *m,AbiCpu *r,uint32_t token){
 uint32_t ret,a,b;assert(gm_read_u32(m,r->esp,&ret)==GM_OK&&ret==0xfdfffff0);
 if(token==0xfe000010){assert(abi_arg(m,r,0,&a)==GM_OK);assert(abi_arg(m,r,1,&b)==GM_OK);r->ecx=88;r->df=0;return abi_return(r,2,a+b);}
 if(token==0xfe000014){assert(abi_arg(m,r,0,&a)==GM_OK);return abi_return(r,-1,a*2);}
 if(token==0xfe000018){const uint32_t args[2]={4,5};uint32_t value;uint32_t esp=r->esp;assert(abi_call(m,r,0xfe000010,args,2,dispatch,&value)==0);assert(r->esp==esp&&value==9);return abi_return(r,0,value+1);}
 return -3;
}
int main(void){
 GuestMemoryPort *m=gm_create(2);assert(m);assert(gm_map_page(m,0x10000)==GM_OK);assert(gm_map_page(m,0x20000)==GM_OK);
 AbiCpu initial={.eax=0,.ecx=1,.edx=2,.ebx=3,.esp=0x20008,.ebp=4,.esi=5,.edi=6,.df=1,.fs_base=0x18000};
 AbiCpu r=initial;uint32_t out=99,args[2]={11,22};
 assert(abi_call(m,&r,0xfe000010,args,2,dispatch,&out)==0&&out==33);AbiCpu expected=initial;expected.eax=33;assert(memcmp(&r,&expected,sizeof r)==0);
 r=initial;assert(abi_call(m,&r,0xfe000014,args,1,dispatch,&out)==0&&out==22);assert(r.esp==initial.esp);
 r=initial;assert(abi_call(m,&r,0xfe000018,NULL,0,dispatch,&out)==0&&out==10);assert(r.esp==initial.esp);
 r=initial;assert(abi_call(m,&r,1,args,17,dispatch,&out)==-1);assert(memcmp(&r,&initial,sizeof r)==0);
 assert(gm_read_u32(m,0xfe000010,&out)==GM_UNMAPPED); /* token is not a pointer */
 r=initial;r.esp=0x10004;AbiCpu before=r;assert(abi_call(m,&r,1,args,2,dispatch,&out)==-2);assert(memcmp(&r,&before,sizeof r)==0);
 r=initial;out=123;assert(abi_call(m,&r,1,NULL,0,dispatch,&out)==-3&&out==123);assert(r.esp==initial.esp-4);
 assert(abi_return(&r,17,0)==-1);assert(abi_arg(m,&r,16,&out)==GM_ARGUMENT);
 gm_destroy(m);puts("PASS authored C sparse guest ABI: stdcall, cdecl, nested callback, registers, cross-page stack, bounds, diagnostic trap, token separation");return 0;
}
