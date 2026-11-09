
INPUT/d3dpoptb.exe:     file format pei-i386


Disassembly of section .text:

0045ae30 <.text+0x59e30>:
  45ae30:	8b 44 24 04          	mov    eax,DWORD PTR [esp+0x4]
  45ae34:	83 ec 14             	sub    esp,0x14
  45ae37:	c1 e0 05             	shl    eax,0x5
  45ae3a:	53                   	push   ebx
  45ae3b:	56                   	push   esi
  45ae3c:	05 98 9c 5d 00       	add    eax,0x5d9c98
  45ae41:	89 44 24 08          	mov    DWORD PTR [esp+0x8],eax
  45ae45:	57                   	push   edi
  45ae46:	55                   	push   ebp
  45ae47:	8b 70 08             	mov    esi,DWORD PTR [eax+0x8]
  45ae4a:	33 ff                	xor    edi,edi
  45ae4c:	39 78 04             	cmp    DWORD PTR [eax+0x4],edi
  45ae4f:	0f 8e 32 01 00 00    	jle    0x45af87
  45ae55:	8b 4e 04             	mov    ecx,DWORD PTR [esi+0x4]
  45ae58:	8b 19                	mov    ebx,DWORD PTR [ecx]
  45ae5a:	f6 c3 01             	test   bl,0x1
  45ae5d:	0f 85 13 01 00 00    	jne    0x45af76
  45ae63:	8b 16                	mov    edx,DWORD PTR [esi]
  45ae65:	4a                   	dec    edx
  45ae66:	83 fa 0c             	cmp    edx,0xc
  45ae69:	0f 87 07 01 00 00    	ja     0x45af76
  45ae6f:	33 c0                	xor    eax,eax
  45ae71:	8a 82 08 b4 45 00    	mov    al,BYTE PTR [edx+0x45b408]
  45ae77:	ff 24 85 f4 b3 45 00 	jmp    DWORD PTR [eax*4+0x45b3f4]
  45ae7e:	8b 41 08             	mov    eax,DWORD PTR [ecx+0x8]
  45ae81:	85 c0                	test   eax,eax
  45ae83:	0f 84 ed 00 00 00    	je     0x45af76
  45ae89:	51                   	push   ecx
  45ae8a:	ff d0                	call   eax
  45ae8c:	83 c4 04             	add    esp,0x4
  45ae8f:	e9 e2 00 00 00       	jmp    0x45af76
