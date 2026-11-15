/* Authored bounded calling-convention model. No original code includes. */
#include "guest_abi.h"
#define RETURN_TOKEN UINT32_C(0xfdfffff0)
GMResult abi_arg(GuestMemoryPort *m,const AbiCpu *r,unsigned i,uint32_t *out){if(!r||i>=16)return GM_ARGUMENT;return gm_read_u32(m,r->esp+4u+4u*i,out);}
int abi_return(AbiCpu *r,int argc,uint32_t value){if(!r||argc< -1||argc>16)return -1;r->eax=value;r->esp+=4u+(argc>0?4u*(unsigned)argc:0);return 0;}
int abi_call(GuestMemoryPort *m,AbiCpu *r,uint32_t target,const uint32_t *args,size_t n,AbiDispatch dispatch,uint32_t *out){
 if(!m||!r||!dispatch||!out||n>16||(n&&!args))return -1;
 uint8_t bytes[68];const size_t length=4*(n+1);
 for(size_t i=0;i<=n;i++){uint32_t word=i?args[i-1]:RETURN_TOKEN;for(unsigned j=0;j<4;j++)bytes[4*i+j]=(uint8_t)(word>>(8*j));}
 const uint32_t sp=r->esp,frame=sp-(uint32_t)length;
 const uint32_t preserved[7]={r->ecx,r->edx,r->ebx,r->ebp,r->esi,r->edi,r->df};
 if(gm_copy_in(m,frame,bytes,length)!=GM_OK)return -2;
 r->esp=frame;
 const int status=dispatch(m,r,target);if(status)return status; /* retain trap frame */
 *out=r->eax;r->esp=sp;
 r->ecx=preserved[0];r->edx=preserved[1];r->ebx=preserved[2];r->ebp=preserved[3];r->esi=preserved[4];r->edi=preserved[5];r->df=preserved[6];
 return 0;
}
