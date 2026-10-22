
decomp/research/native-tribe-controls/004d5f7c-004d5fd5.bin:     file format binary


Disassembly of section .data:

004d5f7c <.data>:
  4d5f7c:	8a 47 2f             	mov    al,BYTE PTR [edi+0x2f]
  4d5f7f:	3c ff                	cmp    al,0xff
  4d5f81:	74 24                	je     0x4d5fa7
  4d5f83:	84 db                	test   bl,bl
  4d5f85:	75 20                	jne    0x4d5fa7
  4d5f87:	6a 01                	push   0x1
  4d5f89:	6a 06                	push   0x6
  4d5f8b:	50                   	push   eax
  4d5f8c:	e8 bf 55 f4 ff       	call   0x41b550
  4d5f91:	83 c4 0c             	add    esp,0xc
  4d5f94:	8a 87 b0 00 00 00    	mov    al,BYTE PTR [edi+0xb0]
  4d5f9a:	6a 01                	push   0x1
  4d5f9c:	6a 03                	push   0x3
  4d5f9e:	50                   	push   eax
  4d5f9f:	e8 ac 55 f4 ff       	call   0x41b550
  4d5fa4:	83 c4 0c             	add    esp,0xc
  4d5fa7:	8a 87 b0 00 00 00    	mov    al,BYTE PTR [edi+0xb0]
  4d5fad:	3c ff                	cmp    al,0xff
  4d5faf:	74 0d                	je     0x4d5fbe
  4d5fb1:	0f be c0             	movsx  eax,al
  4d5fb4:	57                   	push   edi
  4d5fb5:	50                   	push   eax
  4d5fb6:	e8 a5 d9 fc ff       	call   0x4a3960
  4d5fbb:	83 c4 08             	add    esp,0x8
  4d5fbe:	57                   	push   edi
  4d5fbf:	e8 8c eb ff ff       	call   0x4d4b50
  4d5fc4:	83 c4 04             	add    esp,0x4
  4d5fc7:	32 c0                	xor    al,al
  4d5fc9:	5f                   	pop    edi
  4d5fca:	5e                   	pop    esi
  4d5fcb:	5b                   	pop    ebx
  4d5fcc:	83 c4 0c             	add    esp,0xc
  4d5fcf:	c3                   	ret
  4d5fd0:	fe c9                	dec    cl
  4d5fd2:	88 4f 2d             	mov    BYTE PTR [edi+0x2d],cl
