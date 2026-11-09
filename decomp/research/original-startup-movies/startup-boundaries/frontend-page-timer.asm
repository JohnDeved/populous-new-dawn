
INPUT/d3dpoptb.exe:     file format pei-i386


Disassembly of section .text:

004c5b60 <.text+0xc4b60>:
  4c5b60:	53                   	push   ebx
  4c5b61:	a1 ec 9c 74 00       	mov    eax,ds:0x749cec
  4c5b66:	56                   	push   esi
  4c5b67:	57                   	push   edi
  4c5b68:	55                   	push   ebp
  4c5b69:	8d 0c 40             	lea    ecx,[eax+eax*2]
  4c5b6c:	8b 04 cd 2c a0 5d 00 	mov    eax,DWORD PTR [ecx*8+0x5da02c]
  4c5b73:	8d 1c cd 28 a0 5d 00 	lea    ebx,[ecx*8+0x5da028]
  4c5b7a:	50                   	push   eax
  4c5b7b:	e8 c0 3d f9 ff       	call   0x459940
  4c5b80:	83 c4 04             	add    esp,0x4
  4c5b83:	83 7b 10 ff          	cmp    DWORD PTR [ebx+0x10],0xffffffff
  4c5b87:	7e 0d                	jle    0x4c5b96
  4c5b89:	ff 15 84 c7 d0 00    	call   DWORD PTR ds:0xd0c784
  4c5b8f:	8b 4c 24 14          	mov    ecx,DWORD PTR [esp+0x14]
  4c5b93:	89 41 0c             	mov    DWORD PTR [ecx+0xc],eax
  4c5b96:	8b 0d 20 9f 5d 00    	mov    ecx,DWORD PTR ds:0x5d9f20
  4c5b9c:	33 d2                	xor    edx,edx
  4c5b9e:	39 15 1c 9f 5d 00    	cmp    DWORD PTR ds:0x5d9f1c,edx
  4c5ba4:	7e 12                	jle    0x4c5bb8
  4c5ba6:	8b 41 04             	mov    eax,DWORD PTR [ecx+0x4]
  4c5ba9:	42                   	inc    edx
  4c5baa:	83 c1 08             	add    ecx,0x8
  4c5bad:	83 08 03             	or     DWORD PTR [eax],0x3
  4c5bb0:	39 15 1c 9f 5d 00    	cmp    DWORD PTR ds:0x5d9f1c,edx
  4c5bb6:	7f ee                	jg     0x4c5ba6
  4c5bb8:	a1 20 9f 5d 00       	mov    eax,ds:0x5d9f20
  4c5bbd:	33 ed                	xor    ebp,ebp
  4c5bbf:	8b 48 04             	mov    ecx,DWORD PTR [eax+0x4]
  4c5bc2:	83 21 fc             	and    DWORD PTR [ecx],0xfffffffc
  4c5bc5:	a1 20 9f 5d 00       	mov    eax,ds:0x5d9f20
  4c5bca:	8b 53 0c             	mov    edx,DWORD PTR [ebx+0xc]
  4c5bcd:	83 c0 08             	add    eax,0x8
  4c5bd0:	39 6b 08             	cmp    DWORD PTR [ebx+0x8],ebp
  4c5bd3:	7e 1e                	jle    0x4c5bf3
  4c5bd5:	8b 78 04             	mov    edi,DWORD PTR [eax+0x4]
  4c5bd8:	8b f2                	mov    esi,edx
  4c5bda:	b9 0b 00 00 00       	mov    ecx,0xb
  4c5bdf:	45                   	inc    ebp
  4c5be0:	f3 a5                	rep movs DWORD PTR es:[edi],DWORD PTR ds:[esi]
  4c5be2:	8b 48 04             	mov    ecx,DWORD PTR [eax+0x4]
  4c5be5:	83 c0 08             	add    eax,0x8
  4c5be8:	83 c2 2c             	add    edx,0x2c
  4c5beb:	83 21 fc             	and    DWORD PTR [ecx],0xfffffffc
  4c5bee:	39 6b 08             	cmp    DWORD PTR [ebx+0x8],ebp
  4c5bf1:	7f e2                	jg     0x4c5bd5
  4c5bf3:	5d                   	pop    ebp
  4c5bf4:	5f                   	pop    edi
  4c5bf5:	5e                   	pop    esi
  4c5bf6:	5b                   	pop    ebx
  4c5bf7:	c3                   	ret
  4c5bf8:	cc                   	int3
  4c5bf9:	cc                   	int3
  4c5bfa:	cc                   	int3
  4c5bfb:	cc                   	int3
  4c5bfc:	cc                   	int3
  4c5bfd:	cc                   	int3
  4c5bfe:	cc                   	int3
  4c5bff:	cc                   	int3
  4c5c00:	56                   	push   esi
  4c5c01:	a1 ec 9c 74 00       	mov    eax,ds:0x749cec
  4c5c06:	8d 0c 40             	lea    ecx,[eax+eax*2]
  4c5c09:	8b 0c cd 38 a0 5d 00 	mov    ecx,DWORD PTR [ecx*8+0x5da038]
  4c5c10:	83 f9 ff             	cmp    ecx,0xffffffff
  4c5c13:	7e 18                	jle    0x4c5c2d
  4c5c15:	8b 44 24 08          	mov    eax,DWORD PTR [esp+0x8]
  4c5c19:	8b 70 0c             	mov    esi,DWORD PTR [eax+0xc]
  4c5c1c:	03 f1                	add    esi,ecx
  4c5c1e:	ff 15 84 c7 d0 00    	call   DWORD PTR ds:0xd0c784
  4c5c24:	3b f0                	cmp    esi,eax
  4c5c26:	73 05                	jae    0x4c5c2d
  4c5c28:	e8 c3 7b f9 ff       	call   0x45d7f0
  4c5c2d:	5e                   	pop    esi
  4c5c2e:	c3                   	ret

INPUT/d3dpoptb.exe:     file format pei-i386


Disassembly of section .text:

0045d7f0 <.text+0x5c7f0>:
  45d7f0:	a1 ec 9c 74 00       	mov    eax,ds:0x749cec
  45d7f5:	8d 0c 40             	lea    ecx,[eax+eax*2]
  45d7f8:	8b 04 cd 3c a0 5d 00 	mov    eax,DWORD PTR [ecx*8+0x5da03c]
  45d7ff:	85 c0                	test   eax,eax
  45d801:	74 02                	je     0x45d805
  45d803:	ff e0                	jmp    eax
  45d805:	c3                   	ret

INPUT/d3dpoptb.exe:     file format pei-i386


Disassembly of section .text:

004c5cd0 <.text+0xc4cd0>:
  4c5cd0:	c7 05 04 d1 59 00 01 	mov    DWORD PTR ds:0x59d104,0x1
  4c5cd7:	00 00 00 
  4c5cda:	6a 00                	push   0x0
  4c5cdc:	e8 5f 3c f9 ff       	call   0x459940
  4c5ce1:	83 c4 04             	add    esp,0x4
  4c5ce4:	6a 00                	push   0x0
  4c5ce6:	e8 d5 46 f9 ff       	call   0x45a3c0
  4c5ceb:	83 c4 04             	add    esp,0x4
  4c5cee:	c3                   	ret
