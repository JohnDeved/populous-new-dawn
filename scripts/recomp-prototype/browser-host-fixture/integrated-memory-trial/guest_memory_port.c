/* Newly authored synthetic adapter; single-owner/thread only. No original code. */
#include "guest_memory_port.h"
#include <stdlib.h>
#include <string.h>
#define PAGE_SIZE 65536u
struct GuestMemoryPort {int8_t table[65536];unsigned count,limit;uint8_t *data;};
GuestMemoryPort *gm_create(unsigned max_pages){if(!max_pages||max_pages>4)return NULL;GuestMemoryPort *m=calloc(1,sizeof *m);if(!m)return NULL;m->data=calloc(max_pages,PAGE_SIZE);if(!m->data){free(m);return NULL;}m->limit=max_pages;return m;}
void gm_destroy(GuestMemoryPort *m){if(m){free(m->data);free(m);}}
unsigned gm_mapped_pages(const GuestMemoryPort *m){return m?m->count:0;}
GMResult gm_map_page(GuestMemoryPort *m,uint32_t a){if(!m||a<PAGE_SIZE||a%PAGE_SIZE)return GM_ARGUMENT;unsigned p=a/PAGE_SIZE;if(m->table[p])return GM_OK;if(m->count==m->limit)return GM_BUDGET;unsigned slot=m->count;memset(m->data+(size_t)slot*PAGE_SIZE,0,PAGE_SIZE);m->table[p]=(int8_t)(slot+1);m->count++;return GM_OK;}
GMResult gm_protect_page(GuestMemoryPort *m,uint32_t a,int writable){if(!m||a<PAGE_SIZE||a%PAGE_SIZE||(writable!=0&&writable!=1))return GM_ARGUMENT;int entry=m->table[a/PAGE_SIZE];if(!entry)return GM_UNMAPPED;if(entry<0)entry=-entry;m->table[a/PAGE_SIZE]=(int8_t)(writable?entry:-entry);return GM_OK;}
static GMResult span(GuestMemoryPort *m,uint32_t a,size_t n,int write){if(!m||!n||n>PAGE_SIZE)return GM_ARGUMENT;if(a<PAGE_SIZE||(uint64_t)a+n>UINT64_C(0x100000000))return GM_OVERFLOW;uint32_t first=a/PAGE_SIZE,last=(uint32_t)(((uint64_t)a+n-1)/PAGE_SIZE);for(uint32_t p=first;p<=last;p++){int e=m->table[p];if(!e)return GM_UNMAPPED;if(write&&e<0)return GM_READONLY;}return GM_OK;}
static size_t offset(GuestMemoryPort *m,uint32_t a){int entry=m->table[a/PAGE_SIZE];if(entry<0)entry=-entry;return (size_t)(entry-1)*PAGE_SIZE+a%PAGE_SIZE;}
GMResult gm_copy_out(GuestMemoryPort *m,uint32_t a,void *dst,size_t n){if(!dst)return GM_ARGUMENT;GMResult r=span(m,a,n,0);if(r!=GM_OK)return r;uint8_t *d=dst;for(size_t i=0;i<n;i++)d[i]=m->data[offset(m,a+(uint32_t)i)];return GM_OK;}
GMResult gm_copy_in(GuestMemoryPort *m,uint32_t a,const void *src,size_t n){if(!src)return GM_ARGUMENT;GMResult r=span(m,a,n,1);if(r!=GM_OK)return r;const uint8_t *s=src;for(size_t i=0;i<n;i++)m->data[offset(m,a+(uint32_t)i)]=s[i];return GM_OK;}
GMResult gm_read_u32(GuestMemoryPort *m,uint32_t a,uint32_t *value){if(!value)return GM_ARGUMENT;uint8_t b[4];GMResult r=gm_copy_out(m,a,b,4);if(r==GM_OK)*value=(uint32_t)b[0]|(uint32_t)b[1]<<8|(uint32_t)b[2]<<16|(uint32_t)b[3]<<24;return r;}
GMResult gm_write_u32(GuestMemoryPort *m,uint32_t a,uint32_t value){uint8_t b[4];for(unsigned i=0;i<4;i++)b[i]=(uint8_t)(value>>(8*i));return gm_copy_in(m,a,b,4);}
