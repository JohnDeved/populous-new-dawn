
/workspace/scratch/69fd8163d94e/populous-original-inputs-20261020/game/d3dpoptb.exe:     file format pei-i386


Disassembly of section .text:

0044d7f0 <.text+0x4c7f0>:
  44d7f0:	83 ec 04             	sub    esp,0x4
  44d7f3:	33 c0                	xor    eax,eax
  44d7f5:	66 a3 a5 c6 68 00    	mov    ds:0x68c6a5,ax
  44d7fb:	a3 af c6 68 00       	mov    ds:0x68c6af,eax
  44d800:	66 a3 a1 b6 68 00    	mov    ds:0x68b6a1,ax
  44d806:	53                   	push   ebx
  44d807:	66 a3 bb c6 68 00    	mov    ds:0x68c6bb,ax
  44d80d:	56                   	push   esi
  44d80e:	66 8b 54 24 14       	mov    dx,WORD PTR [esp+0x14]
  44d813:	a2 c0 c6 68 00       	mov    ds:0x68c6c0,al
  44d818:	66 a3 bd c6 68 00    	mov    ds:0x68c6bd,ax
  44d81e:	33 c9                	xor    ecx,ecx
  44d820:	66 8b ca             	mov    cx,dx
  44d823:	a3 a1 c6 68 00       	mov    ds:0x68c6a1,eax
  44d828:	81 e1 00 fe 00 00    	and    ecx,0xfe00
  44d82e:	a2 bf c6 68 00       	mov    ds:0x68c6bf,al
  44d833:	66 8b c2             	mov    ax,dx
  44d836:	8a 54 24 10          	mov    dl,BYTE PTR [esp+0x10]
  44d83a:	25 fe 00 00 00       	and    eax,0xfe
  44d83f:	03 c0                	add    eax,eax
  44d841:	0b c1                	or     eax,ecx
  44d843:	33 c9                	xor    ecx,ecx
  44d845:	8a ca                	mov    cl,dl
  44d847:	8d 04 85 e4 03 8a 00 	lea    eax,[eax*4+0x8a03e4]
  44d84e:	8d 71 ff             	lea    esi,[ecx-0x1]
  44d851:	83 fe 09             	cmp    esi,0x9
  44d854:	0f 87 bd 02 00 00    	ja     0x44db17
  44d85a:	ff 24 b5 20 db 44 00 	jmp    DWORD PTR [esi*4+0x44db20]
  44d861:	0f bf 40 06          	movsx  eax,WORD PTR [eax+0x6]
  44d865:	8b 0c 85 90 03 89 00 	mov    ecx,DWORD PTR [eax*4+0x890390]
  44d86c:	85 c9                	test   ecx,ecx
  44d86e:	0f 84 a3 02 00 00    	je     0x44db17
  44d874:	ba 05 00 00 00       	mov    edx,0x5
  44d879:	bb 09 00 00 00       	mov    ebx,0x9
  44d87e:	38 51 2a             	cmp    BYTE PTR [ecx+0x2a],dl
  44d881:	75 05                	jne    0x44d888
  44d883:	38 59 2b             	cmp    BYTE PTR [ecx+0x2b],bl
  44d886:	74 11                	je     0x44d899
  44d888:	33 c0                	xor    eax,eax
  44d88a:	66 8b 41 20          	mov    ax,WORD PTR [ecx+0x20]
  44d88e:	8b 0c 85 90 03 89 00 	mov    ecx,DWORD PTR [eax*4+0x890390]
  44d895:	85 c9                	test   ecx,ecx
  44d897:	75 e5                	jne    0x44d87e
  44d899:	85 c9                	test   ecx,ecx
  44d89b:	0f 84 76 02 00 00    	je     0x44db17
  44d8a1:	66 8b 41 24          	mov    ax,WORD PTR [ecx+0x24]
  44d8a5:	8d 5c 24 0a          	lea    ebx,[esp+0xa]
  44d8a9:	66 8b 54 24 18       	mov    dx,WORD PTR [esp+0x18]
  44d8ae:	53                   	push   ebx
  44d8af:	66 a3 bb c6 68 00    	mov    ds:0x68c6bb,ax
  44d8b5:	51                   	push   ecx
  44d8b6:	c6 05 c0 c6 68 00 06 	mov    BYTE PTR ds:0x68c6c0,0x6
  44d8bd:	66 89 15 bd c6 68 00 	mov    WORD PTR ds:0x68c6bd,dx
  44d8c4:	e8 c7 36 0a 00       	call   0x4f0f90
  44d8c9:	83 c4 08             	add    esp,0x8
  44d8cc:	85 c0                	test   eax,eax
  44d8ce:	0f 84 43 02 00 00    	je     0x44db17
  44d8d4:	8b 04 85 a8 2b 97 00 	mov    eax,DWORD PTR [eax*4+0x972ba8]
  44d8db:	50                   	push   eax
  44d8dc:	68 70 99 59 00       	push   0x599970
  44d8e1:	68 a1 b6 68 00       	push   0x68b6a1
  44d8e6:	e8 d5 dc 10 00       	call   0x55b5c0
  44d8eb:	83 c4 0c             	add    esp,0xc
  44d8ee:	32 c0                	xor    al,al
  44d8f0:	5e                   	pop    esi
  44d8f1:	5b                   	pop    ebx
  44d8f2:	83 c4 04             	add    esp,0x4
  44d8f5:	c3                   	ret
  44d8f6:	f6 40 01 02          	test   BYTE PTR [eax+0x1],0x2
  44d8fa:	0f 84 17 02 00 00    	je     0x44db17
  44d900:	66 8b 40 08          	mov    ax,WORD PTR [eax+0x8]
  44d904:	66 25 ff 03          	and    ax,0x3ff
  44d908:	0f b7 c8             	movzx  ecx,ax
  44d90b:	8b 34 8d 90 03 89 00 	mov    esi,DWORD PTR [ecx*4+0x890390]
  44d912:	85 f6                	test   esi,esi
  44d914:	0f 84 fd 01 00 00    	je     0x44db17
  44d91a:	66 a3 bb c6 68 00    	mov    ds:0x68c6bb,ax
  44d920:	8d 4c 24 0a          	lea    ecx,[esp+0xa]
  44d924:	66 8b 44 24 18       	mov    ax,WORD PTR [esp+0x18]
  44d929:	51                   	push   ecx
  44d92a:	66 a3 bd c6 68 00    	mov    ds:0x68c6bd,ax
  44d930:	56                   	push   esi
  44d931:	c6 05 c0 c6 68 00 06 	mov    BYTE PTR ds:0x68c6c0,0x6
  44d938:	e8 53 36 0a 00       	call   0x4f0f90
  44d93d:	83 c4 08             	add    esp,0x8
  44d940:	85 c0                	test   eax,eax
  44d942:	0f 84 cf 01 00 00    	je     0x44db17
  44d948:	80 7c 24 0a 01       	cmp    BYTE PTR [esp+0xa],0x1
  44d94d:	75 38                	jne    0x44d987
  44d94f:	8a 4e 2f             	mov    cl,BYTE PTR [esi+0x2f]
  44d952:	80 f9 ff             	cmp    cl,0xff
  44d955:	74 30                	je     0x44d987
  44d957:	0f be c9             	movsx  ecx,cl
  44d95a:	8b d1                	mov    edx,ecx
  44d95c:	8b 04 85 a8 2b 97 00 	mov    eax,DWORD PTR [eax*4+0x972ba8]
  44d963:	c1 e1 05             	shl    ecx,0x5
  44d966:	03 ca                	add    ecx,edx
  44d968:	03 ca                	add    ecx,edx
  44d96a:	81 c1 5c 03 8a 00    	add    ecx,0x8a035c
  44d970:	51                   	push   ecx
  44d971:	50                   	push   eax
  44d972:	68 a1 b6 68 00       	push   0x68b6a1
  44d977:	e8 24 60 00 00       	call   0x4539a0
  44d97c:	83 c4 0c             	add    esp,0xc
  44d97f:	32 c0                	xor    al,al
  44d981:	5e                   	pop    esi
  44d982:	5b                   	pop    ebx
  44d983:	83 c4 04             	add    esp,0x4
  44d986:	c3                   	ret
  44d987:	8b 04 85 a8 2b 97 00 	mov    eax,DWORD PTR [eax*4+0x972ba8]
  44d98e:	50                   	push   eax
  44d98f:	68 70 99 59 00       	push   0x599970
  44d994:	68 a1 b6 68 00       	push   0x68b6a1
  44d999:	e8 22 dc 10 00       	call   0x55b5c0
  44d99e:	83 c4 0c             	add    esp,0xc
  44d9a1:	32 c0                	xor    al,al
  44d9a3:	5e                   	pop    esi
  44d9a4:	5b                   	pop    ebx
  44d9a5:	83 c4 04             	add    esp,0x4
  44d9a8:	c3                   	ret
  44d9a9:	0f be 05 f0 c6 89 00 	movsx  eax,BYTE PTR ds:0x89c6f0
  44d9b0:	8b d0                	mov    edx,eax
  44d9b2:	8d 1c 80             	lea    ebx,[eax+eax*4]
  44d9b5:	8d 04 5a             	lea    eax,[edx+ebx*2]
  44d9b8:	8d 34 c0             	lea    esi,[eax+eax*8]
  44d9bb:	8d 1c f2             	lea    ebx,[edx+esi*8]
  44d9be:	8b 84 9a 65 da 89 00 	mov    eax,DWORD PTR [edx+ebx*4+0x89da65]
  44d9c5:	85 c0                	test   eax,eax
  44d9c7:	0f 84 4a 01 00 00    	je     0x44db17
  44d9cd:	83 e9 03             	sub    ecx,0x3
  44d9d0:	83 f9 05             	cmp    ecx,0x5
  44d9d3:	77 07                	ja     0x44d9dc
  44d9d5:	ff 24 8d 48 db 44 00 	jmp    DWORD PTR [ecx*4+0x44db48]
  44d9dc:	33 c9                	xor    ecx,ecx
  44d9de:	eb 21                	jmp    0x44da01
  44d9e0:	b9 56 02 00 00       	mov    ecx,0x256
  44d9e5:	eb 1a                	jmp    0x44da01
  44d9e7:	b9 58 02 00 00       	mov    ecx,0x258
  44d9ec:	eb 13                	jmp    0x44da01
  44d9ee:	b9 58 02 00 00       	mov    ecx,0x258
  44d9f3:	eb 0c                	jmp    0x44da01
  44d9f5:	b9 58 02 00 00       	mov    ecx,0x258
  44d9fa:	eb 05                	jmp    0x44da01
  44d9fc:	b9 59 02 00 00       	mov    ecx,0x259
  44da01:	85 c9                	test   ecx,ecx
  44da03:	0f 84 0e 01 00 00    	je     0x44db17
  44da09:	66 8b 40 24          	mov    ax,WORD PTR [eax+0x24]
  44da0d:	8b 0c 8d a8 2b 97 00 	mov    ecx,DWORD PTR [ecx*4+0x972ba8]
  44da14:	66 8b 54 24 18       	mov    dx,WORD PTR [esp+0x18]
  44da19:	51                   	push   ecx
  44da1a:	66 a3 bb c6 68 00    	mov    ds:0x68c6bb,ax
  44da20:	68 70 99 59 00       	push   0x599970
  44da25:	66 89 15 bd c6 68 00 	mov    WORD PTR ds:0x68c6bd,dx
  44da2c:	68 a1 b6 68 00       	push   0x68b6a1
  44da31:	c6 05 bf c6 68 00 01 	mov    BYTE PTR ds:0x68c6bf,0x1
  44da38:	c6 05 c0 c6 68 00 04 	mov    BYTE PTR ds:0x68c6c0,0x4
  44da3f:	e8 7c db 10 00       	call   0x55b5c0
  44da44:	83 c4 0c             	add    esp,0xc
  44da47:	32 c0                	xor    al,al
  44da49:	5e                   	pop    esi
  44da4a:	5b                   	pop    ebx
  44da4b:	83 c4 04             	add    esp,0x4
  44da4e:	c3                   	ret
  44da4f:	c6 05 c0 c6 68 00 08 	mov    BYTE PTR ds:0x68c6c0,0x8
  44da56:	66 8b 44 24 18       	mov    ax,WORD PTR [esp+0x18]
  44da5b:	66 a3 bd c6 68 00    	mov    ds:0x68c6bd,ax
  44da61:	66 a1 e2 ca 87 00    	mov    ax,ds:0x87cae2
  44da67:	66 c1 e8 08          	shr    ax,0x8
  44da6b:	24 fe                	and    al,0xfe
  44da6d:	88 44 24 0a          	mov    BYTE PTR [esp+0xa],al
  44da71:	c6 05 bf c6 68 00 01 	mov    BYTE PTR ds:0x68c6bf,0x1
  44da78:	66 a1 e4 ca 87 00    	mov    ax,ds:0x87cae4
  44da7e:	80 ea 04             	sub    dl,0x4
  44da81:	66 c1 e8 08          	shr    ax,0x8
  44da85:	24 fe                	and    al,0xfe
  44da87:	80 fa 01             	cmp    dl,0x1
  44da8a:	88 44 24 0b          	mov    BYTE PTR [esp+0xb],al
  44da8e:	1b c0                	sbb    eax,eax
  44da90:	66 8b 4c 24 0a       	mov    cx,WORD PTR [esp+0xa]
  44da95:	83 e0 f4             	and    eax,0xfffffff4
  44da98:	66 89 0d bb c6 68 00 	mov    WORD PTR ds:0x68c6bb,cx
  44da9f:	05 61 02 00 00       	add    eax,0x261
  44daa4:	8b 04 85 a8 2b 97 00 	mov    eax,DWORD PTR [eax*4+0x972ba8]
  44daab:	50                   	push   eax
  44daac:	68 70 99 59 00       	push   0x599970
  44dab1:	68 a1 b6 68 00       	push   0x68b6a1
  44dab6:	e8 05 db 10 00       	call   0x55b5c0
  44dabb:	83 c4 0c             	add    esp,0xc
  44dabe:	32 c0                	xor    al,al
  44dac0:	5e                   	pop    esi
  44dac1:	5b                   	pop    ebx
  44dac2:	83 c4 04             	add    esp,0x4
  44dac5:	c3                   	ret
  44dac6:	66 8b 44 24 18       	mov    ax,WORD PTR [esp+0x18]
  44dacb:	8b 15 14 35 97 00    	mov    edx,DWORD PTR ds:0x973514
  44dad1:	66 8b 0d 26 bc 89 00 	mov    cx,WORD PTR ds:0x89bc26
  44dad8:	52                   	push   edx
  44dad9:	66 a3 bd c6 68 00    	mov    ds:0x68c6bd,ax
  44dadf:	68 70 99 59 00       	push   0x599970
  44dae4:	66 89 0d bb c6 68 00 	mov    WORD PTR ds:0x68c6bb,cx
  44daeb:	68 a1 b6 68 00       	push   0x68b6a1
  44daf0:	c6 05 c0 c6 68 00 08 	mov    BYTE PTR ds:0x68c6c0,0x8
  44daf7:	c6 05 bf c6 68 00 01 	mov    BYTE PTR ds:0x68c6bf,0x1
  44dafe:	e8 bd da 10 00       	call   0x55b5c0
  44db03:	83 c4 0c             	add    esp,0xc
  44db06:	6a 01                	push   0x1
  44db08:	68 e1 00 00 00       	push   0xe1
  44db0d:	6a 00                	push   0x0
  44db0f:	e8 3c c5 03 00       	call   0x48a050
  44db14:	83 c4 0c             	add    esp,0xc
  44db17:	32 c0                	xor    al,al
  44db19:	5e                   	pop    esi
  44db1a:	5b                   	pop    ebx
  44db1b:	83 c4 04             	add    esp,0x4
  44db1e:	c3                   	ret
  44db1f:	90                   	nop
