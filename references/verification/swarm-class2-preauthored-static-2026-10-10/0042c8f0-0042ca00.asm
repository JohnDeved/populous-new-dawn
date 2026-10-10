
/workspace/scratch/69fd8163d94e/training-static-recovery-20261009/game/d3dpoptb.exe:     file format pei-i386


Disassembly of section .text:

0042c8f0 <.text+0x2b8f0>:
  42c8f0:	53                   	push   ebx
  42c8f1:	57                   	push   edi
  42c8f2:	33 db                	xor    ebx,ebx
  42c8f4:	b8 ff ff ff ff       	mov    eax,0xffffffff
  42c8f9:	66 a3 e1 c6 89 00    	mov    ds:0x89c6e1,ax
  42c8ff:	89 1d e8 22 89 00    	mov    DWORD PTR ds:0x8922e8,ebx
  42c905:	89 1d d8 22 89 00    	mov    DWORD PTR ds:0x8922d8,ebx
  42c90b:	88 1d 43 ce 89 00    	mov    BYTE PTR ds:0x89ce43,bl
  42c911:	88 1d 60 d1 89 00    	mov    BYTE PTR ds:0x89d160,bl
  42c917:	88 1d 67 bb 89 00    	mov    BYTE PTR ds:0x89bb67,bl
  42c91d:	88 1d 60 ce 89 00    	mov    BYTE PTR ds:0x89ce60,bl
  42c923:	89 1d e4 22 89 00    	mov    DWORD PTR ds:0x8922e4,ebx
  42c929:	a2 65 d1 89 00       	mov    ds:0x89d165,al
  42c92e:	88 1d 66 d1 89 00    	mov    BYTE PTR ds:0x89d166,bl
  42c934:	81 25 69 c6 89 00 ff 	and    DWORD PTR ds:0x89c669,0xfeffffff
  42c93b:	ff ff fe 
  42c93e:	e8 2d 45 05 00       	call   0x480e70
  42c943:	e8 f8 d2 07 00       	call   0x4a9c40
  42c948:	e8 93 44 0c 00       	call   0x4f0de0
  42c94d:	c7 05 74 aa 96 00 ba 	mov    DWORD PTR ds:0x96aa74,0x96aaba
  42c954:	aa 96 00 
  42c957:	81 25 69 c6 89 00 ff 	and    DWORD PTR ds:0x89c669,0xbfffffff
  42c95e:	ff ff bf 
  42c961:	e8 3a 66 ff ff       	call   0x422fa0
  42c966:	b8 ff ff ef ff       	mov    eax,0xffefffff
  42c96b:	88 1d 34 ce 89 00    	mov    BYTE PTR ds:0x89ce34,bl
  42c971:	83 25 69 c6 89 00 df 	and    DWORD PTR ds:0x89c669,0xffffffdf
  42c978:	83 25 6d c6 89 00 f7 	and    DWORD PTR ds:0x89c66d,0xfffffff7
  42c97f:	81 25 6d c6 89 00 ff 	and    DWORD PTR ds:0x89c66d,0xfffffdff
  42c986:	fd ff ff 
  42c989:	81 25 a4 5d 89 00 ff 	and    DWORD PTR ds:0x895da4,0xfdffffff
  42c990:	ff ff fd 
  42c993:	bf d3 9e 89 00       	mov    edi,0x899ed3
  42c998:	21 05 61 c6 89 00    	and    DWORD PTR ds:0x89c661,eax
  42c99e:	81 25 a4 5d 89 00 ff 	and    DWORD PTR ds:0x895da4,0xffbfffff
  42c9a5:	ff bf ff 
  42c9a8:	b9 2e 00 00 00       	mov    ecx,0x2e
  42c9ad:	21 05 a4 5d 89 00    	and    DWORD PTR ds:0x895da4,eax
  42c9b3:	89 1d 22 bc 89 00    	mov    DWORD PTR ds:0x89bc22,ebx
  42c9b9:	b8 22 bc 89 00       	mov    eax,0x89bc22
  42c9be:	89 1d 26 bc 89 00    	mov    DWORD PTR ds:0x89bc26,ebx
  42c9c4:	33 c0                	xor    eax,eax
  42c9c6:	f3 ab                	rep stos DWORD PTR es:[edi],eax
  42c9c8:	81 25 39 b7 89 00 ff 	and    DWORD PTR ds:0x89b739,0xff7fffff
  42c9cf:	ff 7f ff 
  42c9d2:	81 25 39 b7 89 00 ff 	and    DWORD PTR ds:0x89b739,0xfbffffff
  42c9d9:	ff ff fb 
  42c9dc:	81 25 a8 5d 89 00 ff 	and    DWORD PTR ds:0x895da8,0xfeffffff
  42c9e3:	ff ff fe 
  42c9e6:	53                   	push   ebx
  42c9e7:	53                   	push   ebx
  42c9e8:	e8 33 93 07 00       	call   0x4a5d20
  42c9ed:	83 c4 08             	add    esp,0x8
  42c9f0:	e8 bb 94 07 00       	call   0x4a5eb0
  42c9f5:	e8 e6 94 07 00       	call   0x4a5ee0
  42c9fa:	5f                   	pop    edi
  42c9fb:	5b                   	pop    ebx
  42c9fc:	c3                   	ret
  42c9fd:	cc                   	int3
  42c9fe:	cc                   	int3
  42c9ff:	cc                   	int3
