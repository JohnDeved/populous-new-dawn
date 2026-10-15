
/workspace/scratch/69fd8163d94e/populous-research-inputs/game/app/D3DPopTB.exe:     file format pei-i386


Disassembly of section .text:

0042bdd0 <.text+0x2add0>:
  42bdd0:	66 a3 ef 26 89 00    	mov    ds:0x8926ef,ax
  42bdd6:	66 a3 f1 26 89 00    	mov    ds:0x8926f1,ax
  42bddc:	c3                   	ret
  42bddd:	cc                   	int3
  42bdde:	cc                   	int3
  42bddf:	cc                   	int3
  42bde0:	0f bf 05 cf c6 89 00 	movsx  eax,WORD PTR ds:0x89c6cf
  42bde7:	0f bf 0d d1 c6 89 00 	movsx  ecx,WORD PTR ds:0x89c6d1
  42bdee:	0f af c1             	imul   eax,ecx
  42bdf1:	3d 00 b0 04 00       	cmp    eax,0x4b000
  42bdf6:	7d 52                	jge    0x42be4a
  42bdf8:	b8 02 00 00 00       	mov    eax,0x2
  42bdfd:	b9 04 00 00 00       	mov    ecx,0x4
  42be02:	a2 d5 28 89 00       	mov    ds:0x8928d5,al
  42be07:	88 0d d4 28 89 00    	mov    BYTE PTR ds:0x8928d4,cl
  42be0d:	a2 d6 28 89 00       	mov    ds:0x8928d6,al
  42be12:	a2 d7 28 89 00       	mov    ds:0x8928d7,al
  42be17:	88 0d d8 28 89 00    	mov    BYTE PTR ds:0x8928d8,cl
  42be1d:	88 0d d9 28 89 00    	mov    BYTE PTR ds:0x8928d9,cl
  42be23:	a2 db 28 89 00       	mov    ds:0x8928db,al
  42be28:	88 0d dc 28 89 00    	mov    BYTE PTR ds:0x8928dc,cl
  42be2e:	c6 05 d3 28 89 00 06 	mov    BYTE PTR ds:0x8928d3,0x6
  42be35:	c6 05 da 28 89 00 00 	mov    BYTE PTR ds:0x8928da,0x0
  42be3c:	c6 05 dd 28 89 00 03 	mov    BYTE PTR ds:0x8928dd,0x3
  42be43:	88 0d de 28 89 00    	mov    BYTE PTR ds:0x8928de,cl
  42be49:	c3                   	ret
  42be4a:	33 c0                	xor    eax,eax
  42be4c:	b9 03 00 00 00       	mov    ecx,0x3
  42be51:	a2 d5 28 89 00       	mov    ds:0x8928d5,al
  42be56:	88 0d d4 28 89 00    	mov    BYTE PTR ds:0x8928d4,cl
  42be5c:	a2 d6 28 89 00       	mov    ds:0x8928d6,al
  42be61:	88 0d d8 28 89 00    	mov    BYTE PTR ds:0x8928d8,cl
  42be67:	88 0d d9 28 89 00    	mov    BYTE PTR ds:0x8928d9,cl
  42be6d:	a2 db 28 89 00       	mov    ds:0x8928db,al
  42be72:	88 0d dc 28 89 00    	mov    BYTE PTR ds:0x8928dc,cl
  42be78:	88 0d dd 28 89 00    	mov    BYTE PTR ds:0x8928dd,cl
  42be7e:	c6 05 d3 28 89 00 04 	mov    BYTE PTR ds:0x8928d3,0x4
  42be85:	c6 05 d7 28 89 00 02 	mov    BYTE PTR ds:0x8928d7,0x2
  42be8c:	c6 05 da 28 89 00 01 	mov    BYTE PTR ds:0x8928da,0x1
  42be93:	88 0d de 28 89 00    	mov    BYTE PTR ds:0x8928de,cl
  42be99:	c3                   	ret
