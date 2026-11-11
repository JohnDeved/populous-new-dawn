/* Proposed interface only. Not included by or compiled with original code. */
#ifndef SYNTHETIC_GUEST_MEMORY_PORT_H
#define SYNTHETIC_GUEST_MEMORY_PORT_H
#include <stdint.h>
#include <stddef.h>
typedef struct GuestMemoryPort GuestMemoryPort;
typedef enum { GM_OK, GM_UNMAPPED, GM_READONLY, GM_OVERFLOW, GM_BUDGET } GMResult;
/* No host pointer return. Guest addresses remain explicit uint32 identifiers.
   Callers must handle non-OK; these functions do not silently synthesize zeros. */
GMResult gm_read_u32(GuestMemoryPort *, uint32_t guest_address, uint32_t *value);
GMResult gm_write_u32(GuestMemoryPort *, uint32_t guest_address, uint32_t value);
/* Host buffers are caller-owned. Copies complete synchronously, are bounded,
   and must not be retained across calls, WASM growth or scheduler suspension. */
GMResult gm_copy_out(GuestMemoryPort *, uint32_t source, void *host_dest, size_t length);
GMResult gm_copy_in(GuestMemoryPort *, uint32_t dest, const void *host_source, size_t length);
/* Copy contracts must distinguish atomic host spans from guest instruction
   partial faults. No generic PTR macro is proposed. Thread-safe publication,
   mappings and protection are deliberately not specified by this header yet. */
#endif
