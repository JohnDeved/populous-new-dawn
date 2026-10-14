
/workspace/scratch/69fd8163d94e/training-static-recovery-20261009/game/d3dpoptb.exe:     file format pei-i386


Disassembly of section .text:

0044b100 <.text+0x4a100>:
  44b100:	33 c0                	xor    eax,eax
  44b102:	66 a3 a5 c6 68 00    	mov    ds:0x68c6a5,ax
  44b108:	a3 af c6 68 00       	mov    ds:0x68c6af,eax
  44b10d:	66 a3 a1 b6 68 00    	mov    ds:0x68b6a1,ax
  44b113:	a2 c0 c6 68 00       	mov    ds:0x68c6c0,al
  44b118:	66 a3 bb c6 68 00    	mov    ds:0x68c6bb,ax
  44b11e:	a3 a1 c6 68 00       	mov    ds:0x68c6a1,eax
  44b123:	66 a3 bd c6 68 00    	mov    ds:0x68c6bd,ax
  44b129:	a2 bf c6 68 00       	mov    ds:0x68c6bf,al
  44b12e:	c3                   	ret
  44b12f:	cc                   	int3
  44b130:	83 ec 04             	sub    esp,0x4
  44b133:	53                   	push   ebx
  44b134:	56                   	push   esi
  44b135:	57                   	push   edi
  44b136:	33 f6                	xor    esi,esi
  44b138:	66 89 35 0c db 98 00 	mov    WORD PTR ds:0x98db0c,si
  44b13f:	55                   	push   ebp
  44b140:	89 35 cc c6 68 00    	mov    DWORD PTR ds:0x68c6cc,esi
  44b146:	39 35 8c ae 5c 00    	cmp    DWORD PTR ds:0x5cae8c,esi
  44b14c:	0f 85 f3 02 00 00    	jne    0x44b445
  44b152:	0f bf 0d cf c6 89 00 	movsx  ecx,WORD PTR ds:0x89c6cf
  44b159:	a1 08 42 68 00       	mov    eax,ds:0x684208
  44b15e:	c1 e0 10             	shl    eax,0x10
  44b161:	99                   	cdq
  44b162:	f7 f9                	idiv   ecx
  44b164:	0f bf 0d d1 c6 89 00 	movsx  ecx,WORD PTR ds:0x89c6d1
  44b16b:	a3 0c 45 68 00       	mov    ds:0x68450c,eax
