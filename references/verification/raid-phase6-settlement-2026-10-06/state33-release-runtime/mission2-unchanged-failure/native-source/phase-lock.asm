
/workspace/scratch/69fd8163d94e/cloud-dev-20261004/prerequisites/game/d3dpoptb.exe:     file format pei-i386


Disassembly of section .text:

004f5c80 <.text+0xf4c80>:
  4f5c80:	56                   	push   esi
  4f5c81:	57                   	push   edi
  4f5c82:	8b 7c 24 0c          	mov    edi,DWORD PTR [esp+0xc]
  4f5c86:	8b 74 24 10          	mov    esi,DWORD PTR [esp+0x10]
  4f5c8a:	8b 87 96 05 00 00    	mov    eax,DWORD PTR [edi+0x596]
  4f5c90:	a8 02                	test   al,0x2
  4f5c92:	74 22                	je     0x4f5cb6
  4f5c94:	8b c6                	mov    eax,esi
  4f5c96:	b9 52 00 00 00       	mov    ecx,0x52
  4f5c9b:	2b c7                	sub    eax,edi
  4f5c9d:	83 e8 36             	sub    eax,0x36
  4f5ca0:	99                   	cdq
  4f5ca1:	f7 f9                	idiv   ecx
  4f5ca3:	33 c9                	xor    ecx,ecx
  4f5ca5:	8a 8f b3 05 00 00    	mov    cl,BYTE PTR [edi+0x5b3]
  4f5cab:	2b c1                	sub    eax,ecx
  4f5cad:	83 f8 01             	cmp    eax,0x1
  4f5cb0:	1b c0                	sbb    eax,eax
  4f5cb2:	f7 d8                	neg    eax
  4f5cb4:	eb 45                	jmp    0x4f5cfb
  4f5cb6:	80 7e 4f 14          	cmp    BYTE PTR [esi+0x4f],0x14
  4f5cba:	75 0b                	jne    0x4f5cc7
  4f5cbc:	83 c8 02             	or     eax,0x2
  4f5cbf:	89 87 96 05 00 00    	mov    DWORD PTR [edi+0x596],eax
  4f5cc5:	eb 1a                	jmp    0x4f5ce1
  4f5cc7:	56                   	push   esi
  4f5cc8:	57                   	push   edi
  4f5cc9:	e8 c2 c5 ff ff       	call   0x4f2290
  4f5cce:	83 c4 08             	add    esp,0x8
  4f5cd1:	85 c0                	test   eax,eax
  4f5cd3:	b8 00 00 00 00       	mov    eax,0x0
  4f5cd8:	75 21                	jne    0x4f5cfb
  4f5cda:	83 8f 96 05 00 00 02 	or     DWORD PTR [edi+0x596],0x2
  4f5ce1:	8b c6                	mov    eax,esi
  4f5ce3:	b9 52 00 00 00       	mov    ecx,0x52
  4f5ce8:	2b c7                	sub    eax,edi
  4f5cea:	83 e8 36             	sub    eax,0x36
  4f5ced:	99                   	cdq
  4f5cee:	f7 f9                	idiv   ecx
  4f5cf0:	88 87 b3 05 00 00    	mov    BYTE PTR [edi+0x5b3],al
  4f5cf6:	b8 01 00 00 00       	mov    eax,0x1
  4f5cfb:	85 c0                	test   eax,eax
  4f5cfd:	74 08                	je     0x4f5d07
  4f5cff:	8b 44 24 14          	mov    eax,DWORD PTR [esp+0x14]
  4f5d03:	66 89 46 42          	mov    WORD PTR [esi+0x42],ax
  4f5d07:	5f                   	pop    edi
  4f5d08:	5e                   	pop    esi
  4f5d09:	c3                   	ret
  4f5d0a:	cc                   	int3
  4f5d0b:	cc                   	int3
  4f5d0c:	cc                   	int3
  4f5d0d:	cc                   	int3
  4f5d0e:	cc                   	int3
  4f5d0f:	cc                   	int3
