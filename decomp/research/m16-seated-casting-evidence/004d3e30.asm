
../populous-research-inputs/game/app/D3DPopTB.exe:     file format pei-i386


Disassembly of section .text:

004d3e30 <.text+0xd2e30>:
  4d3e30:	53                   	push   ebx
  4d3e31:	56                   	push   esi
  4d3e32:	8b 74 24 0c          	mov    esi,DWORD PTR [esp+0xc]
  4d3e36:	56                   	push   esi
  4d3e37:	e8 04 5d 01 00       	call   0x4e9b40
  4d3e3c:	83 c4 04             	add    esp,0x4
  4d3e3f:	f6 46 0e 10          	test   BYTE PTR [esi+0xe],0x10
  4d3e43:	75 52                	jne    0x4d3e97
  4d3e45:	8a 46 2c             	mov    al,BYTE PTR [esi+0x2c]
  4d3e48:	88 46 7d             	mov    BYTE PTR [esi+0x7d],al
  4d3e4b:	f6 05 7c d1 89 00 02 	test   BYTE PTR ds:0x89d17c,0x2
  4d3e52:	74 17                	je     0x4d3e6b
  4d3e54:	8a 46 2b             	mov    al,BYTE PTR [esi+0x2b]
  4d3e57:	3c 07                	cmp    al,0x7
  4d3e59:	75 04                	jne    0x4d3e5f
  4d3e5b:	b3 27                	mov    bl,0x27
  4d3e5d:	eb 1e                	jmp    0x4d3e7d
  4d3e5f:	33 c9                	xor    ecx,ecx
  4d3e61:	8a c8                	mov    cl,al
  4d3e63:	8d 04 89             	lea    eax,[ecx+ecx*4]
  4d3e66:	8d 14 80             	lea    edx,[eax+eax*4]
  4d3e69:	eb 0b                	jmp    0x4d3e76
  4d3e6b:	33 c0                	xor    eax,eax
  4d3e6d:	8a 46 2b             	mov    al,BYTE PTR [esi+0x2b]
  4d3e70:	8d 0c 80             	lea    ecx,[eax+eax*4]
  4d3e73:	8d 14 89             	lea    edx,[ecx+ecx*4]
  4d3e76:	8a 1c 55 64 70 5a 00 	mov    bl,BYTE PTR [edx*2+0x5a7064]
  4d3e7d:	56                   	push   esi
  4d3e7e:	e8 6d 98 01 00       	call   0x4ed6f0
  4d3e83:	83 c4 04             	add    esp,0x4
  4d3e86:	88 5e 2c             	mov    BYTE PTR [esi+0x2c],bl
  4d3e89:	56                   	push   esi
  4d3e8a:	e8 b1 97 01 00       	call   0x4ed640
  4d3e8f:	83 c4 04             	add    esp,0x4
  4d3e92:	b0 01                	mov    al,0x1
  4d3e94:	5e                   	pop    esi
  4d3e95:	5b                   	pop    ebx
  4d3e96:	c3                   	ret
  4d3e97:	32 c0                	xor    al,al
  4d3e99:	5e                   	pop    esi
  4d3e9a:	5b                   	pop    ebx
  4d3e9b:	c3                   	ret
  4d3e9c:	cc                   	int3
  4d3e9d:	cc                   	int3
  4d3e9e:	cc                   	int3
  4d3e9f:	cc                   	int3
