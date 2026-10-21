
/workspace/scratch/69fd8163d94e/populous-original-inputs-20261020/game/d3dpoptb.exe:     file format pei-i386


Disassembly of section .text:

004aa8b0 <.text+0xa98b0>:
  4aa8b0:	83 ec 0c             	sub    esp,0xc
  4aa8b3:	80 3d 9b 5e 89 00 00 	cmp    BYTE PTR ds:0x895e9b,0x0
  4aa8ba:	53                   	push   ebx
  4aa8bb:	0f 84 15 02 00 00    	je     0x4aaad6
  4aa8c1:	0f be 05 f0 c6 89 00 	movsx  eax,BYTE PTR ds:0x89c6f0
  4aa8c8:	8b c8                	mov    ecx,eax
  4aa8ca:	8d 14 80             	lea    edx,[eax+eax*4]
  4aa8cd:	8d 04 51             	lea    eax,[ecx+edx*2]
  4aa8d0:	8d 1c c0             	lea    ebx,[eax+eax*8]
  4aa8d3:	8d 14 d9             	lea    edx,[ecx+ebx*8]
  4aa8d6:	b3 00                	mov    bl,0x0
  4aa8d8:	8a 8c 91 88 da 89 00 	mov    cl,BYTE PTR [ecx+edx*4+0x89da88]
  4aa8df:	80 f9 07             	cmp    cl,0x7
  4aa8e2:	7d 04                	jge    0x4aa8e8
  4aa8e4:	8a 5c 24 14          	mov    bl,BYTE PTR [esp+0x14]
  4aa8e8:	33 c0                	xor    eax,eax
  4aa8ea:	a0 9d 5e 89 00       	mov    al,ds:0x895e9d
  4aa8ef:	66 0f b6 80 a0 5e 89 	movzx  ax,BYTE PTR [eax+0x895ea0]
  4aa8f6:	00 
  4aa8f7:	66 89 44 24 08       	mov    WORD PTR [esp+0x8],ax
  4aa8fc:	8b 44 24 08          	mov    eax,DWORD PTR [esp+0x8]
  4aa900:	25 ff ff 00 00       	and    eax,0xffff
  4aa905:	83 f8 01             	cmp    eax,0x1
  4aa908:	0f 84 ac 01 00 00    	je     0x4aaaba
  4aa90e:	83 f8 02             	cmp    eax,0x2
  4aa911:	0f 84 ab 01 00 00    	je     0x4aaac2
  4aa917:	0f be c1             	movsx  eax,cl
  4aa91a:	8b 0d 7e 5e 89 00    	mov    ecx,DWORD PTR ds:0x895e7e
  4aa920:	80 fb 01             	cmp    bl,0x1
  4aa923:	1b d2                	sbb    edx,edx
  4aa925:	66 89 4c 24 0a       	mov    WORD PTR [esp+0xa],cx
  4aa92a:	83 e2 20             	and    edx,0x20
  4aa92d:	83 c2 37             	add    edx,0x37
  4aa930:	03 d0                	add    edx,eax
  4aa932:	80 7c 24 18 00       	cmp    BYTE PTR [esp+0x18],0x0
  4aa937:	74 07                	je     0x4aa940
  4aa939:	80 0d bc ca 87 00 02 	or     BYTE PTR ds:0x87cabc,0x2
  4aa940:	80 7c 24 1c 00       	cmp    BYTE PTR [esp+0x1c],0x0
  4aa945:	74 07                	je     0x4aa94e
  4aa947:	80 0d bc ca 87 00 04 	or     BYTE PTR ds:0x87cabc,0x4
  4aa94e:	a1 ba ca 87 00       	mov    eax,ds:0x87caba
  4aa953:	8b 4c 24 08          	mov    ecx,DWORD PTR [esp+0x8]
  4aa957:	50                   	push   eax
  4aa958:	51                   	push   ecx
  4aa959:	52                   	push   edx
  4aa95a:	8a 15 f0 c6 89 00    	mov    dl,BYTE PTR ds:0x89c6f0
  4aa960:	52                   	push   edx
  4aa961:	e8 8a f3 fc ff       	call   0x479cf0
  4aa966:	80 25 bc ca 87 00 fd 	and    BYTE PTR ds:0x87cabc,0xfd
  4aa96d:	66 8b 15 ba ca 87 00 	mov    dx,WORD PTR ds:0x87caba
  4aa974:	83 c4 10             	add    esp,0x10
  4aa977:	80 25 bc ca 87 00 fb 	and    BYTE PTR ds:0x87cabc,0xfb
  4aa97e:	66 89 15 26 bc 89 00 	mov    WORD PTR ds:0x89bc26,dx
  4aa985:	8b 0d 84 d1 89 00    	mov    ecx,DWORD PTR ds:0x89d184
  4aa98b:	89 0d 22 bc 89 00    	mov    DWORD PTR ds:0x89bc22,ecx
  4aa991:	84 db                	test   bl,bl
  4aa993:	74 14                	je     0x4aa9a9
  4aa995:	e8 36 dd f8 ff       	call   0x4386d0
  4aa99a:	e8 51 af f8 ff       	call   0x4358f0
  4aa99f:	6a 01                	push   0x1
  4aa9a1:	e8 6a c6 f8 ff       	call   0x437010
  4aa9a6:	83 c4 04             	add    esp,0x4
  4aa9a9:	66 83 3d c2 ca 87 00 	cmp    WORD PTR ds:0x87cac2,0x0
  4aa9b0:	00 
  4aa9b1:	74 39                	je     0x4aa9ec
  4aa9b3:	66 a1 c2 ca 87 00    	mov    ax,ds:0x87cac2
  4aa9b9:	32 c9                	xor    cl,cl
  4aa9bb:	66 85 c0             	test   ax,ax
  4aa9be:	74 08                	je     0x4aa9c8
  4aa9c0:	66 a3 20 bc 89 00    	mov    ds:0x89bc20,ax
  4aa9c6:	b1 01                	mov    cl,0x1
  4aa9c8:	84 c9                	test   cl,cl
  4aa9ca:	0f 84 06 01 00 00    	je     0x4aaad6
  4aa9d0:	66 c7 05 1e bc 89 00 	mov    WORD PTR ds:0x89bc1e,0x5
  4aa9d7:	05 00 
  4aa9d9:	6a 01                	push   0x1
  4aa9db:	6a 6a                	push   0x6a
  4aa9dd:	6a 00                	push   0x0
  4aa9df:	e8 6c f6 fd ff       	call   0x48a050
  4aa9e4:	83 c4 0c             	add    esp,0xc
  4aa9e7:	e9 ea 00 00 00       	jmp    0x4aaad6
  4aa9ec:	66 83 3d ce ca 87 00 	cmp    WORD PTR ds:0x87cace,0x0
  4aa9f3:	00 
  4aa9f4:	74 39                	je     0x4aaa2f
  4aa9f6:	66 a1 ce ca 87 00    	mov    ax,ds:0x87cace
  4aa9fc:	32 c9                	xor    cl,cl
  4aa9fe:	66 85 c0             	test   ax,ax
  4aaa01:	74 08                	je     0x4aaa0b
  4aaa03:	66 a3 20 bc 89 00    	mov    ds:0x89bc20,ax
  4aaa09:	b1 01                	mov    cl,0x1
  4aaa0b:	84 c9                	test   cl,cl
  4aaa0d:	0f 84 c3 00 00 00    	je     0x4aaad6
  4aaa13:	66 c7 05 1e bc 89 00 	mov    WORD PTR ds:0x89bc1e,0x5
  4aaa1a:	05 00 
  4aaa1c:	6a 01                	push   0x1
  4aaa1e:	6a 6a                	push   0x6a
  4aaa20:	6a 00                	push   0x0
  4aaa22:	e8 29 f6 fd ff       	call   0x48a050
  4aaa27:	83 c4 0c             	add    esp,0xc
  4aaa2a:	e9 a7 00 00 00       	jmp    0x4aaad6
  4aaa2f:	66 c7 05 20 bc 89 00 	mov    WORD PTR ds:0x89bc20,0x0
  4aaa36:	00 00 
  4aaa38:	66 a1 ba ca 87 00    	mov    ax,ds:0x87caba
  4aaa3e:	66 89 44 24 06       	mov    WORD PTR [esp+0x6],ax
  4aaa43:	b8 fe 00 00 00       	mov    eax,0xfe
  4aaa48:	20 44 24 06          	and    BYTE PTR [esp+0x6],al
  4aaa4c:	20 44 24 07          	and    BYTE PTR [esp+0x7],al
  4aaa50:	66 0f b6 44 24 06    	movzx  ax,BYTE PTR [esp+0x6]
  4aaa56:	66 40                	inc    ax
  4aaa58:	66 c1 e0 08          	shl    ax,0x8
  4aaa5c:	8d 4c 24 08          	lea    ecx,[esp+0x8]
  4aaa60:	66 89 44 24 08       	mov    WORD PTR [esp+0x8],ax
  4aaa65:	51                   	push   ecx
  4aaa66:	66 0f b6 44 24 0b    	movzx  ax,BYTE PTR [esp+0xb]
  4aaa6c:	66 40                	inc    ax
  4aaa6e:	8a 15 f0 c6 89 00    	mov    dl,BYTE PTR ds:0x89c6f0
  4aaa74:	66 c1 e0 08          	shl    ax,0x8
  4aaa78:	52                   	push   edx
  4aaa79:	66 89 44 24 12       	mov    WORD PTR [esp+0x12],ax
  4aaa7e:	6a 3d                	push   0x3d
  4aaa80:	66 c7 44 24 18 00 00 	mov    WORD PTR [esp+0x18],0x0
  4aaa87:	6a 07                	push   0x7
  4aaa89:	e8 42 31 04 00       	call   0x4edbd0
  4aaa8e:	83 c4 10             	add    esp,0x10
  4aaa91:	85 c0                	test   eax,eax
  4aaa93:	74 0c                	je     0x4aaaa1
  4aaa95:	66 81 68 41 a0 00    	sub    WORD PTR [eax+0x41],0xa0
  4aaa9b:	66 c7 40 6c 04 00    	mov    WORD PTR [eax+0x6c],0x4
  4aaaa1:	66 c7 05 1e bc 89 00 	mov    WORD PTR ds:0x89bc1e,0x5
  4aaaa8:	05 00 
  4aaaaa:	6a 01                	push   0x1
  4aaaac:	6a 6a                	push   0x6a
  4aaaae:	6a 00                	push   0x0
  4aaab0:	e8 9b f5 fd ff       	call   0x48a050
  4aaab5:	83 c4 0c             	add    esp,0xc
  4aaab8:	eb 1c                	jmp    0x4aaad6
  4aaaba:	6a 00                	push   0x0
  4aaabc:	6a 00                	push   0x0
  4aaabe:	6a 27                	push   0x27
  4aaac0:	eb 06                	jmp    0x4aaac8
  4aaac2:	6a 00                	push   0x0
  4aaac4:	6a 00                	push   0x0
  4aaac6:	6a 1e                	push   0x1e
  4aaac8:	a0 f0 c6 89 00       	mov    al,ds:0x89c6f0
  4aaacd:	50                   	push   eax
  4aaace:	e8 1d f2 fc ff       	call   0x479cf0
  4aaad3:	83 c4 10             	add    esp,0x10
  4aaad6:	0f                   	.byte 0xf
