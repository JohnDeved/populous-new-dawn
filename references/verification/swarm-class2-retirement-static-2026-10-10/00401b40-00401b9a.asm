
/workspace/scratch/69fd8163d94e/training-static-recovery-20261009/game/d3dpoptb.exe:     file format pei-i386


Disassembly of section .text:

00401b40 <.text+0xb40>:
  401b40:	8b 4c 24 04          	mov    ecx,DWORD PTR [esp+0x4]
  401b44:	56                   	push   esi
  401b45:	8b 01                	mov    eax,DWORD PTR [ecx]
  401b47:	8d 51 04             	lea    edx,[ecx+0x4]
  401b4a:	85 c0                	test   eax,eax
  401b4c:	74 07                	je     0x401b55
  401b4e:	8b 32                	mov    esi,DWORD PTR [edx]
  401b50:	89 70 04             	mov    DWORD PTR [eax+0x4],esi
  401b53:	eb 07                	jmp    0x401b5c
  401b55:	8b 02                	mov    eax,DWORD PTR [edx]
  401b57:	a3 28 03 89 00       	mov    ds:0x890328,eax
  401b5c:	8b 02                	mov    eax,DWORD PTR [edx]
  401b5e:	85 c0                	test   eax,eax
  401b60:	74 04                	je     0x401b66
  401b62:	8b 31                	mov    esi,DWORD PTR [ecx]
  401b64:	89 30                	mov    DWORD PTR [eax],esi
  401b66:	66 81 79 24 80 02    	cmp    WORD PTR [ecx+0x24],0x280
  401b6c:	c7 01 00 00 00 00    	mov    DWORD PTR [ecx],0x0
  401b72:	72 0f                	jb     0x401b83
  401b74:	a1 1c 03 89 00       	mov    eax,ds:0x89031c
  401b79:	89 02                	mov    DWORD PTR [edx],eax
  401b7b:	89 0d 1c 03 89 00    	mov    DWORD PTR ds:0x89031c,ecx
  401b81:	eb 0d                	jmp    0x401b90
  401b83:	a1 20 03 89 00       	mov    eax,ds:0x890320
  401b88:	89 02                	mov    DWORD PTR [edx],eax
  401b8a:	89 0d 20 03 89 00    	mov    DWORD PTR ds:0x890320,ecx
  401b90:	8b 02                	mov    eax,DWORD PTR [edx]
  401b92:	85 c0                	test   eax,eax
  401b94:	74 02                	je     0x401b98
  401b96:	89 08                	mov    DWORD PTR [eax],ecx
  401b98:	5e                   	pop    esi
  401b99:	c3                   	ret
