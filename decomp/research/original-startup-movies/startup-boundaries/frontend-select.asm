
INPUT/d3dpoptb.exe:     file format pei-i386


Disassembly of section .text:

00458a39 <.text+0x57a39>:
  458a39:	80 3d aa 56 89 00 00 	cmp    BYTE PTR ds:0x8956aa,0x0
  458a40:	74 3f                	je     0x458a81
  458a42:	6a 00                	push   0x0
  458a44:	e8 f7 0e 00 00       	call   0x459940
  458a49:	83 c4 04             	add    esp,0x4
  458a4c:	6a 08                	push   0x8
  458a4e:	e8 6d 19 00 00       	call   0x45a3c0
  458a53:	c7 05 bb 56 89 00 00 	mov    DWORD PTR ds:0x8956bb,0x0
  458a5a:	00 00 00 
  458a5d:	83 c4 04             	add    esp,0x4
  458a60:	80 3d 9d 56 89 00 00 	cmp    BYTE PTR ds:0x89569d,0x0
  458a67:	74 0c                	je     0x458a75
  458a69:	a1 f5 4c 89 00       	mov    eax,ds:0x894cf5
  458a6e:	c6 80 bb 56 89 00 01 	mov    BYTE PTR [eax+0x8956bb],0x1
  458a75:	c7 05 b7 56 89 00 01 	mov    DWORD PTR ds:0x8956b7,0x1010101
  458a7c:	01 01 01 
  458a7f:	eb 4c                	jmp    0x458acd
  458a81:	83 3d 04 d1 59 00 00 	cmp    DWORD PTR ds:0x59d104,0x0
  458a88:	75 16                	jne    0x458aa0
  458a8a:	c7 05 ec 9c 74 00 00 	mov    DWORD PTR ds:0x749cec,0x0
  458a91:	00 00 00 
  458a94:	6a 14                	push   0x14
  458a96:	e8 25 19 00 00       	call   0x45a3c0
  458a9b:	83 c4 04             	add    esp,0x4
  458a9e:	eb 2d                	jmp    0x458acd
  458aa0:	83 3d 0c d1 59 00 00 	cmp    DWORD PTR ds:0x59d10c,0x0
  458aa7:	7e 1f                	jle    0x458ac8
  458aa9:	83 3d 10 d1 59 00 00 	cmp    DWORD PTR ds:0x59d110,0x0
  458ab0:	74 0c                	je     0x458abe
  458ab2:	6a 00                	push   0x0
  458ab4:	e8 c7 cf 06 00       	call   0x4c5a80
  458ab9:	83 c4 04             	add    esp,0x4
  458abc:	eb 0f                	jmp    0x458acd
  458abe:	c7 05 0c d1 59 00 ff 	mov    DWORD PTR ds:0x59d10c,0xffffffff
  458ac5:	ff ff ff 
  458ac8:	e8 03 d2 06 00       	call   0x4c5cd0
  458acd:	ff 15 84 c7 d0 00    	call   DWORD PTR ds:0xd0c784
  458ad3:	6a 0e                	push   0xe
  458ad5:	a3 00 9e 74 00       	mov    ds:0x749e00,eax
  458ada:	e8 31 df 0c 00       	call   0x526a10
  458adf:	83 c4 04             	add    esp,0x4
  458ae2:	85 c0                	test   eax,eax
  458ae4:	74 0c                	je     0x458af2
  458ae6:	c7 05 18 d1 59 00 01 	mov    DWORD PTR ds:0x59d118,0x1
  458aed:	00 00 00 
  458af0:	5e                   	pop    esi
  458af1:	c3                   	ret
  458af2:	c7 05 18 d1 59 00 00 	mov    DWORD PTR ds:0x59d118,0x0
  458af9:	00 00 00 
  458afc:	5e                   	pop    esi
  458afd:	c3                   	ret
