
/workspace/scratch/69fd8163d94e/cloud-dev-20261004/prerequisites/game/d3dpoptb.exe:     file format pei-i386


Disassembly of section .text:

0051e7b0 <.text+0x11d7b0>:
  51e7b0:	83 ec 18             	sub    esp,0x18
  51e7b3:	53                   	push   ebx
  51e7b4:	56                   	push   esi
  51e7b5:	57                   	push   edi
  51e7b6:	33 db                	xor    ebx,ebx
  51e7b8:	8b 74 24 28          	mov    esi,DWORD PTR [esp+0x28]
  51e7bc:	89 5c 24 1c          	mov    DWORD PTR [esp+0x1c],ebx
  51e7c0:	88 5c 24 0f          	mov    BYTE PTR [esp+0xf],bl
  51e7c4:	56                   	push   esi
  51e7c5:	88 5c 24 12          	mov    BYTE PTR [esp+0x12],bl
  51e7c9:	e8 92 17 00 00       	call   0x51ff60
  51e7ce:	83 c4 04             	add    esp,0x4
  51e7d1:	85 c0                	test   eax,eax
  51e7d3:	0f 84 be 01 00 00    	je     0x51e997
  51e7d9:	99                   	cdq
  51e7da:	2b c2                	sub    eax,edx
  51e7dc:	c1 f8 01             	sar    eax,0x1
  51e7df:	03 c0                	add    eax,eax
  51e7e1:	89 44 24 20          	mov    DWORD PTR [esp+0x20],eax
  51e7e5:	66 8b 46 3d          	mov    ax,WORD PTR [esi+0x3d]
  51e7e9:	66 c1 e8 08          	shr    ax,0x8
  51e7ed:	24 fe                	and    al,0xfe
  51e7ef:	88 44 24 10          	mov    BYTE PTR [esp+0x10],al
  51e7f3:	66 8b 46 3f          	mov    ax,WORD PTR [esi+0x3f]
  51e7f7:	66 c1 e8 08          	shr    ax,0x8
  51e7fb:	24 fe                	and    al,0xfe
  51e7fd:	88 44 24 11          	mov    BYTE PTR [esp+0x11],al
  51e801:	80 7e 2b 04          	cmp    BYTE PTR [esi+0x2b],0x4
  51e805:	66 8b 4c 24 10       	mov    cx,WORD PTR [esp+0x10]
  51e80a:	66 89 4c 24 12       	mov    WORD PTR [esp+0x12],cx
  51e80f:	75 1f                	jne    0x51e830
  51e811:	56                   	push   esi
  51e812:	e8 29 09 fc ff       	call   0x4df140
  51e817:	83 c4 04             	add    esp,0x4
  51e81a:	84 c0                	test   al,al
  51e81c:	74 0d                	je     0x51e82b
  51e81e:	f6 46 76 40          	test   BYTE PTR [esi+0x76],0x40
  51e822:	75 0c                	jne    0x51e830
  51e824:	c6 44 24 0f 01       	mov    BYTE PTR [esp+0xf],0x1
  51e829:	eb 05                	jmp    0x51e830
  51e82b:	c6 44 24 0e 01       	mov    BYTE PTR [esp+0xe],0x1
  51e830:	8d 44 24 18          	lea    eax,[esp+0x18]
  51e834:	6a 00                	push   0x0
  51e836:	8b 4c 24 13          	mov    ecx,DWORD PTR [esp+0x13]
  51e83a:	6a 00                	push   0x0
  51e83c:	8b 54 24 28          	mov    edx,DWORD PTR [esp+0x28]
  51e840:	50                   	push   eax
  51e841:	8b 44 24 1c          	mov    eax,DWORD PTR [esp+0x1c]
  51e845:	51                   	push   ecx
  51e846:	6a 00                	push   0x0
  51e848:	52                   	push   edx
  51e849:	52                   	push   edx
  51e84a:	50                   	push   eax
  51e84b:	56                   	push   esi
  51e84c:	e8 df 07 00 00       	call   0x51f030
  51e851:	83 c4 24             	add    esp,0x24
  51e854:	8a d8                	mov    bl,al
  51e856:	84 db                	test   bl,bl
  51e858:	0f 85 9a 00 00 00    	jne    0x51e8f8
  51e85e:	80 7c 24 0e 00       	cmp    BYTE PTR [esp+0xe],0x0
  51e863:	74 28                	je     0x51e88d
  51e865:	8d 44 24 1c          	lea    eax,[esp+0x1c]
  51e869:	8b 4c 24 0e          	mov    ecx,DWORD PTR [esp+0xe]
  51e86d:	8d 54 24 18          	lea    edx,[esp+0x18]
  51e871:	50                   	push   eax
  51e872:	8b 44 24 13          	mov    eax,DWORD PTR [esp+0x13]
  51e876:	51                   	push   ecx
  51e877:	8b 4c 24 18          	mov    ecx,DWORD PTR [esp+0x18]
  51e87b:	52                   	push   edx
  51e87c:	50                   	push   eax
  51e87d:	6a 00                	push   0x0
  51e87f:	6a 02                	push   0x2
  51e881:	6a 02                	push   0x2
  51e883:	51                   	push   ecx
  51e884:	56                   	push   esi
  51e885:	e8 a6 07 00 00       	call   0x51f030
  51e88a:	83 c4 24             	add    esp,0x24
  51e88d:	84 db                	test   bl,bl
  51e88f:	75 67                	jne    0x51e8f8
  51e891:	83 7c 24 1c 00       	cmp    DWORD PTR [esp+0x1c],0x0
  51e896:	0f 85 c6 00 00 00    	jne    0x51e962
  51e89c:	83 7c 24 18 00       	cmp    DWORD PTR [esp+0x18],0x0
  51e8a1:	74 55                	je     0x51e8f8
  51e8a3:	33 c9                	xor    ecx,ecx
  51e8a5:	8b 44 24 18          	mov    eax,DWORD PTR [esp+0x18]
  51e8a9:	66 8b 80 89 00 00 00 	mov    ax,WORD PTR [eax+0x89]
  51e8b0:	66 3b c1             	cmp    ax,cx
  51e8b3:	74 17                	je     0x51e8cc
  51e8b5:	0f b7 c0             	movzx  eax,ax
  51e8b8:	8b 04 85 90 03 89 00 	mov    eax,DWORD PTR [eax*4+0x890390]
  51e8bf:	f6 40 0c 01          	test   BYTE PTR [eax+0xc],0x1
  51e8c3:	75 07                	jne    0x51e8cc
  51e8c5:	38 48 2a             	cmp    BYTE PTR [eax+0x2a],cl
  51e8c8:	74 02                	je     0x51e8cc
  51e8ca:	8b c8                	mov    ecx,eax
  51e8cc:	85 c9                	test   ecx,ecx
  51e8ce:	74 28                	je     0x51e8f8
  51e8d0:	66 8b 41 3d          	mov    ax,WORD PTR [ecx+0x3d]
  51e8d4:	b3 05                	mov    bl,0x5
  51e8d6:	66 c1 e8 08          	shr    ax,0x8
  51e8da:	24 fe                	and    al,0xfe
  51e8dc:	88 44 24 10          	mov    BYTE PTR [esp+0x10],al
  51e8e0:	66 8b 41 3f          	mov    ax,WORD PTR [ecx+0x3f]
  51e8e4:	66 c1 e8 08          	shr    ax,0x8
  51e8e8:	24 fe                	and    al,0xfe
  51e8ea:	88 44 24 11          	mov    BYTE PTR [esp+0x11],al
  51e8ee:	66 8b 4c 24 10       	mov    cx,WORD PTR [esp+0x10]
  51e8f3:	66 89 4c 24 12       	mov    WORD PTR [esp+0x12],cx
  51e8f8:	83 7c 24 1c 00       	cmp    DWORD PTR [esp+0x1c],0x0
  51e8fd:	75 63                	jne    0x51e962
  51e8ff:	84 db                	test   bl,bl
  51e901:	0f 84 90 00 00 00    	je     0x51e997
  51e907:	e8 14 83 f1 ff       	call   0x436c20
  51e90c:	0f b7 f8             	movzx  edi,ax
  51e90f:	85 ff                	test   edi,edi
  51e911:	0f 84 80 00 00 00    	je     0x51e997
  51e917:	66 8b 44 24 12       	mov    ax,WORD PTR [esp+0x12]
  51e91c:	6a 20                	push   0x20
  51e91e:	66 89 44 24 18       	mov    WORD PTR [esp+0x18],ax
  51e923:	8d 4c 24 18          	lea    ecx,[esp+0x18]
  51e927:	8a 44 24 24          	mov    al,BYTE PTR [esp+0x24]
  51e92b:	51                   	push   ecx
  51e92c:	88 44 24 1e          	mov    BYTE PTR [esp+0x1e],al
  51e930:	6a 15                	push   0x15
  51e932:	88 44 24 23          	mov    BYTE PTR [esp+0x23],al
  51e936:	57                   	push   edi
  51e937:	e8 f4 9d f1 ff       	call   0x438730
  51e93c:	83 c4 10             	add    esp,0x10
  51e93f:	83 4e 0c 10          	or     DWORD PTR [esi+0xc],0x10
  51e943:	6a ff                	push   0xffffffff
  51e945:	57                   	push   edi
  51e946:	56                   	push   esi
  51e947:	e8 b4 83 f1 ff       	call   0x436d00
  51e94c:	83 c4 0c             	add    esp,0xc
  51e94f:	57                   	push   edi
  51e950:	56                   	push   esi
  51e951:	e8 2a 1b 00 00       	call   0x520480
  51e956:	83 c4 08             	add    esp,0x8
  51e959:	8a c3                	mov    al,bl
  51e95b:	5f                   	pop    edi
  51e95c:	5e                   	pop    esi
  51e95d:	5b                   	pop    ebx
  51e95e:	83 c4 18             	add    esp,0x18
  51e961:	c3                   	ret
  51e962:	e8 b9 82 f1 ff       	call   0x436c20
  51e967:	0f b7 f8             	movzx  edi,ax
  51e96a:	85 ff                	test   edi,edi
  51e96c:	74 29                	je     0x51e997
  51e96e:	8b 46 3d             	mov    eax,DWORD PTR [esi+0x3d]
  51e971:	6a 20                	push   0x20
  51e973:	89 44 24 18          	mov    DWORD PTR [esp+0x18],eax
  51e977:	8d 44 24 18          	lea    eax,[esp+0x18]
  51e97b:	50                   	push   eax
  51e97c:	6a 20                	push   0x20
  51e97e:	57                   	push   edi
  51e97f:	e8 ac 9d f1 ff       	call   0x438730
  51e984:	83 c4 10             	add    esp,0x10
  51e987:	83 4e 0c 10          	or     DWORD PTR [esi+0xc],0x10
  51e98b:	6a ff                	push   0xffffffff
  51e98d:	57                   	push   edi
  51e98e:	56                   	push   esi
  51e98f:	e8 6c 83 f1 ff       	call   0x436d00
  51e994:	83 c4 0c             	add    esp,0xc
  51e997:	8a c3                	mov    al,bl
  51e999:	5f                   	pop    edi
  51e99a:	5e                   	pop    esi
  51e99b:	5b                   	pop    ebx
  51e99c:	83 c4 18             	add    esp,0x18
  51e99f:	c3                   	ret
