
/workspace/scratch/69fd8163d94e/populous-original-inputs-20261020/game/d3dpoptb.exe:     file format pei-i386


Disassembly of section .text:

0044db60 <.text+0x4cb60>:
  44db60:	56                   	push   esi
  44db61:	33 d2                	xor    edx,edx
  44db63:	32 c0                	xor    al,al
  44db65:	66 39 15 bd c6 68 00 	cmp    WORD PTR ds:0x68c6bd,dx
  44db6c:	0f 84 b0 00 00 00    	je     0x44dc22
  44db72:	66 ff 0d bd c6 68 00 	dec    WORD PTR ds:0x68c6bd
  44db79:	b0 01                	mov    al,0x1
  44db7b:	66 39 15 bd c6 68 00 	cmp    WORD PTR ds:0x68c6bd,dx
  44db82:	7e 62                	jle    0x44dbe6
  44db84:	f6 05 c0 c6 68 00 08 	test   BYTE PTR ds:0x68c6c0,0x8
  44db8b:	75 35                	jne    0x44dbc2
  44db8d:	33 f6                	xor    esi,esi
  44db8f:	66 39 15 bb c6 68 00 	cmp    WORD PTR ds:0x68c6bb,dx
  44db96:	74 1d                	je     0x44dbb5
  44db98:	33 c9                	xor    ecx,ecx
  44db9a:	66 8b 0d bb c6 68 00 	mov    cx,WORD PTR ds:0x68c6bb
  44dba1:	8b 0c 8d 90 03 89 00 	mov    ecx,DWORD PTR [ecx*4+0x890390]
  44dba8:	f6 41 0c 01          	test   BYTE PTR [ecx+0xc],0x1
  44dbac:	75 07                	jne    0x44dbb5
  44dbae:	38 51 2a             	cmp    BYTE PTR [ecx+0x2a],dl
  44dbb1:	74 02                	je     0x44dbb5
  44dbb3:	8b f1                	mov    esi,ecx
  44dbb5:	85 f6                	test   esi,esi
  44dbb7:	74 2d                	je     0x44dbe6
  44dbb9:	f6 05 c0 c6 68 00 04 	test   BYTE PTR ds:0x68c6c0,0x4
  44dbc0:	74 24                	je     0x44dbe6
  44dbc2:	c7 05 9d b6 68 00 01 	mov    DWORD PTR ds:0x68b69d,0x1
  44dbc9:	00 00 00 
  44dbcc:	c7 05 b7 c6 68 00 00 	mov    DWORD PTR ds:0x68c6b7,0x0
  44dbd3:	00 00 00 
  44dbd6:	8b 0d 50 a8 5c 00    	mov    ecx,DWORD PTR ds:0x5ca850
  44dbdc:	03 c9                	add    ecx,ecx
  44dbde:	89 0d b3 c6 68 00    	mov    DWORD PTR ds:0x68c6b3,ecx
  44dbe4:	eb 02                	jmp    0x44dbe8
  44dbe6:	b2 01                	mov    dl,0x1
  44dbe8:	33 c9                	xor    ecx,ecx
  44dbea:	84 d2                	test   dl,dl
  44dbec:	74 34                	je     0x44dc22
  44dbee:	66 89 0d a5 c6 68 00 	mov    WORD PTR ds:0x68c6a5,cx
  44dbf5:	89 0d af c6 68 00    	mov    DWORD PTR ds:0x68c6af,ecx
  44dbfb:	66 89 0d a1 b6 68 00 	mov    WORD PTR ds:0x68b6a1,cx
  44dc02:	88 0d c0 c6 68 00    	mov    BYTE PTR ds:0x68c6c0,cl
  44dc08:	66 89 0d bb c6 68 00 	mov    WORD PTR ds:0x68c6bb,cx
  44dc0f:	89 0d a1 c6 68 00    	mov    DWORD PTR ds:0x68c6a1,ecx
  44dc15:	66 89 0d bd c6 68 00 	mov    WORD PTR ds:0x68c6bd,cx
  44dc1c:	88 0d bf c6 68 00    	mov    BYTE PTR ds:0x68c6bf,cl
  44dc22:	5e                   	pop    esi
