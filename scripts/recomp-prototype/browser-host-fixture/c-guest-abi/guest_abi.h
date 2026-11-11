/* Authored synthetic boundary, not the original CPU struct or runtime. */
#ifndef SYNTHETIC_GUEST_ABI_H
#define SYNTHETIC_GUEST_ABI_H
#include "guest_memory_port.h"
#include <stdint.h>
#include <stddef.h>
typedef struct {uint32_t eax,ecx,edx,ebx,esp,ebp,esi,edi,df,fs_base;} AbiCpu;
typedef int (*AbiDispatch)(GuestMemoryPort *,AbiCpu *,uint32_t);
int abi_call(GuestMemoryPort *,AbiCpu *,uint32_t,const uint32_t *,size_t,AbiDispatch,uint32_t *);
GMResult abi_arg(GuestMemoryPort *,const AbiCpu *,unsigned,uint32_t *);
int abi_return(AbiCpu *,int,uint32_t);
#endif
