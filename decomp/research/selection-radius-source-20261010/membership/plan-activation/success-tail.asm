  4b8a47:	e8 54 4e 03 00       	call   0x4ed8a0
  4b8a4c:	83 c4 10             	add    esp,0x10
  4b8a4f:	8b e8                	mov    ebp,eax
  4b8a51:	85 ed                	test   ebp,ebp
  4b8a53:	74 4f                	je     0x4b8aa4
  4b8a55:	66 8b 45 24          	mov    ax,WORD PTR [ebp+0x24]
  4b8a59:	66 89 86 92 00 00 00 	mov    WORD PTR [esi+0x92],ax
  4b8a60:	f6 46 0e 10          	test   BYTE PTR [esi+0xe],0x10
  4b8a64:	75 16                	jne    0x4b8a7c
  4b8a66:	56                   	push   esi
  4b8a67:	e8 84 4c 03 00       	call   0x4ed6f0
  4b8a6c:	83 c4 04             	add    esp,0x4
  4b8a6f:	c6 46 2c 02          	mov    BYTE PTR [esi+0x2c],0x2
  4b8a73:	56                   	push   esi
  4b8a74:	e8 c7 4b 03 00       	call   0x4ed640
  4b8a79:	83 c4 04             	add    esp,0x4
  4b8a7c:	80 3d 3a 24 89 00 00 	cmp    BYTE PTR ds:0x89243a,0x0
  4b8a83:	74 0e                	je     0x4b8a93
  4b8a85:	81 4d 0c 00 04 00 00 	or     DWORD PTR [ebp+0xc],0x400
  4b8a8c:	c6 05 3a 24 89 00 00 	mov    BYTE PTR ds:0x89243a,0x0
  4b8a93:	55                   	push   ebp
  4b8a94:	e8 e7 4a 03 00       	call   0x4ed580
  4b8a99:	66 8b 46 41          	mov    ax,WORD PTR [esi+0x41]
  4b8a9d:	83 c4 04             	add    esp,0x4
  4b8aa0:	66 89 45 41          	mov    WORD PTR [ebp+0x41],ax
  4b8aa4:	85 db                	test   ebx,ebx
  4b8aa6:	7e 3c                	jle    0x4b8ae4
  4b8aa8:	8d 4c 24 58          	lea    ecx,[esp+0x58]
  4b8aac:	8b c3                	mov    eax,ebx
  4b8aae:	8b 11                	mov    edx,DWORD PTR [ecx]
  4b8ab0:	83 c1 04             	add    ecx,0x4
  4b8ab3:	c6 42 2d 02          	mov    BYTE PTR [edx+0x2d],0x2
  4b8ab7:	81 4a 0c 00 00 00 40 	or     DWORD PTR [edx+0xc],0x40000000
  4b8abe:	c6 82 a8 00 00 00 15 	mov    BYTE PTR [edx+0xa8],0x15
  4b8ac5:	80 4a 76 10          	or     BYTE PTR [edx+0x76],0x10
  4b8ac9:	48                   	dec    eax
  4b8aca:	75 e2                	jne    0x4b8aae
  4b8acc:	eb 16                	jmp    0x4b8ae4
  4b8ace:	39 5c 24 38          	cmp    DWORD PTR [esp+0x38],ebx
  4b8ad2:	7d 10                	jge    0x4b8ae4
  4b8ad4:	c6 44 24 12 01       	mov    BYTE PTR [esp+0x12],0x1
  4b8ad9:	c7 84 24 f8 00 00 00 	mov    DWORD PTR [esp+0xf8],0x2
  4b8ae0:	02 00 00 00 
  4b8ae4:	80 7c 24 12 00       	cmp    BYTE PTR [esp+0x12],0x0
