
INPUT/d3dpoptb.exe:     file format pei-i386


Disassembly of section .text:

004c5a80 <.text+0xc4a80>:
  4c5a80:	c7 05 0c d1 59 00 01 	mov    DWORD PTR ds:0x59d10c,0x1
  4c5a87:	00 00 00 
  4c5a8a:	80 3d 33 ce 89 00 00 	cmp    BYTE PTR ds:0x89ce33,0x0
  4c5a91:	74 1c                	je     0x4c5aaf
  4c5a93:	6a 00                	push   0x0
  4c5a95:	a1 10 df 59 00       	mov    eax,ds:0x59df10
  4c5a9a:	0f be 0d 33 ce 89 00 	movsx  ecx,BYTE PTR ds:0x89ce33
  4c5aa1:	6a 00                	push   0x0
  4c5aa3:	8d 14 c8             	lea    edx,[eax+ecx*8]
  4c5aa6:	52                   	push   edx
  4c5aa7:	e8 54 6f 03 00       	call   0x4fca00
  4c5aac:	83 c4 0c             	add    esp,0xc
  4c5aaf:	81 25 65 c6 89 00 ff 	and    DWORD PTR ds:0x89c665,0xfbffffff
  4c5ab6:	ff ff fb 
  4c5ab9:	e8 f2 cb fe ff       	call   0x4b26b0
  4c5abe:	c6 05 f0 c6 89 00 00 	mov    BYTE PTR ds:0x89c6f0,0x0
  4c5ac5:	6a 02                	push   0x2
  4c5ac7:	e8 94 cf f7 ff       	call   0x442a60
  4c5acc:	83 c4 04             	add    esp,0x4
  4c5acf:	a1 0c d1 59 00       	mov    eax,ds:0x59d10c
  4c5ad4:	81 0d 65 c6 89 00 00 	or     DWORD PTR ds:0x89c665,0x80000
  4c5adb:	00 08 00 
  4c5ade:	6a 02                	push   0x2
  4c5ae0:	50                   	push   eax
  4c5ae1:	e8 fa db fe ff       	call   0x4b36e0
  4c5ae6:	83 c4 08             	add    esp,0x8
  4c5ae9:	c3                   	ret
  4c5aea:	cc                   	int3
  4c5aeb:	cc                   	int3
  4c5aec:	cc                   	int3
  4c5aed:	cc                   	int3
  4c5aee:	cc                   	int3
  4c5aef:	cc                   	int3
