
../populous-research-inputs/game/app/D3DPopTB.exe:     file format pei-i386


Disassembly of section .text:

004c2c40 <.text+0xc1c40>:
  4c2c40:	8b 44 24 08          	mov    eax,DWORD PTR [esp+0x8]
  4c2c44:	8a 4c 24 04          	mov    cl,BYTE PTR [esp+0x4]
  4c2c48:	8d 14 c5 00 00 00 00 	lea    edx,[eax*8+0x0]
  4c2c4f:	2b d0                	sub    edx,eax
  4c2c51:	b8 01 00 00 00       	mov    eax,0x1
  4c2c56:	d3 e0                	shl    eax,cl
  4c2c58:	09 04 d5 0a 07 96 00 	or     DWORD PTR [edx*8+0x96070a],eax
  4c2c5f:	c3                   	ret
  4c2c60:	8b 44 24 08          	mov    eax,DWORD PTR [esp+0x8]
  4c2c64:	ba 01 00 00 00       	mov    edx,0x1
  4c2c69:	8d 0c c5 00 00 00 00 	lea    ecx,[eax*8+0x0]
  4c2c70:	2b c8                	sub    ecx,eax
  4c2c72:	8d 04 cd 00 00 00 00 	lea    eax,[ecx*8+0x0]
  4c2c79:	8b 4c 24 04          	mov    ecx,DWORD PTR [esp+0x4]
  4c2c7d:	d3 e2                	shl    edx,cl
  4c2c7f:	f7 d2                	not    edx
  4c2c81:	21 90 0a 07 96 00    	and    DWORD PTR [eax+0x96070a],edx
  4c2c87:	8d 84 08 1e 07 96 00 	lea    eax,[eax+ecx*1+0x96071e]
  4c2c8e:	8a 08                	mov    cl,BYTE PTR [eax]
  4c2c90:	80 e1 f0             	and    cl,0xf0
  4c2c93:	88 08                	mov    BYTE PTR [eax],cl
  4c2c95:	80 e1 0f             	and    cl,0xf
  4c2c98:	88 08                	mov    BYTE PTR [eax],cl
  4c2c9a:	c3                   	ret
  4c2c9b:	cc                   	int3
  4c2c9c:	cc                   	int3
  4c2c9d:	cc                   	int3
  4c2c9e:	cc                   	int3
  4c2c9f:	cc                   	int3
  4c2ca0:	8b 44 24 04          	mov    eax,DWORD PTR [esp+0x4]
  4c2ca4:	8b c8                	mov    ecx,eax
  4c2ca6:	c1 e1 06             	shl    ecx,0x6
  4c2ca9:	2b c8                	sub    ecx,eax
  4c2cab:	2b c8                	sub    ecx,eax
  4c2cad:	66 83 b9 d0 80 5a 00 	cmp    WORD PTR [ecx+0x5a80d0],0x2
  4c2cb4:	02 
  4c2cb5:	75 0c                	jne    0x4c2cc3
  4c2cb7:	f6 05 7d d1 89 00 01 	test   BYTE PTR ds:0x89d17d,0x1
  4c2cbe:	75 03                	jne    0x4c2cc3
  4c2cc0:	32 c0                	xor    al,al
  4c2cc2:	c3                   	ret
  4c2cc3:	b0 01                	mov    al,0x1
  4c2cc5:	c3                   	ret
