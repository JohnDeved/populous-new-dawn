
INPUT/d3dpoptb.exe:     file format pei-i386


Disassembly of section .text:

00459f40 <.text+0x58f40>:
  459f40:	83 ec 04             	sub    esp,0x4
  459f43:	b9 00 00 00 80       	mov    ecx,0x80000000
  459f48:	c7 05 ac 9c 74 00 00 	mov    DWORD PTR ds:0x749cac,0x0
  459f4f:	00 00 00 
  459f52:	53                   	push   ebx
  459f53:	56                   	push   esi
  459f54:	57                   	push   edi
  459f55:	55                   	push   ebp
  459f56:	a1 ac 9c 74 00       	mov    eax,ds:0x749cac
  459f5b:	c1 e0 04             	shl    eax,0x4
  459f5e:	ff 05 ac 9c 74 00    	inc    DWORD PTR ds:0x749cac
  459f64:	39 88 f8 72 5d 00    	cmp    DWORD PTR [eax+0x5d72f8],ecx
  459f6a:	75 ea                	jne    0x459f56
  459f6c:	b8 00 00 00 80       	mov    eax,0x80000000
  459f71:	ff 0d ac 9c 74 00    	dec    DWORD PTR ds:0x749cac
  459f77:	c7 05 b0 9c 74 00 00 	mov    DWORD PTR ds:0x749cb0,0x0
  459f7e:	00 00 00 
  459f81:	8b 0d b0 9c 74 00    	mov    ecx,DWORD PTR ds:0x749cb0
  459f87:	ff 05 b0 9c 74 00    	inc    DWORD PTR ds:0x749cb0
  459f8d:	8d 14 89             	lea    edx,[ecx+ecx*4]
  459f90:	8d 14 d2             	lea    edx,[edx+edx*8]
  459f93:	2b d1                	sub    edx,ecx
  459f95:	39 82 88 73 5d 00    	cmp    DWORD PTR [edx+0x5d7388],eax
  459f9b:	75 e4                	jne    0x459f81
  459f9d:	b8 00 00 00 80       	mov    eax,0x80000000
  459fa2:	ff 0d b0 9c 74 00    	dec    DWORD PTR ds:0x749cb0
  459fa8:	c7 05 b8 9c 74 00 00 	mov    DWORD PTR ds:0x749cb8,0x0
  459faf:	00 00 00 
  459fb2:	8b 0d b8 9c 74 00    	mov    ecx,DWORD PTR ds:0x749cb8
  459fb8:	ff 05 b8 9c 74 00    	inc    DWORD PTR ds:0x749cb8
  459fbe:	8d 14 89             	lea    edx,[ecx+ecx*4]
  459fc1:	8d 14 d2             	lea    edx,[edx+edx*8]
  459fc4:	2b d1                	sub    edx,ecx
  459fc6:	39 82 60 7a 5d 00    	cmp    DWORD PTR [edx+0x5d7a60],eax
  459fcc:	75 e4                	jne    0x459fb2
  459fce:	b9 00 00 00 80       	mov    ecx,0x80000000
  459fd3:	ff 0d b8 9c 74 00    	dec    DWORD PTR ds:0x749cb8
  459fd9:	c7 05 bc 9c 74 00 00 	mov    DWORD PTR ds:0x749cbc,0x0
  459fe0:	00 00 00 
  459fe3:	a1 bc 9c 74 00       	mov    eax,ds:0x749cbc
  459fe8:	ff 05 bc 9c 74 00    	inc    DWORD PTR ds:0x749cbc
  459fee:	8d 14 80             	lea    edx,[eax+eax*4]
  459ff1:	8d 14 d2             	lea    edx,[edx+edx*8]
  459ff4:	2b d0                	sub    edx,eax
  459ff6:	39 8a 70 7c 5d 00    	cmp    DWORD PTR [edx+0x5d7c70],ecx
  459ffc:	75 e5                	jne    0x459fe3
  459ffe:	b9 00 00 00 80       	mov    ecx,0x80000000
  45a003:	ff 0d bc 9c 74 00    	dec    DWORD PTR ds:0x749cbc
  45a009:	c7 05 c0 9c 74 00 00 	mov    DWORD PTR ds:0x749cc0,0x0
  45a010:	00 00 00 
  45a013:	a1 c0 9c 74 00       	mov    eax,ds:0x749cc0
  45a018:	ff 05 c0 9c 74 00    	inc    DWORD PTR ds:0x749cc0
  45a01e:	8d 14 c5 00 00 00 00 	lea    edx,[eax*8+0x0]
  45a025:	2b d0                	sub    edx,eax
  45a027:	39 0c d5 80 8a 5d 00 	cmp    DWORD PTR [edx*8+0x5d8a80],ecx
  45a02e:	75 e3                	jne    0x45a013
  45a030:	b9 00 00 00 80       	mov    ecx,0x80000000
  45a035:	ff 0d c0 9c 74 00    	dec    DWORD PTR ds:0x749cc0
  45a03b:	c7 05 c4 9c 74 00 00 	mov    DWORD PTR ds:0x749cc4,0x0
  45a042:	00 00 00 
  45a045:	a1 c4 9c 74 00       	mov    eax,ds:0x749cc4
  45a04a:	8b d0                	mov    edx,eax
  45a04c:	ff 05 c4 9c 74 00    	inc    DWORD PTR ds:0x749cc4
  45a052:	c1 e2 04             	shl    edx,0x4
  45a055:	03 d0                	add    edx,eax
  45a057:	39 0c 95 60 8b 5d 00 	cmp    DWORD PTR [edx*4+0x5d8b60],ecx
  45a05e:	75 e5                	jne    0x45a045
  45a060:	b9 00 00 00 80       	mov    ecx,0x80000000
  45a065:	ff 0d c4 9c 74 00    	dec    DWORD PTR ds:0x749cc4
  45a06b:	c7 05 c8 9c 74 00 00 	mov    DWORD PTR ds:0x749cc8,0x0
  45a072:	00 00 00 
  45a075:	a1 c8 9c 74 00       	mov    eax,ds:0x749cc8
  45a07a:	c1 e0 02             	shl    eax,0x2
  45a07d:	ff 05 c8 9c 74 00    	inc    DWORD PTR ds:0x749cc8
  45a083:	8d 14 40             	lea    edx,[eax+eax*2]
  45a086:	39 8c 92 48 8e 5d 00 	cmp    DWORD PTR [edx+edx*4+0x5d8e48],ecx
  45a08d:	75 e6                	jne    0x45a075
  45a08f:	b9 00 00 00 80       	mov    ecx,0x80000000
  45a094:	ff 0d c8 9c 74 00    	dec    DWORD PTR ds:0x749cc8
  45a09a:	c7 05 cc 9c 74 00 00 	mov    DWORD PTR ds:0x749ccc,0x0
  45a0a1:	00 00 00 
  45a0a4:	a1 cc 9c 74 00       	mov    eax,ds:0x749ccc
  45a0a9:	ff 05 cc 9c 74 00    	inc    DWORD PTR ds:0x749ccc
  45a0af:	8d 14 40             	lea    edx,[eax+eax*2]
  45a0b2:	8d 1c 90             	lea    ebx,[eax+edx*4]
  45a0b5:	39 8c 98 10 95 5d 00 	cmp    DWORD PTR [eax+ebx*4+0x5d9510],ecx
  45a0bc:	75 e6                	jne    0x45a0a4
  45a0be:	b9 00 00 00 80       	mov    ecx,0x80000000
  45a0c3:	ff 0d cc 9c 74 00    	dec    DWORD PTR ds:0x749ccc
  45a0c9:	c7 05 d0 9c 74 00 00 	mov    DWORD PTR ds:0x749cd0,0x0
  45a0d0:	00 00 00 
  45a0d3:	a1 d0 9c 74 00       	mov    eax,ds:0x749cd0
  45a0d8:	ff 05 d0 9c 74 00    	inc    DWORD PTR ds:0x749cd0
  45a0de:	8d 14 40             	lea    edx,[eax+eax*2]
  45a0e1:	c1 e2 03             	shl    edx,0x3
  45a0e4:	2b d0                	sub    edx,eax
  45a0e6:	39 0c 95 50 83 5d 00 	cmp    DWORD PTR [edx*4+0x5d8350],ecx
  45a0ed:	75 e4                	jne    0x45a0d3
  45a0ef:	b9 00 00 00 80       	mov    ecx,0x80000000
  45a0f4:	ff 0d d0 9c 74 00    	dec    DWORD PTR ds:0x749cd0
  45a0fa:	c7 05 d4 9c 74 00 00 	mov    DWORD PTR ds:0x749cd4,0x0
  45a101:	00 00 00 
  45a104:	a1 d4 9c 74 00       	mov    eax,ds:0x749cd4
  45a109:	ff 05 d4 9c 74 00    	inc    DWORD PTR ds:0x749cd4
  45a10f:	8d 14 40             	lea    edx,[eax+eax*2]
  45a112:	c1 e2 03             	shl    edx,0x3
  45a115:	2b d0                	sub    edx,eax
  45a117:	39 0c 95 b0 88 5d 00 	cmp    DWORD PTR [edx*4+0x5d88b0],ecx
  45a11e:	75 e4                	jne    0x45a104
  45a120:	b9 00 00 00 80       	mov    ecx,0x80000000
  45a125:	ff 0d d4 9c 74 00    	dec    DWORD PTR ds:0x749cd4
  45a12b:	c7 05 a8 9c 74 00 00 	mov    DWORD PTR ds:0x749ca8,0x0
  45a132:	00 00 00 
  45a135:	a1 a8 9c 74 00       	mov    eax,ds:0x749ca8
  45a13a:	c1 e0 05             	shl    eax,0x5
  45a13d:	ff 05 a8 9c 74 00    	inc    DWORD PTR ds:0x749ca8
  45a143:	39 88 98 9c 5d 00    	cmp    DWORD PTR [eax+0x5d9c98],ecx
  45a149:	75 ea                	jne    0x45a135
  45a14b:	ff 0d a8 9c 74 00    	dec    DWORD PTR ds:0x749ca8
  45a151:	83 3d a8 9c 74 00 00 	cmp    DWORD PTR ds:0x749ca8,0x0
  45a158:	7e 2c                	jle    0x45a186
  45a15a:	be 9c 9c 5d 00       	mov    esi,0x5d9c9c
  45a15f:	8b 0d a8 9c 74 00    	mov    ecx,DWORD PTR ds:0x749ca8
  45a165:	c7 06 00 00 00 00    	mov    DWORD PTR [esi],0x0
  45a16b:	8b 16                	mov    edx,DWORD PTR [esi]
  45a16d:	8d 42 01             	lea    eax,[edx+0x1]
  45a170:	89 06                	mov    DWORD PTR [esi],eax
  45a172:	8b 5e 04             	mov    ebx,DWORD PTR [esi+0x4]
  45a175:	81 3c d3 00 00 00 80 	cmp    DWORD PTR [ebx+edx*8],0x80000000
  45a17c:	75 ed                	jne    0x45a16b
  45a17e:	ff 0e                	dec    DWORD PTR [esi]
  45a180:	83 c6 20             	add    esi,0x20
  45a183:	49                   	dec    ecx
  45a184:	75 df                	jne    0x45a165
