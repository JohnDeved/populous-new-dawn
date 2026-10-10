
/workspace/scratch/69fd8163d94e/training-static-recovery-20261009/game/d3dpoptb.exe:     file format pei-i386


Disassembly of section .text:

004eef50 <.text+0xedf50>:
  4eef50:	56                   	push   esi
  4eef51:	a1 78 03 89 00       	mov    eax,ds:0x890378
  4eef56:	39 05 84 03 89 00    	cmp    DWORD PTR ds:0x890384,eax
  4eef5c:	76 19                	jbe    0x4eef77
  4eef5e:	33 c9                	xor    ecx,ecx
  4eef60:	88 48 2a             	mov    BYTE PTR [eax+0x2a],cl
  4eef63:	05 b3 00 00 00       	add    eax,0xb3
  4eef68:	83 a0 59 ff ff ff fe 	and    DWORD PTR [eax-0xa7],0xfffffffe
  4eef6f:	39 05 84 03 89 00    	cmp    DWORD PTR ds:0x890384,eax
  4eef75:	77 e9                	ja     0x4eef60
  4eef77:	33 f6                	xor    esi,esi
  4eef79:	33 d2                	xor    edx,edx
  4eef7b:	81 fe 00 00 01 00    	cmp    esi,0x10000
  4eef81:	7d 46                	jge    0x4eefc9
  4eef83:	8b c6                	mov    eax,esi
  4eef85:	8b ce                	mov    ecx,esi
  4eef87:	25 fe 00 00 00       	and    eax,0xfe
  4eef8c:	81 e1 00 fe 00 00    	and    ecx,0xfe00
  4eef92:	03 c0                	add    eax,eax
  4eef94:	46                   	inc    esi
  4eef95:	0b c1                	or     eax,ecx
  4eef97:	8d 0c 85 e4 03 8a 00 	lea    ecx,[eax*4+0x8a03e4]
  4eef9e:	80 61 0e f0          	and    BYTE PTR [ecx+0xe],0xf0
  4eefa2:	66 89 51 06          	mov    WORD PTR [ecx+0x6],dx
  4eefa6:	66 8b 41 08          	mov    ax,WORD PTR [ecx+0x8]
  4eefaa:	66 25 00 fc          	and    ax,0xfc00
  4eefae:	66 89 41 08          	mov    WORD PTR [ecx+0x8],ax
  4eefb2:	66 25 ff 03          	and    ax,0x3ff
  4eefb6:	66 89 41 08          	mov    WORD PTR [ecx+0x8],ax
  4eefba:	88 51 0b             	mov    BYTE PTR [ecx+0xb],dl
  4eefbd:	80 61 0f f0          	and    BYTE PTR [ecx+0xf],0xf0
  4eefc1:	81 21 63 c0 fe fb    	and    DWORD PTR [ecx],0xfbfec063
  4eefc7:	eb b2                	jmp    0x4eef7b
  4eefc9:	e8 32 f3 ff ff       	call   0x4ee300
  4eefce:	5e                   	pop    esi
  4eefcf:	c3                   	ret
