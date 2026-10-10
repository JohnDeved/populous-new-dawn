
/workspace/scratch/69fd8163d94e/training-static-recovery-20261009/game/d3dpoptb.exe:     file format pei-i386


Disassembly of section .text:

0047ac30 <.text+0x79c30>:
  47ac30:	f6 05 62 c6 89 00 01 	test   BYTE PTR ds:0x89c662,0x1
  47ac37:	57                   	push   edi
  47ac38:	75 10                	jne    0x47ac4a
  47ac3a:	bf 97 79 89 00       	mov    edi,0x897997
  47ac3f:	33 c0                	xor    eax,eax
  47ac41:	b9 0f 00 00 00       	mov    ecx,0xf
  47ac46:	f3 ab                	rep stos DWORD PTR es:[edi],eax
  47ac48:	5f                   	pop    edi
  47ac49:	c3                   	ret
  47ac4a:	81 25 61 c6 89 00 ff 	and    DWORD PTR ds:0x89c661,0xfffffeff
  47ac51:	fe ff ff 
  47ac54:	5f                   	pop    edi
  47ac55:	c3                   	ret
  47ac56:	cc                   	int3
  47ac57:	cc                   	int3
  47ac58:	cc                   	int3
  47ac59:	cc                   	int3
  47ac5a:	cc                   	int3
  47ac5b:	cc                   	int3
  47ac5c:	cc                   	int3
  47ac5d:	cc                   	int3
  47ac5e:	cc                   	int3
  47ac5f:	cc                   	int3
  47ac60:	b8 00 00 40 00       	mov    eax,0x400000
  47ac65:	85 05 61 c6 89 00    	test   DWORD PTR ds:0x89c661,eax
  47ac6b:	75 2d                	jne    0x47ac9a
  47ac6d:	66 83 3d c2 ca 87 00 	cmp    WORD PTR ds:0x87cac2,0x0
  47ac74:	00 
  47ac75:	74 2d                	je     0x47aca4
  47ac77:	8b 0d 84 45 98 00    	mov    ecx,DWORD PTR ds:0x984584
  47ac7d:	09 05 61 c6 89 00    	or     DWORD PTR ds:0x89c661,eax
  47ac83:	66 89 0d db c6 89 00 	mov    WORD PTR ds:0x89c6db,cx
  47ac8a:	a1 80 45 98 00       	mov    eax,ds:0x984580
  47ac8f:	66                   	data16
