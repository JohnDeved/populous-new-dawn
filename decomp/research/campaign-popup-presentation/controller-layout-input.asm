
populous-original-inputs-20261020/game/d3dpoptb.exe:     file format pei-i386


Disassembly of section .text:

004af780 <.text+0xae780>:
  4af780:	81 ec 00 01 00 00    	sub    esp,0x100
  4af786:	53                   	push   ebx
  4af787:	56                   	push   esi
  4af788:	57                   	push   edi
  4af789:	33 db                	xor    ebx,ebx
  4af78b:	55                   	push   ebp
  4af78c:	33 ff                	xor    edi,edi
  4af78e:	38 1d f2 bb 89 00    	cmp    BYTE PTR ds:0x89bbf2,bl
  4af794:	7e 4e                	jle    0x4af7e4
  4af796:	66 8b 94 24 14 01 00 	mov    dx,WORD PTR [esp+0x114]
  4af79d:	00 
  4af79e:	bd bf bb 89 00       	mov    ebp,0x89bbbf
  4af7a3:	0f bf ca             	movsx  ecx,dx
  4af7a6:	66 8b b4 24 18 01 00 	mov    si,WORD PTR [esp+0x118]
  4af7ad:	00 
  4af7ae:	39 4d 00             	cmp    DWORD PTR [ebp+0x0],ecx
  4af7b1:	7f 12                	jg     0x4af7c5
  4af7b3:	39 4d 08             	cmp    DWORD PTR [ebp+0x8],ecx
  4af7b6:	7c 0d                	jl     0x4af7c5
  4af7b8:	0f bf c6             	movsx  eax,si
  4af7bb:	39 45 04             	cmp    DWORD PTR [ebp+0x4],eax
  4af7be:	7f 05                	jg     0x4af7c5
  4af7c0:	39 45 0c             	cmp    DWORD PTR [ebp+0xc],eax
  4af7c3:	7d 11                	jge    0x4af7d6
  4af7c5:	83 c5 10             	add    ebp,0x10
  4af7c8:	47                   	inc    edi
  4af7c9:	0f be 05 f2 bb 89 00 	movsx  eax,BYTE PTR ds:0x89bbf2
  4af7d0:	3b c7                	cmp    eax,edi
  4af7d2:	7f da                	jg     0x4af7ae
  4af7d4:	eb 1e                	jmp    0x4af7f4
  4af7d6:	b3 01                	mov    bl,0x1
  4af7d8:	8a 87 ef bb 89 00    	mov    al,BYTE PTR [edi+0x89bbef]
  4af7de:	88 44 24 10          	mov    BYTE PTR [esp+0x10],al
  4af7e2:	eb 10                	jmp    0x4af7f4
  4af7e4:	66 8b 94 24 14 01 00 	mov    dx,WORD PTR [esp+0x114]
  4af7eb:	00 
  4af7ec:	66 8b b4 24 18 01 00 	mov    si,WORD PTR [esp+0x118]
  4af7f3:	00 
  4af7f4:	84 db                	test   bl,bl
  4af7f6:	75 3a                	jne    0x4af832
  4af7f8:	80 3d 86 bb 89 00 ff 	cmp    BYTE PTR ds:0x89bb86,0xff
  4af7ff:	74 29                	je     0x4af82a
  4af801:	56                   	push   esi
  4af802:	a0 86 bb 89 00       	mov    al,ds:0x89bb86
  4af807:	52                   	push   edx
  4af808:	50                   	push   eax
  4af809:	e8 d2 25 f8 ff       	call   0x431de0
  4af80e:	83 c4 0c             	add    esp,0xc
  4af811:	84 c0                	test   al,al
  4af813:	74 15                	je     0x4af82a
  4af815:	b3 01                	mov    bl,0x1
  4af817:	a0 86 bb 89 00       	mov    al,ds:0x89bb86
  4af81c:	c6 44 24 10 00       	mov    BYTE PTR [esp+0x10],0x0
  4af821:	50                   	push   eax
  4af822:	e8 69 23 f8 ff       	call   0x431b90
  4af827:	83 c4 04             	add    esp,0x4
  4af82a:	84 db                	test   bl,bl
  4af82c:	0f 84 22 02 00 00    	je     0x4afa54
  4af832:	6a 01                	push   0x1
  4af834:	6a 6a                	push   0x6a
  4af836:	6a 00                	push   0x0
  4af838:	e8 13 a8 fd ff       	call   0x48a050
  4af83d:	83 c4 0c             	add    esp,0xc
  4af840:	33 c0                	xor    eax,eax
  4af842:	8a 44 24 10          	mov    al,BYTE PTR [esp+0x10]
  4af846:	83 f8 03             	cmp    eax,0x3
  4af849:	0f 87 05 02 00 00    	ja     0x4afa54
  4af84f:	ff 24 85 60 fa 4a 00 	jmp    DWORD PTR [eax*4+0x4afa60]
  4af856:	c6 05 81 bb 89 00 00 	mov    BYTE PTR ds:0x89bb81,0x0
  4af85d:	c6 05 83 bb 89 00 01 	mov    BYTE PTR ds:0x89bb83,0x1
  4af864:	80 3d 86 bb 89 00 ff 	cmp    BYTE PTR ds:0x89bb86,0xff
  4af86b:	74 0e                	je     0x4af87b
  4af86d:	a0 86 bb 89 00       	mov    al,ds:0x89bb86
  4af872:	50                   	push   eax
  4af873:	e8 38 23 f8 ff       	call   0x431bb0
  4af878:	83 c4 04             	add    esp,0x4
  4af87b:	66 0f be 05 f0 c6 89 	movsx  ax,BYTE PTR ds:0x89c6f0
  4af882:	00 
  4af883:	6a 00                	push   0x0
  4af885:	50                   	push   eax
  4af886:	6a 0a                	push   0xa
  4af888:	e8 73 a6 fc ff       	call   0x479f00
  4af88d:	83 c4 0c             	add    esp,0xc
  4af890:	6a 10                	push   0x10
  4af892:	e8 29 f9 ff ff       	call   0x4af1c0
  4af897:	83 c4 04             	add    esp,0x4
  4af89a:	80 3d 87 bb 89 00 00 	cmp    BYTE PTR ds:0x89bb87,0x0
  4af8a1:	74 07                	je     0x4af8aa
  4af8a3:	c6 05 81 bb 89 00 04 	mov    BYTE PTR ds:0x89bb81,0x4
  4af8aa:	80 3d 83 bb 89 00 02 	cmp    BYTE PTR ds:0x89bb83,0x2
  4af8b1:	0f 85 9d 01 00 00    	jne    0x4afa54
  4af8b7:	c6 05 81 bb 89 00 00 	mov    BYTE PTR ds:0x89bb81,0x0
  4af8be:	6a 00                	push   0x0
  4af8c0:	6a 00                	push   0x0
  4af8c2:	68 9b 00 00 00       	push   0x9b
  4af8c7:	e8 b4 b2 ff ff       	call   0x4aab80
  4af8cc:	83 c4 0c             	add    esp,0xc
  4af8cf:	5d                   	pop    ebp
  4af8d0:	5f                   	pop    edi
  4af8d1:	5e                   	pop    esi
  4af8d2:	5b                   	pop    ebx
  4af8d3:	81 c4 00 01 00 00    	add    esp,0x100
  4af8d9:	c3                   	ret
  4af8da:	f6 05 61 c6 89 00 08 	test   BYTE PTR ds:0x89c661,0x8
  4af8e1:	0f 85 6d 01 00 00    	jne    0x4afa54
  4af8e7:	6a 00                	push   0x0
  4af8e9:	e8 e2 33 f9 ff       	call   0x442cd0
  4af8ee:	83 c4 04             	add    esp,0x4
  4af8f1:	84 c0                	test   al,al
  4af8f3:	74 14                	je     0x4af909
  4af8f5:	a1 34 2f 97 00       	mov    eax,ds:0x972f34
  4af8fa:	8b 0d 40 2f 97 00    	mov    ecx,DWORD PTR ds:0x972f40
  4af900:	50                   	push   eax
  4af901:	51                   	push   ecx
  4af902:	68 18 dc 5c 00       	push   0x5cdc18
  4af907:	eb 12                	jmp    0x4af91b
  4af909:	a1 38 2f 97 00       	mov    eax,ds:0x972f38
  4af90e:	8b 0d 40 2f 97 00    	mov    ecx,DWORD PTR ds:0x972f40
  4af914:	50                   	push   eax
  4af915:	51                   	push   ecx
  4af916:	68 08 dc 5c 00       	push   0x5cdc08
  4af91b:	8d 54 24 1c          	lea    edx,[esp+0x1c]
  4af91f:	52                   	push   edx
  4af920:	e8 9b bc 0a 00       	call   0x55b5c0
  4af925:	8d 44 24 20          	lea    eax,[esp+0x20]
  4af929:	83 c4 10             	add    esp,0x10
  4af92c:	6a 00                	push   0x0
  4af92e:	6a ff                	push   0xffffffff
  4af930:	6a 10                	push   0x10
  4af932:	50                   	push   eax
  4af933:	e8 e8 b0 fc ff       	call   0x47aa20
  4af938:	83 c4 10             	add    esp,0x10
  4af93b:	5d                   	pop    ebp
  4af93c:	5f                   	pop    edi
  4af93d:	5e                   	pop    esi
  4af93e:	5b                   	pop    ebx
  4af93f:	81 c4 00 01 00 00    	add    esp,0x100
  4af945:	c3                   	ret
  4af946:	c6 05 81 bb 89 00 00 	mov    BYTE PTR ds:0x89bb81,0x0
  4af94d:	c6 05 83 bb 89 00 02 	mov    BYTE PTR ds:0x89bb83,0x2
  4af954:	80 3d 86 bb 89 00 ff 	cmp    BYTE PTR ds:0x89bb86,0xff
  4af95b:	74 0e                	je     0x4af96b
  4af95d:	a0 86 bb 89 00       	mov    al,ds:0x89bb86
  4af962:	50                   	push   eax
  4af963:	e8 48 22 f8 ff       	call   0x431bb0
  4af968:	83 c4 04             	add    esp,0x4
  4af96b:	66 0f be 05 f0 c6 89 	movsx  ax,BYTE PTR ds:0x89c6f0
  4af972:	00 
  4af973:	6a 00                	push   0x0
  4af975:	50                   	push   eax
  4af976:	6a 0a                	push   0xa
  4af978:	e8 83 a5 fc ff       	call   0x479f00
  4af97d:	83 c4 0c             	add    esp,0xc
  4af980:	6a 10                	push   0x10
  4af982:	e8 39 f8 ff ff       	call   0x4af1c0
  4af987:	83 c4 04             	add    esp,0x4
  4af98a:	80 3d 87 bb 89 00 00 	cmp    BYTE PTR ds:0x89bb87,0x0
  4af991:	74 07                	je     0x4af99a
  4af993:	c6 05 81 bb 89 00 04 	mov    BYTE PTR ds:0x89bb81,0x4
  4af99a:	80 3d 83 bb 89 00 02 	cmp    BYTE PTR ds:0x89bb83,0x2
  4af9a1:	0f 85 ad 00 00 00    	jne    0x4afa54
  4af9a7:	c6 05 81 bb 89 00 00 	mov    BYTE PTR ds:0x89bb81,0x0
  4af9ae:	6a 00                	push   0x0
  4af9b0:	6a 00                	push   0x0
  4af9b2:	68 9b 00 00 00       	push   0x9b
  4af9b7:	e8 c4 b1 ff ff       	call   0x4aab80
  4af9bc:	83 c4 0c             	add    esp,0xc
  4af9bf:	5d                   	pop    ebp
  4af9c0:	5f                   	pop    edi
  4af9c1:	5e                   	pop    esi
  4af9c2:	5b                   	pop    ebx
  4af9c3:	81 c4 00 01 00 00    	add    esp,0x100
  4af9c9:	c3                   	ret
  4af9ca:	c6 05 81 bb 89 00 00 	mov    BYTE PTR ds:0x89bb81,0x0
  4af9d1:	c6 05 83 bb 89 00 03 	mov    BYTE PTR ds:0x89bb83,0x3
  4af9d8:	80 3d 86 bb 89 00 ff 	cmp    BYTE PTR ds:0x89bb86,0xff
  4af9df:	74 23                	je     0x4afa04
  4af9e1:	0f be 05 86 bb 89 00 	movsx  eax,BYTE PTR ds:0x89bb86
  4af9e8:	8d 0c 80             	lea    ecx,[eax+eax*4]
  4af9eb:	a0 86 bb 89 00       	mov    al,ds:0x89bb86
  4af9f0:	50                   	push   eax
  4af9f1:	81 8c c9 b3 3b 68 00 	or     DWORD PTR [ecx+ecx*8+0x683bb3],0x200
  4af9f8:	00 02 00 00 
  4af9fc:	e8 af 21 f8 ff       	call   0x431bb0
  4afa01:	83 c4 04             	add    esp,0x4
  4afa04:	66 0f be 05 f0 c6 89 	movsx  ax,BYTE PTR ds:0x89c6f0
  4afa0b:	00 
  4afa0c:	6a 00                	push   0x0
  4afa0e:	50                   	push   eax
  4afa0f:	6a 0a                	push   0xa
  4afa11:	e8 ea a4 fc ff       	call   0x479f00
  4afa16:	83 c4 0c             	add    esp,0xc
  4afa19:	6a 10                	push   0x10
  4afa1b:	e8 a0 f7 ff ff       	call   0x4af1c0
  4afa20:	83 c4 04             	add    esp,0x4
  4afa23:	80 3d 87 bb 89 00 00 	cmp    BYTE PTR ds:0x89bb87,0x0
  4afa2a:	74 07                	je     0x4afa33
  4afa2c:	c6 05 81 bb 89 00 04 	mov    BYTE PTR ds:0x89bb81,0x4
  4afa33:	80 3d 83 bb 89 00 02 	cmp    BYTE PTR ds:0x89bb83,0x2
  4afa3a:	75 18                	jne    0x4afa54
  4afa3c:	c6 05 81 bb 89 00 00 	mov    BYTE PTR ds:0x89bb81,0x0
  4afa43:	6a 00                	push   0x0
  4afa45:	6a 00                	push   0x0
  4afa47:	68 9b 00 00 00       	push   0x9b
  4afa4c:	e8 2f b1 ff ff       	call   0x4aab80
  4afa51:	83 c4 0c             	add    esp,0xc
  4afa54:	5d                   	pop    ebp
  4afa55:	5f                   	pop    edi
  4afa56:	5e                   	pop    esi
  4afa57:	5b                   	pop    ebx
  4afa58:	81 c4 00 01 00 00    	add    esp,0x100
  4afa5e:	c3                   	ret
  4afa5f:	90                   	nop
  4afa60:	56                   	push   esi
  4afa61:	f8                   	clc
  4afa62:	4a                   	dec    edx
  4afa63:	00 da                	add    dl,bl
  4afa65:	f8                   	clc
  4afa66:	4a                   	dec    edx
  4afa67:	00 46 f9             	add    BYTE PTR [esi-0x7],al
  4afa6a:	4a                   	dec    edx
  4afa6b:	00 ca                	add    dl,cl
  4afa6d:	f9                   	stc
  4afa6e:	4a                   	dec    edx
  4afa6f:	00 33                	add    BYTE PTR [ebx],dh
  4afa71:	c0 a0 81 bb 89 00 83 	shl    BYTE PTR [eax+0x89bb81],0x83
  4afa78:	f8                   	clc
  4afa79:	03 74 06 83          	add    esi,DWORD PTR [esi+eax*1-0x7d]
  4afa7d:	f8                   	clc
  4afa7e:	04 74                	add    al,0x74
  4afa80:	1b c3                	sbb    eax,ebx
  4afa82:	a0 71 d1 89 00       	mov    al,ds:0x89d171
  4afa87:	38 05 88 bb 89 00    	cmp    BYTE PTR ds:0x89bb88,al
  4afa8d:	7e 21                	jle    0x4afab0
  4afa8f:	c6 05 81 bb 89 00 02 	mov    BYTE PTR ds:0x89bb81,0x2
  4afa96:	a2 88 bb 89 00       	mov    ds:0x89bb88,al
  4afa9b:	c3                   	ret
  4afa9c:	33 c0                	xor    eax,eax
  4afa9e:	38 05 88 bb 89 00    	cmp    BYTE PTR ds:0x89bb88,al
  4afaa4:	7d 0a                	jge    0x4afab0
  4afaa6:	a2 88 bb 89 00       	mov    ds:0x89bb88,al
  4afaab:	a2 81 bb 89 00       	mov    ds:0x89bb81,al
  4afab0:	c3                   	ret
  4afab1:	cc                   	int3
  4afab2:	cc                   	int3
  4afab3:	cc                   	int3
  4afab4:	cc                   	int3
  4afab5:	cc                   	int3
  4afab6:	cc                   	int3
  4afab7:	cc                   	int3
  4afab8:	cc                   	int3
  4afab9:	cc                   	int3
  4afaba:	cc                   	int3
  4afabb:	cc                   	int3
  4afabc:	cc                   	int3
  4afabd:	cc                   	int3
  4afabe:	cc                   	int3
  4afabf:	cc                   	int3
  4afac0:	8b 4c 24 04          	mov    ecx,DWORD PTR [esp+0x4]
  4afac4:	ba af bb 89 00       	mov    edx,0x89bbaf
  4afac9:	c6 05 87 bb 89 00 01 	mov    BYTE PTR ds:0x89bb87,0x1
  4afad0:	c6 05 81 bb 89 00 03 	mov    BYTE PTR ds:0x89bb81,0x3
  4afad7:	8b 01                	mov    eax,DWORD PTR [ecx]
  4afad9:	89 02                	mov    DWORD PTR [edx],eax
  4afadb:	8b 41 04             	mov    eax,DWORD PTR [ecx+0x4]
  4afade:	89 42 04             	mov    DWORD PTR [edx+0x4],eax
  4afae1:	8b 41 08             	mov    eax,DWORD PTR [ecx+0x8]
  4afae4:	89 42 08             	mov    DWORD PTR [edx+0x8],eax
  4afae7:	8b 49 0c             	mov    ecx,DWORD PTR [ecx+0xc]
  4afaea:	c6 05 88 bb 89 00 00 	mov    BYTE PTR ds:0x89bb88,0x0
  4afaf1:	89 4a 0c             	mov    DWORD PTR [edx+0xc],ecx
  4afaf4:	c3                   	ret
  4afaf5:	cc                   	int3
  4afaf6:	cc                   	int3
  4afaf7:	cc                   	int3
  4afaf8:	cc                   	int3
  4afaf9:	cc                   	int3
  4afafa:	cc                   	int3
  4afafb:	cc                   	int3
  4afafc:	cc                   	int3
  4afafd:	cc                   	int3
  4afafe:	cc                   	int3
  4afaff:	cc                   	int3
  4afb00:	83 ec 20             	sub    esp,0x20
  4afb03:	80 3d 81 bb 89 00 00 	cmp    BYTE PTR ds:0x89bb81,0x0
  4afb0a:	53                   	push   ebx
  4afb0b:	56                   	push   esi
  4afb0c:	57                   	push   edi
  4afb0d:	55                   	push   ebp
  4afb0e:	0f 84 8e 03 00 00    	je     0x4afea2
  4afb14:	c6 05 84 bb 89 00 01 	mov    BYTE PTR ds:0x89bb84,0x1
  4afb1b:	0f be 1d f2 bb 89 00 	movsx  ebx,BYTE PTR ds:0x89bbf2
  4afb22:	e8 e9 36 fe ff       	call   0x493210
  4afb27:	85 c0                	test   eax,eax
  4afb29:	74 19                	je     0x4afb44
  4afb2b:	33 c0                	xor    eax,eax
  4afb2d:	a0 de 28 89 00       	mov    al,ds:0x8928de
  4afb32:	8b 0c 85 d0 cb 87 00 	mov    ecx,DWORD PTR [eax*4+0x87cbd0]
  4afb39:	51                   	push   ecx
  4afb3a:	e8 01 20 fa ff       	call   0x451b40
  4afb3f:	83 c4 04             	add    esp,0x4
  4afb42:	eb 1c                	jmp    0x4afb60
  4afb44:	33 c0                	xor    eax,eax
  4afb46:	a0 de 28 89 00       	mov    al,ds:0x8928de
  4afb4b:	8b 0c 85 d0 cb 87 00 	mov    ecx,DWORD PTR [eax*4+0x87cbd0]
  4afb52:	51                   	push   ecx
  4afb53:	68 88 16 59 00       	push   0x591688
  4afb58:	e8 d3 71 06 00       	call   0x516d30
  4afb5d:	83 c4 08             	add    esp,0x8
  4afb60:	8d 44 24 20          	lea    eax,[esp+0x20]
  4afb64:	8d 4c 24 18          	lea    ecx,[esp+0x18]
  4afb68:	0f bf 15 89 bb 89 00 	movsx  edx,WORD PTR ds:0x89bb89
  4afb6f:	50                   	push   eax
  4afb70:	51                   	push   ecx
  4afb71:	52                   	push   edx
  4afb72:	e8 69 03 00 00       	call   0x4afee0
  4afb77:	83 c4 0c             	add    esp,0xc
  4afb7a:	e8 91 36 fe ff       	call   0x493210
  4afb7f:	6a 41                	push   0x41
  4afb81:	85 c0                	test   eax,eax
  4afb83:	74 07                	je     0x4afb8c
  4afb85:	e8 46 2c fa ff       	call   0x4527d0
  4afb8a:	eb 05                	jmp    0x4afb91
  4afb8c:	e8 7f 7f 07 00       	call   0x527b10
  4afb91:	c1 e0 05             	shl    eax,0x5
  4afb94:	83 c4 04             	add    esp,0x4
  4afb97:	99                   	cdq
  4afb98:	83 e2 0f             	and    edx,0xf
  4afb9b:	03 c2                	add    eax,edx
  4afb9d:	c1 f8 04             	sar    eax,0x4
  4afba0:	89 44 24 10          	mov    DWORD PTR [esp+0x10],eax
  4afba4:	e8 67 36 fe ff       	call   0x493210
  4afba9:	6a 41                	push   0x41
  4afbab:	85 c0                	test   eax,eax
  4afbad:	74 07                	je     0x4afbb6
  4afbaf:	e8 3c 2c fa ff       	call   0x4527f0
  4afbb4:	eb 05                	jmp    0x4afbbb
  4afbb6:	e8 85 7f 07 00       	call   0x527b40
  4afbbb:	83 c4 04             	add    esp,0x4
  4afbbe:	8d 0c 80             	lea    ecx,[eax+eax*4]
  4afbc1:	8d 14 48             	lea    edx,[eax+ecx*2]
  4afbc4:	33 f6                	xor    esi,esi
  4afbc6:	8d 04 55 00 00 00 00 	lea    eax,[edx*2+0x0]
  4afbcd:	99                   	cdq
  4afbce:	83 e2 0f             	and    edx,0xf
  4afbd1:	03 c2                	add    eax,edx
  4afbd3:	c1 f8 04             	sar    eax,0x4
  4afbd6:	85 db                	test   ebx,ebx
  4afbd8:	89 44 24 14          	mov    DWORD PTR [esp+0x14],eax
  4afbdc:	7e 5a                	jle    0x4afc38
  4afbde:	33 ed                	xor    ebp,ebp
  4afbe0:	8d 7c 24 24          	lea    edi,[esp+0x24]
  4afbe4:	8b 44 24 14          	mov    eax,DWORD PTR [esp+0x14]
  4afbe8:	8b cb                	mov    ecx,ebx
  4afbea:	f3 ab                	rep stos DWORD PTR es:[edi],eax
  4afbec:	0f be 86 ef bb 89 00 	movsx  eax,BYTE PTR [esi+0x89bbef]
  4afbf3:	83 f8 01             	cmp    eax,0x1
  4afbf6:	74 11                	je     0x4afc09
  4afbf8:	83 f8 02             	cmp    eax,0x2
  4afbfb:	74 13                	je     0x4afc10
  4afbfd:	83 f8 03             	cmp    eax,0x3
  4afc00:	74 15                	je     0x4afc17
  4afc02:	a1 34 2f 97 00       	mov    eax,ds:0x972f34
  4afc07:	eb 13                	jmp    0x4afc1c
  4afc09:	a1 00 30 97 00       	mov    eax,ds:0x973000
  4afc0e:	eb 0c                	jmp    0x4afc1c
  4afc10:	a1 04 30 97 00       	mov    eax,ds:0x973004
  4afc15:	eb 05                	jmp    0x4afc1c
  4afc17:	a1 b4 30 97 00       	mov    eax,ds:0x9730b4
  4afc1c:	50                   	push   eax
  4afc1d:	83 c5 04             	add    ebp,0x4
  4afc20:	46                   	inc    esi
  4afc21:	e8 0a aa fe ff       	call   0x49a630
  4afc26:	8b 4c 24 14          	mov    ecx,DWORD PTR [esp+0x14]
  4afc2a:	83 c4 04             	add    esp,0x4
  4afc2d:	3b de                	cmp    ebx,esi
  4afc2f:	8d 04 48             	lea    eax,[eax+ecx*2]
  4afc32:	89 44 2c 20          	mov    DWORD PTR [esp+ebp*1+0x20],eax
  4afc36:	7f b4                	jg     0x4afbec
  4afc38:	e8 d3 35 fe ff       	call   0x493210
  4afc3d:	6a 41                	push   0x41
  4afc3f:	85 c0                	test   eax,eax
  4afc41:	74 07                	je     0x4afc4a
  4afc43:	e8 88 2b fa ff       	call   0x4527d0
  4afc48:	eb 05                	jmp    0x4afc4f
  4afc4a:	e8 c1 7e 07 00       	call   0x527b10
  4afc4f:	c1 e0 04             	shl    eax,0x4
  4afc52:	83 c4 04             	add    esp,0x4
  4afc55:	33 ff                	xor    edi,edi
  4afc57:	8d 04 40             	lea    eax,[eax+eax*2]
  4afc5a:	99                   	cdq
  4afc5b:	83 e2 0f             	and    edx,0xf
  4afc5e:	03 c2                	add    eax,edx
  4afc60:	c1 f8 04             	sar    eax,0x4
  4afc63:	85 db                	test   ebx,ebx
  4afc65:	89 44 24 1c          	mov    DWORD PTR [esp+0x1c],eax
  4afc69:	7e 0e                	jle    0x4afc79
  4afc6b:	8d 44 24 24          	lea    eax,[esp+0x24]
  4afc6f:	8b cb                	mov    ecx,ebx
  4afc71:	03 38                	add    edi,DWORD PTR [eax]
  4afc73:	83 c0 04             	add    eax,0x4
  4afc76:	49                   	dec    ecx
  4afc77:	75 f8                	jne    0x4afc71
  4afc79:	8d 6b ff             	lea    ebp,[ebx-0x1]
  4afc7c:	8b 44 24 1c          	mov    eax,DWORD PTR [esp+0x1c]
  4afc80:	0f af c5             	imul   eax,ebp
  4afc83:	03 f8                	add    edi,eax
  4afc85:	e8 86 35 fe ff       	call   0x493210
  4afc8a:	6a 41                	push   0x41
  4afc8c:	85 c0                	test   eax,eax
  4afc8e:	74 07                	je     0x4afc97
  4afc90:	e8 3b 2b fa ff       	call   0x4527d0
  4afc95:	eb 05                	jmp    0x4afc9c
  4afc97:	e8 74 7e 07 00       	call   0x527b10
  4afc9c:	83 c4 04             	add    esp,0x4
  4afc9f:	8d 04 40             	lea    eax,[eax+eax*2]
  4afca2:	c1 e0 03             	shl    eax,0x3
  4afca5:	33 f6                	xor    esi,esi
  4afca7:	99                   	cdq
  4afca8:	83 e2 0f             	and    edx,0xf
  4afcab:	33 c9                	xor    ecx,ecx
  4afcad:	03 c2                	add    eax,edx
  4afcaf:	8b 54 24 18          	mov    edx,DWORD PTR [esp+0x18]
  4afcb3:	c1 f8 04             	sar    eax,0x4
  4afcb6:	3b fa                	cmp    edi,edx
  4afcb8:	89 44 24 10          	mov    DWORD PTR [esp+0x10],eax
  4afcbc:	a1 14 df 59 00       	mov    eax,ds:0x59df14
  4afcc1:	66 8b b0 b4 2d 00 00 	mov    si,WORD PTR [eax+0x2db4]
  4afcc8:	66 8b 88 b6 2d 00 00 	mov    cx,WORD PTR [eax+0x2db6]
  4afccf:	7e 02                	jle    0x4afcd3
  4afcd1:	8b d7                	mov    edx,edi
  4afcd3:	8b 44 24 10          	mov    eax,DWORD PTR [esp+0x10]
  4afcd7:	03 c0                	add    eax,eax
  4afcd9:	03 d0                	add    edx,eax
  4afcdb:	03 c6                	add    eax,esi
  4afcdd:	8d 44 10 ff          	lea    eax,[eax+edx*1-0x1]
  4afce1:	99                   	cdq
  4afce2:	f7 fe                	idiv   esi
  4afce4:	8b f8                	mov    edi,eax
  4afce6:	8b 54 24 10          	mov    edx,DWORD PTR [esp+0x10]
  4afcea:	8d 04 92             	lea    eax,[edx+edx*4]
  4afced:	8b 54 24 20          	mov    edx,DWORD PTR [esp+0x20]
  4afcf1:	66 89 3d 8b bb 89 00 	mov    WORD PTR ds:0x89bb8b,di
  4afcf8:	03 c1                	add    eax,ecx
  4afcfa:	03 44 24 14          	add    eax,DWORD PTR [esp+0x14]
  4afcfe:	0f af f7             	imul   esi,edi
  4afd01:	8d 44 10 ff          	lea    eax,[eax+edx*1-0x1]
  4afd05:	99                   	cdq
  4afd06:	f7 f9                	idiv   ecx
  4afd08:	0f af c8             	imul   ecx,eax
  4afd0b:	66 a3 8d bb 89 00    	mov    ds:0x89bb8d,ax
  4afd11:	83 fb 01             	cmp    ebx,0x1
  4afd14:	7e 21                	jle    0x4afd37
  4afd16:	33 d2                	xor    edx,edx
  4afd18:	85 db                	test   ebx,ebx
  4afd1a:	7e 0e                	jle    0x4afd2a
  4afd1c:	8d 7c 24 24          	lea    edi,[esp+0x24]
  4afd20:	8b c3                	mov    eax,ebx
  4afd22:	03 17                	add    edx,DWORD PTR [edi]
  4afd24:	83 c7 04             	add    edi,0x4
  4afd27:	48                   	dec    eax
  4afd28:	75 f8                	jne    0x4afd22
  4afd2a:	8b 44 24 18          	mov    eax,DWORD PTR [esp+0x18]
  4afd2e:	2b c2                	sub    eax,edx
  4afd30:	99                   	cdq
  4afd31:	f7 fd                	idiv   ebp
  4afd33:	89 44 24 1c          	mov    DWORD PTR [esp+0x1c],eax
  4afd37:	0f bf 05 2a f0 88 00 	movsx  eax,WORD PTR ds:0x88f02a
  4afd3e:	2b c6                	sub    eax,esi
  4afd40:	99                   	cdq
  4afd41:	2b c2                	sub    eax,edx
  4afd43:	c1 f8 01             	sar    eax,0x1
  4afd46:	0f bf 15 26 f0 88 00 	movsx  edx,WORD PTR ds:0x88f026
  4afd4d:	8d 3c 02             	lea    edi,[edx+eax*1]
  4afd50:	0f bf 05 2c f0 88 00 	movsx  eax,WORD PTR ds:0x88f02c
  4afd57:	99                   	cdq
  4afd58:	83 e2 1f             	and    edx,0x1f
  4afd5b:	03 c2                	add    eax,edx
  4afd5d:	c1 f8 05             	sar    eax,0x5
  4afd60:	0f bf 15 28 f0 88 00 	movsx  edx,WORD PTR ds:0x88f028
  4afd67:	0f bf c0             	movsx  eax,ax
  4afd6a:	03 c2                	add    eax,edx
  4afd6c:	a3 93 bb 89 00       	mov    ds:0x89bb93,eax
  4afd71:	03 c1                	add    eax,ecx
  4afd73:	8d 0c 3e             	lea    ecx,[esi+edi*1]
  4afd76:	a3 9b bb 89 00       	mov    ds:0x89bb9b,eax
  4afd7b:	8b c6                	mov    eax,esi
  4afd7d:	89 3d 8f bb 89 00    	mov    DWORD PTR ds:0x89bb8f,edi
  4afd83:	89 0d 97 bb 89 00    	mov    DWORD PTR ds:0x89bb97,ecx
  4afd89:	2b 44 24 18          	sub    eax,DWORD PTR [esp+0x18]
  4afd8d:	99                   	cdq
  4afd8e:	2b c2                	sub    eax,edx
  4afd90:	c1 f8 01             	sar    eax,0x1
  4afd93:	03 f8                	add    edi,eax
  4afd95:	e8 76 34 fe ff       	call   0x493210
  4afd9a:	6a 41                	push   0x41
  4afd9c:	85 c0                	test   eax,eax
  4afd9e:	74 07                	je     0x4afda7
  4afda0:	e8 4b 2a fa ff       	call   0x4527f0
  4afda5:	eb 05                	jmp    0x4afdac
  4afda7:	e8 94 7d 07 00       	call   0x527b40
  4afdac:	83 c4 04             	add    esp,0x4
  4afdaf:	8d 0c 80             	lea    ecx,[eax+eax*4]
  4afdb2:	8d 14 48             	lea    edx,[eax+ecx*2]
  4afdb5:	8d 04 55 00 00 00 00 	lea    eax,[edx*2+0x0]
  4afdbc:	8b 4c 24 20          	mov    ecx,DWORD PTR [esp+0x20]
  4afdc0:	99                   	cdq
  4afdc1:	83 e2 0f             	and    edx,0xf
  4afdc4:	03 c2                	add    eax,edx
  4afdc6:	c1 f8 04             	sar    eax,0x4
  4afdc9:	03 05 93 bb 89 00    	add    eax,DWORD PTR ds:0x89bb93
  4afdcf:	03 c8                	add    ecx,eax
  4afdd1:	a3 a3 bb 89 00       	mov    ds:0x89bba3,eax
  4afdd6:	89 0d ab bb 89 00    	mov    DWORD PTR ds:0x89bbab,ecx
  4afddc:	8b 44 24 18          	mov    eax,DWORD PTR [esp+0x18]
  4afde0:	03 c7                	add    eax,edi
  4afde2:	89 3d 9f bb 89 00    	mov    DWORD PTR ds:0x89bb9f,edi
  4afde8:	a3 a7 bb 89 00       	mov    ds:0x89bba7,eax
  4afded:	e8 1e 34 fe ff       	call   0x493210
  4afdf2:	8b 35 9b bb 89 00    	mov    esi,DWORD PTR ds:0x89bb9b
  4afdf8:	6a 41                	push   0x41
  4afdfa:	85 c0                	test   eax,eax
  4afdfc:	74 07                	je     0x4afe05
  4afdfe:	e8 ed 29 fa ff       	call   0x4527f0
  4afe03:	eb 05                	jmp    0x4afe0a
  4afe05:	e8 36 7d 07 00       	call   0x527b40
  4afe0a:	83 c4 04             	add    esp,0x4
  4afe0d:	8d 04 40             	lea    eax,[eax+eax*2]
  4afe10:	c1 e0 02             	shl    eax,0x2
  4afe13:	99                   	cdq
  4afe14:	83 e2 0f             	and    edx,0xf
  4afe17:	03 c2                	add    eax,edx
  4afe19:	c1 f8 04             	sar    eax,0x4
  4afe1c:	2b f0                	sub    esi,eax
  4afe1e:	2b 74 24 14          	sub    esi,DWORD PTR [esp+0x14]
  4afe22:	85 db                	test   ebx,ebx
  4afe24:	7e 18                	jle    0x4afe3e
  4afe26:	b9 c3 bb 89 00       	mov    ecx,0x89bbc3
  4afe2b:	8b 54 24 14          	mov    edx,DWORD PTR [esp+0x14]
  4afe2f:	03 d6                	add    edx,esi
  4afe31:	8b c3                	mov    eax,ebx
  4afe33:	89 31                	mov    DWORD PTR [ecx],esi
  4afe35:	83 c1 10             	add    ecx,0x10
  4afe38:	48                   	dec    eax
  4afe39:	89 51 f8             	mov    DWORD PTR [ecx-0x8],edx
  4afe3c:	75 f5                	jne    0x4afe33
  4afe3e:	83 fb 01             	cmp    ebx,0x1
  4afe41:	7e 4e                	jle    0x4afe91
  4afe43:	85 ed                	test   ebp,ebp
  4afe45:	7e 23                	jle    0x4afe6a
  4afe47:	8d 4c 24 24          	lea    ecx,[esp+0x24]
  4afe4b:	b8 bf bb 89 00       	mov    eax,0x89bbbf
  4afe50:	89 38                	mov    DWORD PTR [eax],edi
  4afe52:	83 c1 04             	add    ecx,0x4
  4afe55:	83 c0 10             	add    eax,0x10
  4afe58:	8b 51 fc             	mov    edx,DWORD PTR [ecx-0x4]
  4afe5b:	8d 34 3a             	lea    esi,[edx+edi*1]
  4afe5e:	03 54 24 1c          	add    edx,DWORD PTR [esp+0x1c]
  4afe62:	03 fa                	add    edi,edx
  4afe64:	89 70 f8             	mov    DWORD PTR [eax-0x8],esi
  4afe67:	4d                   	dec    ebp
  4afe68:	75 e6                	jne    0x4afe50
  4afe6a:	8b cb                	mov    ecx,ebx
  4afe6c:	a1 a7 bb 89 00       	mov    eax,ds:0x89bba7
  4afe71:	c1 e1 04             	shl    ecx,0x4
  4afe74:	89 81 b7 bb 89 00    	mov    DWORD PTR [ecx+0x89bbb7],eax
  4afe7a:	a1 a7 bb 89 00       	mov    eax,ds:0x89bba7
  4afe7f:	2b 44 9c 20          	sub    eax,DWORD PTR [esp+ebx*4+0x20]
  4afe83:	5d                   	pop    ebp
  4afe84:	5f                   	pop    edi
  4afe85:	89 81 af bb 89 00    	mov    DWORD PTR [ecx+0x89bbaf],eax
  4afe8b:	5e                   	pop    esi
  4afe8c:	5b                   	pop    ebx
  4afe8d:	83 c4 20             	add    esp,0x20
  4afe90:	c3                   	ret
  4afe91:	89 3d bf bb 89 00    	mov    DWORD PTR ds:0x89bbbf,edi
  4afe97:	8b 44 24 24          	mov    eax,DWORD PTR [esp+0x24]
  4afe9b:	03 c7                	add    eax,edi
  4afe9d:	a3 c7 bb 89 00       	mov    ds:0x89bbc7,eax
  4afea2:	5d                   	pop    ebp
  4afea3:	5f                   	pop    edi
  4afea4:	5e                   	pop    esi
  4afea5:	5b                   	pop    ebx
  4afea6:	83 c4 20             	add    esp,0x20
  4afea9:	c3                   	ret
  4afeaa:	cc                   	int3
  4afeab:	cc                   	int3
  4afeac:	cc                   	int3
  4afead:	cc                   	int3
  4afeae:	cc                   	int3
  4afeaf:	cc                   	int3
  4afeb0:	0f be 44 24 04       	movsx  eax,BYTE PTR [esp+0x4]
  4afeb5:	83 f8 01             	cmp    eax,0x1
  4afeb8:	74 10                	je     0x4afeca
  4afeba:	83 f8 02             	cmp    eax,0x2
  4afebd:	74 11                	je     0x4afed0
  4afebf:	83 f8 03             	cmp    eax,0x3
  4afec2:	74 12                	je     0x4afed6
  4afec4:	a1 34 2f 97 00       	mov    eax,ds:0x972f34
  4afec9:	c3                   	ret
  4afeca:	a1 00 30 97 00       	mov    eax,ds:0x973000
  4afecf:	c3                   	ret
  4afed0:	a1 04 30 97 00       	mov    eax,ds:0x973004
  4afed5:	c3                   	ret
  4afed6:	a1 b4 30 97 00       	mov    eax,ds:0x9730b4
  4afedb:	c3                   	ret
  4afedc:	cc                   	int3
  4afedd:	cc                   	int3
  4afede:	cc                   	int3
  4afedf:	cc                   	int3
  4afee0:	81 ec 0c 04 00 00    	sub    esp,0x40c
  4afee6:	53                   	push   ebx
  4afee7:	56                   	push   esi
  4afee8:	57                   	push   edi
  4afee9:	55                   	push   ebp
  4afeea:	0f bf 35 28 f0 88 00 	movsx  esi,WORD PTR ds:0x88f028
  4afef1:	0f bf 3d 2a f0 88 00 	movsx  edi,WORD PTR ds:0x88f02a
  4afef8:	8b cf                	mov    ecx,edi
  4afefa:	8d 04 7f             	lea    eax,[edi+edi*2]
  4afefd:	c1 e0 02             	shl    eax,0x2
  4aff00:	99                   	cdq
  4aff01:	83 e2 1f             	and    edx,0x1f
  4aff04:	c7 44 24 10 00 00 00 	mov    DWORD PTR [esp+0x10],0x0
  4aff0b:	00 
  4aff0c:	03 c2                	add    eax,edx
  4aff0e:	0f bf 15 89 bb 89 00 	movsx  edx,WORD PTR ds:0x89bb89
  4aff15:	c1 f8 05             	sar    eax,0x5
  4aff18:	8b 1c 95 a8 2b 97 00 	mov    ebx,DWORD PTR [edx*4+0x972ba8]
  4aff1f:	2b c8                	sub    ecx,eax
  4aff21:	0f bf 05 2c f0 88 00 	movsx  eax,WORD PTR ds:0x88f02c
  4aff28:	99                   	cdq
  4aff29:	83 e2 1f             	and    edx,0x1f
  4aff2c:	89 4c 24 14          	mov    DWORD PTR [esp+0x14],ecx
  4aff30:	03 c2                	add    eax,edx
  4aff32:	c1 f8 05             	sar    eax,0x5
  4aff35:	0f bf c0             	movsx  eax,ax
  4aff38:	8d 2c 30             	lea    ebp,[eax+esi*1]
  4aff3b:	e8 d0 32 fe ff       	call   0x493210
  4aff40:	6a 41                	push   0x41
  4aff42:	85 c0                	test   eax,eax
  4aff44:	74 07                	je     0x4aff4d
  4aff46:	e8 a5 28 fa ff       	call   0x4527f0
  4aff4b:	eb 05                	jmp    0x4aff52
  4aff4d:	e8 ee 7b 07 00       	call   0x527b40
  4aff52:	c1 e0 02             	shl    eax,0x2
  4aff55:	83 c4 04             	add    esp,0x4
  4aff58:	2b f0                	sub    esi,eax
  4aff5a:	03 f7                	add    esi,edi
  4aff5c:	8b fb                	mov    edi,ebx
  4aff5e:	85 db                	test   ebx,ebx
  4aff60:	74 43                	je     0x4affa5
  4aff62:	3b f5                	cmp    esi,ebp
  4aff64:	7e 3f                	jle    0x4affa5
  4aff66:	8d 44 24 18          	lea    eax,[esp+0x18]
  4aff6a:	68 00 02 00 00       	push   0x200
  4aff6f:	8b 54 24 18          	mov    edx,DWORD PTR [esp+0x18]
  4aff73:	50                   	push   eax
  4aff74:	52                   	push   edx
  4aff75:	57                   	push   edi
  4aff76:	53                   	push   ebx
  4aff77:	e8 94 ec fa ff       	call   0x45ec10
  4aff7c:	83 c4 14             	add    esp,0x14
  4aff7f:	8b f8                	mov    edi,eax
  4aff81:	e8 8a 32 fe ff       	call   0x493210
  4aff86:	6a 41                	push   0x41
  4aff88:	85 c0                	test   eax,eax
  4aff8a:	74 07                	je     0x4aff93
  4aff8c:	e8 5f 28 fa ff       	call   0x4527f0
  4aff91:	eb 05                	jmp    0x4aff98
  4aff93:	e8 a8 7b 07 00       	call   0x527b40
  4aff98:	ff 44 24 14          	inc    DWORD PTR [esp+0x14]
  4aff9c:	83 c4 04             	add    esp,0x4
  4aff9f:	03 e8                	add    ebp,eax
  4affa1:	85 ff                	test   edi,edi
  4affa3:	75 bd                	jne    0x4aff62
  4affa5:	e8 66 32 fe ff       	call   0x493210
  4affaa:	6a 41                	push   0x41
  4affac:	85 c0                	test   eax,eax
  4affae:	74 07                	je     0x4affb7
  4affb0:	e8 3b 28 fa ff       	call   0x4527f0
  4affb5:	eb 05                	jmp    0x4affbc
  4affb7:	e8 84 7b 07 00       	call   0x527b40
  4affbc:	8b 8c 24 28 04 00 00 	mov    ecx,DWORD PTR [esp+0x428]
  4affc3:	8b 54 24 18          	mov    edx,DWORD PTR [esp+0x18]
  4affc7:	8b 9c 24 2c 04 00 00 	mov    ebx,DWORD PTR [esp+0x42c]
  4affce:	83 c4 04             	add    esp,0x4
  4affd1:	0f af 44 24 10       	imul   eax,DWORD PTR [esp+0x10]
  4affd6:	5d                   	pop    ebp
  4affd7:	89 11                	mov    DWORD PTR [ecx],edx
  4affd9:	5f                   	pop    edi
  4affda:	89 03                	mov    DWORD PTR [ebx],eax
  4affdc:	5e                   	pop    esi
  4affdd:	5b                   	pop    ebx
  4affde:	81 c4 0c 04 00 00    	add    esp,0x40c
  4affe4:	c3                   	ret
