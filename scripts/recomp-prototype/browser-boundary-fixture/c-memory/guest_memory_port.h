#ifndef GM_SYNTHETIC_PORT_H
#define GM_SYNTHETIC_PORT_H
#include <stdint.h>
#include <stddef.h>
typedef struct GuestMemoryPort GuestMemoryPort;
typedef enum {GM_OK,GM_UNMAPPED,GM_READONLY,GM_OVERFLOW,GM_BUDGET,GM_ARGUMENT} GMResult;
GuestMemoryPort *gm_create(unsigned max_pages);
void gm_destroy(GuestMemoryPort *);
GMResult gm_map_page(GuestMemoryPort *,uint32_t address);
GMResult gm_protect_page(GuestMemoryPort *,uint32_t address,int writable);
GMResult gm_copy_out(GuestMemoryPort *,uint32_t source,void *host_dest,size_t length);
GMResult gm_copy_in(GuestMemoryPort *,uint32_t dest,const void *host_source,size_t length);
GMResult gm_read_u32(GuestMemoryPort *,uint32_t address,uint32_t *value);
GMResult gm_write_u32(GuestMemoryPort *,uint32_t address,uint32_t value);
unsigned gm_mapped_pages(const GuestMemoryPort *);
#endif
