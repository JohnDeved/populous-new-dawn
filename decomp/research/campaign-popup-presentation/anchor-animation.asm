
populous-original-inputs-20261020/game/d3dpoptb.exe:     file format pei-i386


Disassembly of section .text:

004afa70 <.text+0xaea70>:
  4afa70:	33 c0                	xor    eax,eax
  4afa72:	a0 81 bb 89 00       	mov    al,ds:0x89bb81
  4afa77:	83 f8 03             	cmp    eax,0x3
  4afa7a:	74 06                	je     0x4afa82
  4afa7c:	83 f8 04             	cmp    eax,0x4
  4afa7f:	74 1b                	je     0x4afa9c
  4afa81:	c3                   	ret
  4afa82:	a0 71 d1 89 00       	mov    al,ds:0x89d171
  4afa87:	38 05 88 bb 89 00    	cmp    BYTE PTR ds:0x89bb88,al
  4afa8d:	7e 21                	jle    0x4afab0
  4afa8f:	c6 05 81 bb 89 00 02 	mov    BYTE PTR ds:0x89bb81,0x2
  4afa96:	a2 88 bb 89 00       	mov    ds:0x89bb88,al
  4afa9b:	c3                   	ret
  4afa9c:	33 c0                	xor    eax,eax
  4afa9e:	38 05 88 bb 89 00    	cmp    BYTE PTR ds:0x89bb88,al
  4afaa4:	7d 0a                	jge    0x4afab0
  4afaa6:	a2 88 bb 89 00       	mov    ds:0x89bb88,al
  4afaab:	a2 81 bb 89 00       	mov    ds:0x89bb81,al
  4afab0:	c3                   	ret
  4afab1:	cc                   	int3
  4afab2:	cc                   	int3
  4afab3:	cc                   	int3
  4afab4:	cc                   	int3
  4afab5:	cc                   	int3
  4afab6:	cc                   	int3
  4afab7:	cc                   	int3
  4afab8:	cc                   	int3
  4afab9:	cc                   	int3
  4afaba:	cc                   	int3
  4afabb:	cc                   	int3
  4afabc:	cc                   	int3
  4afabd:	cc                   	int3
  4afabe:	cc                   	int3
  4afabf:	cc                   	int3
  4afac0:	8b 4c 24 04          	mov    ecx,DWORD PTR [esp+0x4]
  4afac4:	ba af bb 89 00       	mov    edx,0x89bbaf
  4afac9:	c6 05 87 bb 89 00 01 	mov    BYTE PTR ds:0x89bb87,0x1
  4afad0:	c6 05 81 bb 89 00 03 	mov    BYTE PTR ds:0x89bb81,0x3
  4afad7:	8b 01                	mov    eax,DWORD PTR [ecx]
  4afad9:	89 02                	mov    DWORD PTR [edx],eax
  4afadb:	8b 41 04             	mov    eax,DWORD PTR [ecx+0x4]
  4afade:	89 42 04             	mov    DWORD PTR [edx+0x4],eax
  4afae1:	8b 41 08             	mov    eax,DWORD PTR [ecx+0x8]
  4afae4:	89 42 08             	mov    DWORD PTR [edx+0x8],eax
  4afae7:	8b 49 0c             	mov    ecx,DWORD PTR [ecx+0xc]
  4afaea:	c6 05 88 bb 89 00 00 	mov    BYTE PTR ds:0x89bb88,0x0
  4afaf1:	89 4a 0c             	mov    DWORD PTR [edx+0xc],ecx
  4afaf4:	c3                   	ret
  4afaf5:	cc                   	int3
  4afaf6:	cc                   	int3
  4afaf7:	cc                   	int3
  4afaf8:	cc                   	int3
  4afaf9:	cc                   	int3
  4afafa:	cc                   	int3
  4afafb:	cc                   	int3
  4afafc:	cc                   	int3
  4afafd:	cc                   	int3
  4afafe:	cc                   	int3
  4afaff:	cc                   	int3
