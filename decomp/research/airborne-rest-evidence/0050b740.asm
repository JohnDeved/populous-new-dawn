
/workspace/scratch/69fd8163d94e/populous-research-inputs/game/app/D3DPopTB.exe:     file format pei-i386


Disassembly of section .text:

0050b740 <.text+0x10a740>:
  50b740:	83 ec 24             	sub    esp,0x24
  50b743:	53                   	push   ebx
  50b744:	56                   	push   esi
  50b745:	57                   	push   edi
  50b746:	33 db                	xor    ebx,ebx
  50b748:	89 5c 24 18          	mov    DWORD PTR [esp+0x18],ebx
  50b74c:	55                   	push   ebp
  50b74d:	a1 b8 a5 5a 00       	mov    eax,ds:0x5aa5b8
  50b752:	8b 7c 24 38          	mov    edi,DWORD PTR [esp+0x38]
  50b756:	66 8b 4f 70          	mov    cx,WORD PTR [edi+0x70]
  50b75a:	89 5c 24 20          	mov    DWORD PTR [esp+0x20],ebx
  50b75e:	88 5c 24 10          	mov    BYTE PTR [esp+0x10],bl
  50b762:	51                   	push   ecx
  50b763:	89 5c 24 30          	mov    DWORD PTR [esp+0x30],ebx
  50b767:	53                   	push   ebx
  50b768:	89 44 24 38          	mov    DWORD PTR [esp+0x38],eax
  50b76c:	53                   	push   ebx
  50b76d:	6a 02                	push   0x2
  50b76f:	e8 7c eb f8 ff       	call   0x49a2f0
  50b774:	83 c4 10             	add    esp,0x10
  50b777:	33 c9                	xor    ecx,ecx
  50b779:	8a c8                	mov    cl,al
  50b77b:	89 4c 24 18          	mov    DWORD PTR [esp+0x18],ecx
  50b77f:	3b cb                	cmp    ecx,ebx
  50b781:	0f 84 39 04 00 00    	je     0x50bbc0
  50b787:	66 8b 47 3d          	mov    ax,WORD PTR [edi+0x3d]
  50b78b:	66 c1 e8 08          	shr    ax,0x8
  50b78f:	24 fe                	and    al,0xfe
  50b791:	88 44 24 12          	mov    BYTE PTR [esp+0x12],al
  50b795:	8d 54 24 20          	lea    edx,[esp+0x20]
  50b799:	66 8b 47 3f          	mov    ax,WORD PTR [edi+0x3f]
  50b79d:	52                   	push   edx
  50b79e:	66 c1 e8 08          	shr    ax,0x8
  50b7a2:	24 fe                	and    al,0xfe
  50b7a4:	88 44 24 17          	mov    BYTE PTR [esp+0x17],al
  50b7a8:	8d 44 24 20          	lea    eax,[esp+0x20]
  50b7ac:	66 8b 4c 24 16       	mov    cx,WORD PTR [esp+0x16]
  50b7b1:	50                   	push   eax
  50b7b2:	66 89 4c 24 1e       	mov    WORD PTR [esp+0x1e],cx
  50b7b7:	8b 4c 24 20          	mov    ecx,DWORD PTR [esp+0x20]
  50b7bb:	51                   	push   ecx
  50b7bc:	e8 2f ec f8 ff       	call   0x49a3f0
  50b7c1:	83 c4 0c             	add    esp,0xc
  50b7c4:	84 c0                	test   al,al
  50b7c6:	0f 84 e7 03 00 00    	je     0x50bbb3
  50b7cc:	8b 44 24 1c          	mov    eax,DWORD PTR [esp+0x1c]
  50b7d0:	02 c0                	add    al,al
  50b7d2:	02 44 24 16          	add    al,BYTE PTR [esp+0x16]
  50b7d6:	88 44 24 14          	mov    BYTE PTR [esp+0x14],al
  50b7da:	8b 44 24 20          	mov    eax,DWORD PTR [esp+0x20]
  50b7de:	02 c0                	add    al,al
  50b7e0:	33 c9                	xor    ecx,ecx
  50b7e2:	02 44 24 17          	add    al,BYTE PTR [esp+0x17]
  50b7e6:	88 44 24 15          	mov    BYTE PTR [esp+0x15],al
  50b7ea:	33 c0                	xor    eax,eax
  50b7ec:	66 8b 44 24 14       	mov    ax,WORD PTR [esp+0x14]
  50b7f1:	66 8b 4c 24 14       	mov    cx,WORD PTR [esp+0x14]
  50b7f6:	25 fe 00 00 00       	and    eax,0xfe
  50b7fb:	03 c0                	add    eax,eax
  50b7fd:	81 e1 00 fe 00 00    	and    ecx,0xfe00
  50b803:	0b c1                	or     eax,ecx
  50b805:	8d 14 85 e4 03 8a 00 	lea    edx,[eax*4+0x8a03e4]
  50b80c:	0f bf 42 06          	movsx  eax,WORD PTR [edx+0x6]
  50b810:	89 54 24 24          	mov    DWORD PTR [esp+0x24],edx
  50b814:	8b 34 85 90 03 89 00 	mov    esi,DWORD PTR [eax*4+0x890390]
  50b81b:	85 f6                	test   esi,esi
  50b81d:	0f 84 18 03 00 00    	je     0x50bb3b
  50b823:	f6 46 11 01          	test   BYTE PTR [esi+0x11],0x1
  50b827:	0f 84 a2 02 00 00    	je     0x50bacf
  50b82d:	bb 01 00 00 00       	mov    ebx,0x1
  50b832:	33 c0                	xor    eax,eax
  50b834:	88 44 24 11          	mov    BYTE PTR [esp+0x11],al
  50b838:	57                   	push   edi
  50b839:	88 44 24 14          	mov    BYTE PTR [esp+0x14],al
  50b83d:	56                   	push   esi
  50b83e:	e8 2d b5 f0 ff       	call   0x416d70
  50b843:	83 c4 08             	add    esp,0x8
  50b846:	84 c0                	test   al,al
  50b848:	74 04                	je     0x50b84e
  50b84a:	88 5c 24 10          	mov    BYTE PTR [esp+0x10],bl
  50b84e:	8a 46 2a             	mov    al,BYTE PTR [esi+0x2a]
  50b851:	3c 01                	cmp    al,0x1
  50b853:	75 73                	jne    0x50b8c8
  50b855:	c6 44 24 11 01       	mov    BYTE PTR [esp+0x11],0x1
  50b85a:	8a 4e 2b             	mov    cl,BYTE PTR [esi+0x2b]
  50b85d:	80 f9 07             	cmp    cl,0x7
  50b860:	75 0a                	jne    0x50b86c
  50b862:	8a 47 2f             	mov    al,BYTE PTR [edi+0x2f]
  50b865:	38 46 2f             	cmp    BYTE PTR [esi+0x2f],al
  50b868:	75 02                	jne    0x50b86c
  50b86a:	32 db                	xor    bl,bl
  50b86c:	80 f9 08             	cmp    cl,0x8
  50b86f:	75 02                	jne    0x50b873
  50b871:	32 db                	xor    bl,bl
  50b873:	80 7f 7b 00          	cmp    BYTE PTR [edi+0x7b],0x0
  50b877:	75 09                	jne    0x50b882
  50b879:	80 7c 24 10 00       	cmp    BYTE PTR [esp+0x10],0x0
  50b87e:	74 02                	je     0x50b882
  50b880:	32 db                	xor    bl,bl
  50b882:	66 83 be 9f 00 00 00 	cmp    WORD PTR [esi+0x9f],0x0
  50b889:	00 
  50b88a:	74 02                	je     0x50b88e
  50b88c:	32 db                	xor    bl,bl
  50b88e:	f6 46 16 02          	test   BYTE PTR [esi+0x16],0x2
  50b892:	74 06                	je     0x50b89a
  50b894:	33 db                	xor    ebx,ebx
  50b896:	88 5c 24 11          	mov    BYTE PTR [esp+0x11],bl
  50b89a:	33 c0                	xor    eax,eax
  50b89c:	38 44 24 10          	cmp    BYTE PTR [esp+0x10],al
  50b8a0:	74 3d                	je     0x50b8df
  50b8a2:	83 7f 68 01          	cmp    DWORD PTR [edi+0x68],0x1
  50b8a6:	75 18                	jne    0x50b8c0
  50b8a8:	8b 4c 24 2c          	mov    ecx,DWORD PTR [esp+0x2c]
  50b8ac:	39 4c 24 30          	cmp    DWORD PTR [esp+0x30],ecx
  50b8b0:	7f 08                	jg     0x50b8ba
  50b8b2:	32 db                	xor    bl,bl
  50b8b4:	88 44 24 11          	mov    BYTE PTR [esp+0x11],al
  50b8b8:	eb 25                	jmp    0x50b8df
  50b8ba:	ff 44 24 2c          	inc    DWORD PTR [esp+0x2c]
  50b8be:	eb 1f                	jmp    0x50b8df
  50b8c0:	33 db                	xor    ebx,ebx
  50b8c2:	88 5c 24 11          	mov    BYTE PTR [esp+0x11],bl
  50b8c6:	eb 17                	jmp    0x50b8df
  50b8c8:	3c 04                	cmp    al,0x4
  50b8ca:	75 13                	jne    0x50b8df
  50b8cc:	a1 10 a5 5a 00       	mov    eax,ds:0x5aa510
  50b8d1:	8a 4f 2f             	mov    cl,BYTE PTR [edi+0x2f]
  50b8d4:	50                   	push   eax
  50b8d5:	51                   	push   ecx
  50b8d6:	56                   	push   esi
  50b8d7:	e8 24 b6 f5 ff       	call   0x466f00
  50b8dc:	83 c4 0c             	add    esp,0xc
  50b8df:	f6 46 15 80          	test   BYTE PTR [esi+0x15],0x80
  50b8e3:	74 06                	je     0x50b8eb
  50b8e5:	33 db                	xor    ebx,ebx
  50b8e7:	88 5c 24 11          	mov    BYTE PTR [esp+0x11],bl
  50b8eb:	84 db                	test   bl,bl
  50b8ed:	0f 84 29 01 00 00    	je     0x50ba1c
  50b8f3:	f6 47 7a 01          	test   BYTE PTR [edi+0x7a],0x1
  50b8f7:	74 33                	je     0x50b92c
  50b8f9:	80 7e 2a 01          	cmp    BYTE PTR [esi+0x2a],0x1
  50b8fd:	75 2d                	jne    0x50b92c
  50b8ff:	8a 46 2c             	mov    al,BYTE PTR [esi+0x2c]
  50b902:	3c 1a                	cmp    al,0x1a
  50b904:	74 26                	je     0x50b92c
  50b906:	f6 46 0e 10          	test   BYTE PTR [esi+0xe],0x10
  50b90a:	75 19                	jne    0x50b925
  50b90c:	56                   	push   esi
  50b90d:	88 46 7d             	mov    BYTE PTR [esi+0x7d],al
  50b910:	e8 db 1d fe ff       	call   0x4ed6f0
  50b915:	83 c4 04             	add    esp,0x4
  50b918:	c6 46 2c 1a          	mov    BYTE PTR [esi+0x2c],0x1a
  50b91c:	56                   	push   esi
  50b91d:	e8 1e 1d fe ff       	call   0x4ed640
  50b922:	83 c4 04             	add    esp,0x4
  50b925:	c6 86 a4 00 00 00 18 	mov    BYTE PTR [esi+0xa4],0x18
  50b92c:	8b 46 0c             	mov    eax,DWORD PTR [esi+0xc]
  50b92f:	0d 00 20 00 00       	or     eax,0x2000
  50b934:	89 46 0c             	mov    DWORD PTR [esi+0xc],eax
  50b937:	0d 00 00 08 00       	or     eax,0x80000
  50b93c:	89 46 0c             	mov    DWORD PTR [esi+0xc],eax
  50b93f:	80 7f 7c 00          	cmp    BYTE PTR [edi+0x7c],0x0
  50b943:	75 04                	jne    0x50b949
  50b945:	83 4e 14 08          	or     DWORD PTR [esi+0x14],0x8
  50b949:	66 8b 47 3d          	mov    ax,WORD PTR [edi+0x3d]
  50b94d:	66 2b 46 3d          	sub    ax,WORD PTR [esi+0x3d]
  50b951:	0f b7 d8             	movzx  ebx,ax
  50b954:	66 8b 47 3f          	mov    ax,WORD PTR [edi+0x3f]
  50b958:	8b cb                	mov    ecx,ebx
  50b95a:	66 2b 46 3f          	sub    ax,WORD PTR [esi+0x3f]
  50b95e:	85 db                	test   ebx,ebx
  50b960:	0f b7 c0             	movzx  eax,ax
  50b963:	7d 04                	jge    0x50b969
  50b965:	8b cb                	mov    ecx,ebx
  50b967:	f7 d9                	neg    ecx
  50b969:	8b d0                	mov    edx,eax
  50b96b:	85 c0                	test   eax,eax
  50b96d:	7d 04                	jge    0x50b973
  50b96f:	8b d0                	mov    edx,eax
  50b971:	f7 da                	neg    edx
  50b973:	81 f9 00 80 00 00    	cmp    ecx,0x8000
  50b979:	7c 06                	jl     0x50b981
  50b97b:	8d 99 00 00 ff ff    	lea    ebx,[ecx-0x10000]
  50b981:	81 fa 00 80 00 00    	cmp    edx,0x8000
  50b987:	7c 06                	jl     0x50b98f
  50b989:	8d 82 00 00 ff ff    	lea    eax,[edx-0x10000]
  50b98f:	f7 d8                	neg    eax
  50b991:	50                   	push   eax
  50b992:	53                   	push   ebx
  50b993:	33 db                	xor    ebx,ebx
  50b995:	e8 da a6 07 00       	call   0x586074
  50b99a:	66 8b d8             	mov    bx,ax
  50b99d:	83 c4 08             	add    esp,0x8
  50b9a0:	81 e3 ff 07 00 00    	and    ebx,0x7ff
  50b9a6:	8d 47 3d             	lea    eax,[edi+0x3d]
  50b9a9:	81 c3 00 04 00 00    	add    ebx,0x400
  50b9af:	50                   	push   eax
  50b9b0:	81 e3 ff 07 00 00    	and    ebx,0x7ff
  50b9b6:	8d 4e 3d             	lea    ecx,[esi+0x3d]
  50b9b9:	51                   	push   ecx
  50b9ba:	e8 31 4a f4 ff       	call   0x4503f0
  50b9bf:	83 c4 08             	add    esp,0x8
  50b9c2:	8b e8                	mov    ebp,eax
  50b9c4:	85 ed                	test   ebp,ebp
  50b9c6:	7d 02                	jge    0x50b9ca
  50b9c8:	33 ed                	xor    ebp,ebp
  50b9ca:	39 6f 6c             	cmp    DWORD PTR [edi+0x6c],ebp
  50b9cd:	7d 03                	jge    0x50b9d2
  50b9cf:	8b 6f 6c             	mov    ebp,DWORD PTR [edi+0x6c]
  50b9d2:	8b 4f 6c             	mov    ecx,DWORD PTR [edi+0x6c]
  50b9d5:	53                   	push   ebx
  50b9d6:	2b cd                	sub    ecx,ebp
  50b9d8:	0f bf 47 74          	movsx  eax,WORD PTR [edi+0x74]
  50b9dc:	0f af c1             	imul   eax,ecx
  50b9df:	99                   	cdq
  50b9e0:	f7 7f 6c             	idiv   DWORD PTR [edi+0x6c]
  50b9e3:	50                   	push   eax
  50b9e4:	8d 56 3d             	lea    edx,[esi+0x3d]
  50b9e7:	52                   	push   edx
  50b9e8:	8d 4e 49             	lea    ecx,[esi+0x49]
  50b9eb:	51                   	push   ecx
  50b9ec:	e8 ff d9 fd ff       	call   0x4e93f0
  50b9f1:	83 c4 10             	add    esp,0x10
  50b9f4:	8b 5f 6c             	mov    ebx,DWORD PTR [edi+0x6c]
  50b9f7:	8b cb                	mov    ecx,ebx
  50b9f9:	2b cd                	sub    ecx,ebp
  50b9fb:	0f bf 47 78          	movsx  eax,WORD PTR [edi+0x78]
  50b9ff:	0f af c1             	imul   eax,ecx
  50ba02:	99                   	cdq
  50ba03:	f7 fb                	idiv   ebx
  50ba05:	66 01 46 4b          	add    WORD PTR [esi+0x4b],ax
  50ba09:	80 7e 2a 01          	cmp    BYTE PTR [esi+0x2a],0x1
  50ba0d:	75 0d                	jne    0x50ba1c
  50ba0f:	80 7e 2c 1a          	cmp    BYTE PTR [esi+0x2c],0x1a
  50ba13:	75 07                	jne    0x50ba1c
  50ba15:	81 4e 10 00 20 00 00 	or     DWORD PTR [esi+0x10],0x2000
  50ba1c:	80 7c 24 11 00       	cmp    BYTE PTR [esp+0x11],0x0
  50ba21:	0f 84 a8 00 00 00    	je     0x50bacf
  50ba27:	56                   	push   esi
  50ba28:	e8 73 84 fc ff       	call   0x4d3ea0
  50ba2d:	83 c4 04             	add    esp,0x4
  50ba30:	80 7c 24 10 00       	cmp    BYTE PTR [esp+0x10],0x0
  50ba35:	0f 85 94 00 00 00    	jne    0x50bacf
  50ba3b:	80 7f 7d 00          	cmp    BYTE PTR [edi+0x7d],0x0
  50ba3f:	74 4e                	je     0x50ba8f
  50ba41:	66 8b 44 24 12       	mov    ax,WORD PTR [esp+0x12]
  50ba46:	66 39 44 24 14       	cmp    WORD PTR [esp+0x14],ax
  50ba4b:	75 42                	jne    0x50ba8f
  50ba4d:	80 7e 2f ff          	cmp    BYTE PTR [esi+0x2f],0xff
  50ba51:	74 3c                	je     0x50ba8f
  50ba53:	a1 78 d1 89 00       	mov    eax,ds:0x89d178
  50ba58:	8b c8                	mov    ecx,eax
  50ba5a:	8d 14 c0             	lea    edx,[eax+eax*8]
  50ba5d:	8d 04 d1             	lea    eax,[ecx+edx*8]
  50ba60:	8d 04 81             	lea    eax,[ecx+eax*4]
  50ba63:	c1 e0 02             	shl    eax,0x2
  50ba66:	8d 04 c1             	lea    eax,[ecx+eax*8]
  50ba69:	05 df 24 00 00       	add    eax,0x24df
  50ba6e:	a3 78 d1 89 00       	mov    ds:0x89d178,eax
  50ba73:	89 44 24 28          	mov    DWORD PTR [esp+0x28],eax
  50ba77:	c1 4c 24 28 0d       	ror    DWORD PTR [esp+0x28],0xd
  50ba7c:	8b 44 24 28          	mov    eax,DWORD PTR [esp+0x28]
  50ba80:	a3 78 d1 89 00       	mov    ds:0x89d178,eax
  50ba85:	24 0f                	and    al,0xf
  50ba87:	04 10                	add    al,0x10
  50ba89:	88 86 a4 00 00 00    	mov    BYTE PTR [esi+0xa4],al
  50ba8f:	f6 05 68 c6 89 00 04 	test   BYTE PTR ds:0x89c668,0x4
  50ba96:	6a 00                	push   0x0
  50ba98:	74 07                	je     0x50baa1
  50ba9a:	0f bf 46 6e          	movsx  eax,WORD PTR [esi+0x6e]
  50ba9e:	40                   	inc    eax
  50ba9f:	eb 05                	jmp    0x50baa6
  50baa1:	a1 10 a5 5a 00       	mov    eax,ds:0x5aa510
  50baa6:	50                   	push   eax
  50baa7:	8a 4f 2f             	mov    cl,BYTE PTR [edi+0x2f]
  50baaa:	51                   	push   ecx
  50baab:	56                   	push   esi
  50baac:	e8 cf e5 fc ff       	call   0x4da080
  50bab1:	83 c4 10             	add    esp,0x10
  50bab4:	f6 46 11 08          	test   BYTE PTR [esi+0x11],0x8
  50bab8:	74 15                	je     0x50bacf
  50baba:	66 8b 44 24 12       	mov    ax,WORD PTR [esp+0x12]
  50babf:	66 39 44 24 14       	cmp    WORD PTR [esp+0x14],ax
  50bac4:	75 09                	jne    0x50bacf
  50bac6:	56                   	push   esi
  50bac7:	e8 b4 36 fe ff       	call   0x4ef180
  50bacc:	83 c4 04             	add    esp,0x4
  50bacf:	8a 46 2a             	mov    al,BYTE PTR [esi+0x2a]
  50bad2:	3c 02                	cmp    al,0x2
  50bad4:	74 16                	je     0x50baec
  50bad6:	3c 05                	cmp    al,0x5
  50bad8:	75 4c                	jne    0x50bb26
  50bada:	33 c0                	xor    eax,eax
  50badc:	8a 46 2b             	mov    al,BYTE PTR [esi+0x2b]
  50badf:	8d 0c 40             	lea    ecx,[eax+eax*2]
  50bae2:	f6 04 cd c6 79 5a 00 	test   BYTE PTR [ecx*8+0x5a79c6],0x4
  50bae9:	04 
  50baea:	74 3a                	je     0x50bb26
  50baec:	80 7e 65 00          	cmp    BYTE PTR [esi+0x65],0x0
  50baf0:	75 0d                	jne    0x50baff
  50baf2:	c6 46 65 01          	mov    BYTE PTR [esi+0x65],0x1
  50baf6:	66 8b 44 24 12       	mov    ax,WORD PTR [esp+0x12]
  50bafb:	66 89 46 61          	mov    WORD PTR [esi+0x61],ax
  50baff:	80 7f 7c 00          	cmp    BYTE PTR [edi+0x7c],0x0
  50bb03:	75 21                	jne    0x50bb26
  50bb05:	80 7e 2a 02          	cmp    BYTE PTR [esi+0x2a],0x2
  50bb09:	75 1b                	jne    0x50bb26
  50bb0b:	80 7c 24 10 00       	cmp    BYTE PTR [esp+0x10],0x0
  50bb10:	75 14                	jne    0x50bb26
  50bb12:	8a 47 2f             	mov    al,BYTE PTR [edi+0x2f]
  50bb15:	8b 0d 0c a5 5a 00    	mov    ecx,DWORD PTR ds:0x5aa50c
  50bb1b:	50                   	push   eax
  50bb1c:	51                   	push   ecx
  50bb1d:	56                   	push   esi
  50bb1e:	e8 dd d6 ef ff       	call   0x409200
  50bb23:	83 c4 0c             	add    esp,0xc
  50bb26:	33 c0                	xor    eax,eax
  50bb28:	66 8b 46 20          	mov    ax,WORD PTR [esi+0x20]
  50bb2c:	8b 34 85 90 03 89 00 	mov    esi,DWORD PTR [eax*4+0x890390]
  50bb33:	85 f6                	test   esi,esi
  50bb35:	0f 85 e8 fc ff ff    	jne    0x50b823
  50bb3b:	8b 4c 24 24          	mov    ecx,DWORD PTR [esp+0x24]
  50bb3f:	66 8b 41 08          	mov    ax,WORD PTR [ecx+0x8]
  50bb43:	66 25 ff 03          	and    ax,0x3ff
  50bb47:	74 4b                	je     0x50bb94
  50bb49:	f6 41 01 02          	test   BYTE PTR [ecx+0x1],0x2
  50bb4d:	74 45                	je     0x50bb94
  50bb4f:	0f b7 c0             	movzx  eax,ax
  50bb52:	8b 34 85 90 03 89 00 	mov    esi,DWORD PTR [eax*4+0x890390]
  50bb59:	80 7e 65 00          	cmp    BYTE PTR [esi+0x65],0x0
  50bb5d:	75 0d                	jne    0x50bb6c
  50bb5f:	c6 46 65 01          	mov    BYTE PTR [esi+0x65],0x1
  50bb63:	66 8b 44 24 12       	mov    ax,WORD PTR [esp+0x12]
  50bb68:	66 89 46 61          	mov    WORD PTR [esi+0x61],ax
  50bb6c:	80 7f 7c 00          	cmp    BYTE PTR [edi+0x7c],0x0
  50bb70:	75 22                	jne    0x50bb94
  50bb72:	57                   	push   edi
  50bb73:	56                   	push   esi
  50bb74:	e8 f7 b1 f0 ff       	call   0x416d70
  50bb79:	83 c4 08             	add    esp,0x8
  50bb7c:	84 c0                	test   al,al
  50bb7e:	75 14                	jne    0x50bb94
  50bb80:	8a 47 2f             	mov    al,BYTE PTR [edi+0x2f]
  50bb83:	8b 0d 0c a5 5a 00    	mov    ecx,DWORD PTR ds:0x5aa50c
  50bb89:	50                   	push   eax
  50bb8a:	51                   	push   ecx
  50bb8b:	56                   	push   esi
  50bb8c:	e8 6f d6 ef ff       	call   0x409200
  50bb91:	83 c4 0c             	add    esp,0xc
  50bb94:	8d 44 24 20          	lea    eax,[esp+0x20]
  50bb98:	8d 4c 24 1c          	lea    ecx,[esp+0x1c]
  50bb9c:	8b 54 24 18          	mov    edx,DWORD PTR [esp+0x18]
  50bba0:	50                   	push   eax
  50bba1:	51                   	push   ecx
  50bba2:	52                   	push   edx
  50bba3:	e8 48 e8 f8 ff       	call   0x49a3f0
  50bba8:	83 c4 0c             	add    esp,0xc
  50bbab:	84 c0                	test   al,al
  50bbad:	0f 85 19 fc ff ff    	jne    0x50b7cc
  50bbb3:	8b 44 24 18          	mov    eax,DWORD PTR [esp+0x18]
  50bbb7:	50                   	push   eax
  50bbb8:	e8 13 ea f8 ff       	call   0x49a5d0
  50bbbd:	83 c4 04             	add    esp,0x4
  50bbc0:	c6 47 7c 01          	mov    BYTE PTR [edi+0x7c],0x1
  50bbc4:	8b 47 68             	mov    eax,DWORD PTR [edi+0x68]
  50bbc7:	48                   	dec    eax
  50bbc8:	89 47 68             	mov    DWORD PTR [edi+0x68],eax
  50bbcb:	85 c0                	test   eax,eax
  50bbcd:	7e 21                	jle    0x50bbf0
  50bbcf:	66 8b 4f 76          	mov    cx,WORD PTR [edi+0x76]
  50bbd3:	66 8b 47 72          	mov    ax,WORD PTR [edi+0x72]
  50bbd7:	66 03 4f 70          	add    cx,WORD PTR [edi+0x70]
  50bbdb:	66 89 4f 70          	mov    WORD PTR [edi+0x70],cx
  50bbdf:	66 3b c8             	cmp    cx,ax
  50bbe2:	7e 15                	jle    0x50bbf9
  50bbe4:	66 89 47 70          	mov    WORD PTR [edi+0x70],ax
  50bbe8:	5d                   	pop    ebp
  50bbe9:	5f                   	pop    edi
  50bbea:	5e                   	pop    esi
  50bbeb:	5b                   	pop    ebx
  50bbec:	83 c4 24             	add    esp,0x24
  50bbef:	c3                   	ret
  50bbf0:	57                   	push   edi
  50bbf1:	e8 fa 20 fe ff       	call   0x4edcf0
  50bbf6:	83 c4 04             	add    esp,0x4
  50bbf9:	5d                   	pop    ebp
  50bbfa:	5f                   	pop    edi
  50bbfb:	5e                   	pop    esi
  50bbfc:	5b                   	pop    ebx
  50bbfd:	83 c4 24             	add    esp,0x24
  50bc00:	c3                   	ret
  50bc01:	cc                   	int3
  50bc02:	cc                   	int3
  50bc03:	cc                   	int3
  50bc04:	cc                   	int3
  50bc05:	cc                   	int3
  50bc06:	cc                   	int3
  50bc07:	cc                   	int3
  50bc08:	cc                   	int3
  50bc09:	cc                   	int3
  50bc0a:	cc                   	int3
  50bc0b:	cc                   	int3
  50bc0c:	cc                   	int3
  50bc0d:	cc                   	int3
  50bc0e:	cc                   	int3
  50bc0f:	cc                   	int3
  50bc10:	56                   	push   esi
  50bc11:	8b 74 24 08          	mov    esi,DWORD PTR [esp+0x8]
  50bc15:	66 8b 46 6a          	mov    ax,WORD PTR [esi+0x6a]
  50bc19:	8d 56 68             	lea    edx,[esi+0x68]
  50bc1c:	66 85 c0             	test   ax,ax
  50bc1f:	8d 48 ff             	lea    ecx,[eax-0x1]
  50bc22:	66 89 4a 02          	mov    WORD PTR [edx+0x2],cx
  50bc26:	74 5a                	je     0x50bc82
  50bc28:	66 8b 42 04          	mov    ax,WORD PTR [edx+0x4]
  50bc2c:	66 03 42 0a          	add    ax,WORD PTR [edx+0xa]
  50bc30:	66 89 42 04          	mov    WORD PTR [edx+0x4],ax
  50bc34:	66 83 7a 0a 00       	cmp    WORD PTR [edx+0xa],0x0
  50bc39:	7e 08                	jle    0x50bc43
  50bc3b:	66 39 42 08          	cmp    WORD PTR [edx+0x8],ax
  50bc3f:	7d 10                	jge    0x50bc51
  50bc41:	eb 06                	jmp    0x50bc49
  50bc43:	66 39 42 08          	cmp    WORD PTR [edx+0x8],ax
  50bc47:	7e 08                	jle    0x50bc51
  50bc49:	66 8b 42 06          	mov    ax,WORD PTR [edx+0x6]
  50bc4d:	66 89 42 04          	mov    WORD PTR [edx+0x4],ax
  50bc51:	8b 46 0c             	mov    eax,DWORD PTR [esi+0xc]
  50bc54:	a8 04                	test   al,0x4
  50bc56:	74 33                	je     0x50bc8b
  50bc58:	66 8b 4e 3f          	mov    cx,WORD PTR [esi+0x3f]
  50bc5c:	83 e0 fb             	and    eax,0xfffffffb
  50bc5f:	66 8b 56 3d          	mov    dx,WORD PTR [esi+0x3d]
  50bc63:	51                   	push   ecx
  50bc64:	52                   	push   edx
  50bc65:	89 46 0c             	mov    DWORD PTR [esi+0xc],eax
  50bc68:	e8 d3 2c f4 ff       	call   0x44e940
  50bc6d:	66 89 46 41          	mov    WORD PTR [esi+0x41],ax
  50bc71:	83 c4 08             	add    esp,0x8
  50bc74:	81 66 10 ff fb ff ff 	and    DWORD PTR [esi+0x10],0xfffffbff
  50bc7b:	66 83 46 41 40       	add    WORD PTR [esi+0x41],0x40
  50bc80:	5e                   	pop    esi
  50bc81:	c3                   	ret
  50bc82:	56                   	push   esi
  50bc83:	e8 68 20 fe ff       	call   0x4edcf0
  50bc88:	83 c4 04             	add    esp,0x4
  50bc8b:	5e                   	pop    esi
  50bc8c:	c3                   	ret
  50bc8d:	cc                   	int3
  50bc8e:	cc                   	int3
  50bc8f:	cc                   	int3
  50bc90:	8a 44 24 08          	mov    al,BYTE PTR [esp+0x8]
  50bc94:	8b 54 24 04          	mov    edx,DWORD PTR [esp+0x4]
  50bc98:	8b 4c 24 0c          	mov    ecx,DWORD PTR [esp+0xc]
  50bc9c:	88 42 68             	mov    BYTE PTR [edx+0x68],al
  50bc9f:	66 89 4a 6a          	mov    WORD PTR [edx+0x6a],cx
  50bca3:	8b 44 24 14          	mov    eax,DWORD PTR [esp+0x14]
  50bca7:	66 8b 4c 24 10       	mov    cx,WORD PTR [esp+0x10]
  50bcac:	66 89 4a 6e          	mov    WORD PTR [edx+0x6e],cx
  50bcb0:	66 89 42 70          	mov    WORD PTR [edx+0x70],ax
  50bcb4:	8b 44 24 18          	mov    eax,DWORD PTR [esp+0x18]
  50bcb8:	66 89 42 72          	mov    WORD PTR [edx+0x72],ax
  50bcbc:	66 89 4a 6c          	mov    WORD PTR [edx+0x6c],cx
  50bcc0:	c3                   	ret
  50bcc1:	cc                   	int3
  50bcc2:	cc                   	int3
  50bcc3:	cc                   	int3
  50bcc4:	cc                   	int3
  50bcc5:	cc                   	int3
  50bcc6:	cc                   	int3
  50bcc7:	cc                   	int3
  50bcc8:	cc                   	int3
  50bcc9:	cc                   	int3
  50bcca:	cc                   	int3
  50bccb:	cc                   	int3
  50bccc:	cc                   	int3
  50bccd:	cc                   	int3
  50bcce:	cc                   	int3
  50bccf:	cc                   	int3
  50bcd0:	56                   	push   esi
  50bcd1:	57                   	push   edi
  50bcd2:	8b 74 24 0c          	mov    esi,DWORD PTR [esp+0xc]
  50bcd6:	8d 7e 3d             	lea    edi,[esi+0x3d]
  50bcd9:	57                   	push   edi
  50bcda:	56                   	push   esi
  50bcdb:	e8 90 27 fe ff       	call   0x4ee470
  50bce0:	66 8b 46 3f          	mov    ax,WORD PTR [esi+0x3f]
  50bce4:	83 c4 08             	add    esp,0x8
  50bce7:	66 8b 0f             	mov    cx,WORD PTR [edi]
  50bcea:	50                   	push   eax
  50bceb:	51                   	push   ecx
  50bcec:	e8 4f 2c f4 ff       	call   0x44e940
  50bcf1:	0f bf c0             	movsx  eax,ax
  50bcf4:	0f bf 4e 41          	movsx  ecx,WORD PTR [esi+0x41]
  50bcf8:	83 c4 08             	add    esp,0x8
  50bcfb:	3b c8                	cmp    ecx,eax
  50bcfd:	7d 04                	jge    0x50bd03
  50bcff:	66                   	data16
