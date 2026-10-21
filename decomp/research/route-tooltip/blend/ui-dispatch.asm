
/workspace/scratch/69fd8163d94e/populous-original-inputs-20261020/game/d3dpoptb.exe:     file format pei-i386


Disassembly of section .text:

0044ac00 <.text+0x49c00>:
  44ac00:	83 ec 10             	sub    esp,0x10
  44ac03:	53                   	push   ebx
  44ac04:	56                   	push   esi
  44ac05:	83 3d 08 45 68 00 01 	cmp    DWORD PTR ds:0x684508,0x1
  44ac0c:	66 be 01 00          	mov    si,0x1
  44ac10:	57                   	push   edi
  44ac11:	55                   	push   ebp
  44ac12:	0f 8e 2e 02 00 00    	jle    0x44ae46
  44ac18:	33 db                	xor    ebx,ebx
  44ac1a:	0f bf c6             	movsx  eax,si
  44ac1d:	8d 0c 40             	lea    ecx,[eax+eax*2]
  44ac20:	0f bf 04 4d 20 42 68 	movsx  eax,WORD PTR [ecx*2+0x684220]
  44ac27:	00 
  44ac28:	8b c8                	mov    ecx,eax
  44ac2a:	c1 e0 06             	shl    eax,0x6
  44ac2d:	2b c1                	sub    eax,ecx
  44ac2f:	2b c1                	sub    eax,ecx
  44ac31:	8d b8 5e 42 68 00    	lea    edi,[eax+0x68425e]
  44ac37:	8b 80 8c 42 68 00    	mov    eax,DWORD PTR [eax+0x68428c]
  44ac3d:	85 c0                	test   eax,eax
  44ac3f:	74 4e                	je     0x44ac8f
  44ac41:	83 f8 01             	cmp    eax,0x1
  44ac44:	0f 85 bc 01 00 00    	jne    0x44ae06
  44ac4a:	66 8b 47 04          	mov    ax,WORD PTR [edi+0x4]
  44ac4e:	66 85 c0             	test   ax,ax
  44ac51:	74 36                	je     0x44ac89
  44ac53:	66 48                	dec    ax
  44ac55:	66 89 47 04          	mov    WORD PTR [edi+0x4],ax
  44ac59:	75 34                	jne    0x44ac8f
  44ac5b:	0f bf 47 3a          	movsx  eax,WORD PTR [edi+0x3a]
  44ac5f:	8b c8                	mov    ecx,eax
  44ac61:	c1 e0 06             	shl    eax,0x6
  44ac64:	2b c1                	sub    eax,ecx
  44ac66:	2b c1                	sub    eax,ecx
  44ac68:	66 8b 80 84 d0 5c 00 	mov    ax,WORD PTR [eax+0x5cd084]
  44ac6f:	66 85 c0             	test   ax,ax
  44ac72:	66 89 47 04          	mov    WORD PTR [edi+0x4],ax
  44ac76:	75 06                	jne    0x44ac7e
  44ac78:	66 c7 47 04 01 00    	mov    WORD PTR [edi+0x4],0x1
  44ac7e:	c7 47 2e 02 00 00 00 	mov    DWORD PTR [edi+0x2e],0x2
  44ac85:	b0 01                	mov    al,0x1
  44ac87:	eb 08                	jmp    0x44ac91
  44ac89:	66 c7 47 04 01 00    	mov    WORD PTR [edi+0x4],0x1
  44ac8f:	32 c0                	xor    al,al
  44ac91:	3c ff                	cmp    al,0xff
  44ac93:	0f 85 9c 01 00 00    	jne    0x44ae35
  44ac99:	39 5f 2e             	cmp    DWORD PTR [edi+0x2e],ebx
  44ac9c:	0f 84 93 01 00 00    	je     0x44ae35
  44aca2:	89 5f 2e             	mov    DWORD PTR [edi+0x2e],ebx
  44aca5:	0f bf 47 3c          	movsx  eax,WORD PTR [edi+0x3c]
  44aca9:	8b c8                	mov    ecx,eax
  44acab:	c1 e0 03             	shl    eax,0x3
  44acae:	2b c1                	sub    eax,ecx
  44acb0:	03 c0                	add    eax,eax
  44acb2:	8d 84 c1 2c 45 68 00 	lea    eax,[ecx+eax*8+0x68452c]
  44acb9:	3d 2c 45 68 00       	cmp    eax,0x68452c
  44acbe:	74 23                	je     0x44ace3
  44acc0:	39 58 04             	cmp    DWORD PTR [eax+0x4],ebx
  44acc3:	74 03                	je     0x44acc8
  44acc5:	89 58 04             	mov    DWORD PTR [eax+0x4],ebx
  44acc8:	0f bf 48 6d          	movsx  ecx,WORD PTR [eax+0x6d]
  44accc:	8b c1                	mov    eax,ecx
  44acce:	c1 e1 03             	shl    ecx,0x3
  44acd1:	2b c8                	sub    ecx,eax
  44acd3:	03 c9                	add    ecx,ecx
  44acd5:	8d 84 c8 2c 45 68 00 	lea    eax,[eax+ecx*8+0x68452c]
  44acdc:	3d 2c 45 68 00       	cmp    eax,0x68452c
  44ace1:	75 dd                	jne    0x44acc0
  44ace3:	8b 07                	mov    eax,DWORD PTR [edi]
  44ace5:	50                   	push   eax
  44ace6:	e8 35 19 00 00       	call   0x44c620
  44aceb:	83 c4 04             	add    esp,0x4
  44acee:	66 85 c0             	test   ax,ax
  44acf1:	74 64                	je     0x44ad57
  44acf3:	0f bf d0             	movsx  edx,ax
  44acf6:	8b 0d 08 45 68 00    	mov    ecx,DWORD PTR ds:0x684508
  44acfc:	49                   	dec    ecx
  44acfd:	3b ca                	cmp    ecx,edx
  44acff:	7e 31                	jle    0x44ad32
  44ad01:	0f bf c8             	movsx  ecx,ax
  44ad04:	66 40                	inc    ax
  44ad06:	8d 0c 49             	lea    ecx,[ecx+ecx*2]
  44ad09:	03 c9                	add    ecx,ecx
  44ad0b:	8d 91 22 42 68 00    	lea    edx,[ecx+0x684222]
  44ad11:	8d a9 1c 42 68 00    	lea    ebp,[ecx+0x68421c]
  44ad17:	8b 0a                	mov    ecx,DWORD PTR [edx]
  44ad19:	89 4d 00             	mov    DWORD PTR [ebp+0x0],ecx
  44ad1c:	66 8b 52 04          	mov    dx,WORD PTR [edx+0x4]
  44ad20:	66 89 55 04          	mov    WORD PTR [ebp+0x4],dx
  44ad24:	0f bf d0             	movsx  edx,ax
  44ad27:	8b 0d 08 45 68 00    	mov    ecx,DWORD PTR ds:0x684508
  44ad2d:	49                   	dec    ecx
  44ad2e:	3b ca                	cmp    ecx,edx
  44ad30:	7f cf                	jg     0x44ad01
  44ad32:	ff 0d 08 45 68 00    	dec    DWORD PTR ds:0x684508
  44ad38:	a1 08 45 68 00       	mov    eax,ds:0x684508
  44ad3d:	8d 0c 40             	lea    ecx,[eax+eax*2]
  44ad40:	89 1c 4d 1c 42 68 00 	mov    DWORD PTR [ecx*2+0x68421c],ebx
  44ad47:	a1 08 45 68 00       	mov    eax,ds:0x684508
  44ad4c:	8d 0c 40             	lea    ecx,[eax+eax*2]
  44ad4f:	66 89 1c 4d 20 42 68 	mov    WORD PTR [ecx*2+0x684220],bx
  44ad56:	00 
  44ad57:	b9 01 00 00 00       	mov    ecx,0x1
  44ad5c:	39 0d 08 45 68 00    	cmp    DWORD PTR ds:0x684508,ecx
  44ad62:	7c 39                	jl     0x44ad9d
  44ad64:	ba 26 42 68 00       	mov    edx,0x684226
  44ad69:	0f bf 02             	movsx  eax,WORD PTR [edx]
  44ad6c:	8b e8                	mov    ebp,eax
  44ad6e:	c1 e0 06             	shl    eax,0x6
  44ad71:	2b c5                	sub    eax,ebp
  44ad73:	2b c5                	sub    eax,ebp
  44ad75:	05 5e 42 68 00       	add    eax,0x68425e
  44ad7a:	8b 68 2e             	mov    ebp,DWORD PTR [eax+0x2e]
  44ad7d:	83 fd 02             	cmp    ebp,0x2
  44ad80:	74 05                	je     0x44ad87
  44ad82:	83 fd 01             	cmp    ebp,0x1
  44ad85:	75 0a                	jne    0x44ad91
  44ad87:	66 8b 6f 38          	mov    bp,WORD PTR [edi+0x38]
  44ad8b:	66 39 68 36          	cmp    WORD PTR [eax+0x36],bp
  44ad8f:	74 0f                	je     0x44ada0
  44ad91:	83 c2 06             	add    edx,0x6
  44ad94:	41                   	inc    ecx
  44ad95:	39 0d 08 45 68 00    	cmp    DWORD PTR ds:0x684508,ecx
  44ad9b:	7d cc                	jge    0x44ad69
  44ad9d:	66 33 c9             	xor    cx,cx
  44ada0:	66 85 c9             	test   cx,cx
  44ada3:	0f 84 8c 00 00 00    	je     0x44ae35
  44ada9:	0f bf c1             	movsx  eax,cx
  44adac:	8d 0c 40             	lea    ecx,[eax+eax*2]
  44adaf:	0f bf 04 4d 20 42 68 	movsx  eax,WORD PTR [ecx*2+0x684220]
  44adb6:	00 
  44adb7:	8b c8                	mov    ecx,eax
  44adb9:	c1 e0 06             	shl    eax,0x6
  44adbc:	2b c1                	sub    eax,ecx
  44adbe:	2b c1                	sub    eax,ecx
  44adc0:	8d a8 5e 42 68 00    	lea    ebp,[eax+0x68425e]
  44adc6:	c7 45 2e 03 00 00 00 	mov    DWORD PTR [ebp+0x2e],0x3
  44adcd:	55                   	push   ebp
  44adce:	e8 5d 2e 00 00       	call   0x44dc30
  44add3:	83 c4 04             	add    esp,0x4
  44add6:	66 85 c0             	test   ax,ax
  44add9:	0f 84 78 ff ff ff    	je     0x44ad57
  44addf:	0f bf c0             	movsx  eax,ax
  44ade2:	8d 0c 40             	lea    ecx,[eax+eax*2]
  44ade5:	0f bf 04 4d 20 42 68 	movsx  eax,WORD PTR [ecx*2+0x684220]
  44adec:	00 
  44aded:	8b c8                	mov    ecx,eax
  44adef:	c1 e0 06             	shl    eax,0x6
  44adf2:	2b c1                	sub    eax,ecx
  44adf4:	2b c1                	sub    eax,ecx
  44adf6:	05 5e 42 68 00       	add    eax,0x68425e
  44adfb:	50                   	push   eax
  44adfc:	e8 8f 2e 00 00       	call   0x44dc90
  44ae01:	83 c4 04             	add    esp,0x4
  44ae04:	eb c7                	jmp    0x44adcd
  44ae06:	83 f8 03             	cmp    eax,0x3
  44ae09:	0f 85 80 fe ff ff    	jne    0x44ac8f
  44ae0f:	66 8b 47 04          	mov    ax,WORD PTR [edi+0x4]
  44ae13:	66 85 c0             	test   ax,ax
  44ae16:	74 16                	je     0x44ae2e
  44ae18:	66 48                	dec    ax
  44ae1a:	66 89 47 04          	mov    WORD PTR [edi+0x4],ax
  44ae1e:	66 85 c0             	test   ax,ax
  44ae21:	0f 8f 68 fe ff ff    	jg     0x44ac8f
  44ae27:	b0 ff                	mov    al,0xff
  44ae29:	e9 63 fe ff ff       	jmp    0x44ac91
  44ae2e:	b0 ff                	mov    al,0xff
  44ae30:	e9 5c fe ff ff       	jmp    0x44ac91
  44ae35:	66 46                	inc    si
  44ae37:	0f bf c6             	movsx  eax,si
  44ae3a:	3b 05 08 45 68 00    	cmp    eax,DWORD PTR ds:0x684508
  44ae40:	0f 8c d4 fd ff ff    	jl     0x44ac1a
  44ae46:	83 3d 08 45 68 00 01 	cmp    DWORD PTR ds:0x684508,0x1
  44ae4d:	66 be 01 00          	mov    si,0x1
  44ae51:	0f 8e f6 01 00 00    	jle    0x44b04d
  44ae57:	33 db                	xor    ebx,ebx
  44ae59:	0f bf c6             	movsx  eax,si
  44ae5c:	8d 0c 40             	lea    ecx,[eax+eax*2]
  44ae5f:	0f bf 04 4d 20 42 68 	movsx  eax,WORD PTR [ecx*2+0x684220]
  44ae66:	00 
  44ae67:	8b c8                	mov    ecx,eax
  44ae69:	c1 e0 06             	shl    eax,0x6
  44ae6c:	2b c1                	sub    eax,ecx
  44ae6e:	2b c1                	sub    eax,ecx
  44ae70:	8d b8 5e 42 68 00    	lea    edi,[eax+0x68425e]
  44ae76:	8b 80 8c 42 68 00    	mov    eax,DWORD PTR [eax+0x68428c]
  44ae7c:	85 c0                	test   eax,eax
  44ae7e:	0f 84 b8 01 00 00    	je     0x44b03c
  44ae84:	39 5f 32             	cmp    DWORD PTR [edi+0x32],ebx
  44ae87:	0f 84 af 01 00 00    	je     0x44b03c
  44ae8d:	83 f8 02             	cmp    eax,0x2
  44ae90:	74 25                	je     0x44aeb7
  44ae92:	66 39 5f 04          	cmp    WORD PTR [edi+0x4],bx
  44ae96:	74 1f                	je     0x44aeb7
  44ae98:	0f bf 47 3a          	movsx  eax,WORD PTR [edi+0x3a]
  44ae9c:	8b c8                	mov    ecx,eax
  44ae9e:	c1 e0 06             	shl    eax,0x6
  44aea1:	2b c1                	sub    eax,ecx
  44aea3:	2b c1                	sub    eax,ecx
  44aea5:	66 39 98 84 d0 5c 00 	cmp    WORD PTR [eax+0x5cd084],bx
  44aeac:	74 09                	je     0x44aeb7
  44aeae:	83 0d 74 a0 5d 00 08 	or     DWORD PTR ds:0x5da074,0x8
  44aeb5:	eb 07                	jmp    0x44aebe
  44aeb7:	83 25 74 a0 5d 00 f7 	and    DWORD PTR ds:0x5da074,0xfffffff7
  44aebe:	8b 47 1e             	mov    eax,DWORD PTR [edi+0x1e]
  44aec1:	85 c0                	test   eax,eax
  44aec3:	74 06                	je     0x44aecb
  44aec5:	57                   	push   edi
  44aec6:	ff d0                	call   eax
  44aec8:	83 c4 04             	add    esp,0x4
  44aecb:	83 7f 2e 02          	cmp    DWORD PTR [edi+0x2e],0x2
  44aecf:	0f 85 67 01 00 00    	jne    0x44b03c
  44aed5:	0f bf 47 3c          	movsx  eax,WORD PTR [edi+0x3c]
  44aed9:	8b c8                	mov    ecx,eax
  44aedb:	c1 e0 03             	shl    eax,0x3
  44aede:	2b c1                	sub    eax,ecx
  44aee0:	03 c0                	add    eax,eax
  44aee2:	8d ac c1 2c 45 68 00 	lea    ebp,[ecx+eax*8+0x68452c]
  44aee9:	81 fd 2c 45 68 00    	cmp    ebp,0x68452c
  44aeef:	74 3d                	je     0x44af2e
  44aef1:	8b 45 53             	mov    eax,DWORD PTR [ebp+0x53]
  44aef4:	85 c0                	test   eax,eax
  44aef6:	74 1a                	je     0x44af12
  44aef8:	39 5d 10             	cmp    DWORD PTR [ebp+0x10],ebx
  44aefb:	74 15                	je     0x44af12
  44aefd:	39 5d 04             	cmp    DWORD PTR [ebp+0x4],ebx
  44af00:	74 10                	je     0x44af12
  44af02:	66 8b 4f 38          	mov    cx,WORD PTR [edi+0x38]
  44af06:	66 39 4d 6b          	cmp    WORD PTR [ebp+0x6b],cx
  44af0a:	75 06                	jne    0x44af12
  44af0c:	55                   	push   ebp
  44af0d:	ff d0                	call   eax
  44af0f:	83 c4 04             	add    esp,0x4
  44af12:	0f bf 45 6d          	movsx  eax,WORD PTR [ebp+0x6d]
  44af16:	8b c8                	mov    ecx,eax
  44af18:	c1 e0 03             	shl    eax,0x3
  44af1b:	2b c1                	sub    eax,ecx
  44af1d:	03 c0                	add    eax,eax
  44af1f:	8d ac c1 2c 45 68 00 	lea    ebp,[ecx+eax*8+0x68452c]
  44af26:	81 fd 2c 45 68 00    	cmp    ebp,0x68452c
  44af2c:	75 c3                	jne    0x44aef1
  44af2e:	38 1d c9 c6 68 00    	cmp    BYTE PTR ds:0x68c6c9,bl
  44af34:	0f 8c 02 01 00 00    	jl     0x44b03c
  44af3a:	89 5c 24 1c          	mov    DWORD PTR [esp+0x1c],ebx
  44af3e:	89 5c 24 18          	mov    DWORD PTR [esp+0x18],ebx
  44af42:	89 5c 24 14          	mov    DWORD PTR [esp+0x14],ebx
  44af46:	89 5c 24 10          	mov    DWORD PTR [esp+0x10],ebx
  44af4a:	0f bf 47 3c          	movsx  eax,WORD PTR [edi+0x3c]
  44af4e:	8b c8                	mov    ecx,eax
  44af50:	c1 e0 03             	shl    eax,0x3
  44af53:	2b c1                	sub    eax,ecx
  44af55:	03 c0                	add    eax,eax
  44af57:	8d 8c c1 2c 45 68 00 	lea    ecx,[ecx+eax*8+0x68452c]
  44af5e:	81 f9 2c 45 68 00    	cmp    ecx,0x68452c
  44af64:	0f 84 d2 00 00 00    	je     0x44b03c
  44af6a:	39 59 53             	cmp    DWORD PTR [ecx+0x53],ebx
  44af6d:	74 1f                	je     0x44af8e
  44af6f:	39 59 10             	cmp    DWORD PTR [ecx+0x10],ebx
  44af72:	74 1a                	je     0x44af8e
  44af74:	39 59 04             	cmp    DWORD PTR [ecx+0x4],ebx
  44af77:	74 15                	je     0x44af8e
  44af79:	66 8b 47 38          	mov    ax,WORD PTR [edi+0x38]
  44af7d:	66 39 41 6b          	cmp    WORD PTR [ecx+0x6b],ax
  44af81:	75 0b                	jne    0x44af8e
  44af83:	0f be 05 c9 c6 68 00 	movsx  eax,BYTE PTR ds:0x68c6c9
  44af8a:	3b 01                	cmp    eax,DWORD PTR [ecx]
  44af8c:	74 21                	je     0x44afaf
  44af8e:	0f bf 41 6d          	movsx  eax,WORD PTR [ecx+0x6d]
  44af92:	8b c8                	mov    ecx,eax
  44af94:	c1 e0 03             	shl    eax,0x3
  44af97:	2b c1                	sub    eax,ecx
  44af99:	03 c0                	add    eax,eax
  44af9b:	8d 8c c1 2c 45 68 00 	lea    ecx,[ecx+eax*8+0x68452c]
  44afa2:	81 f9 2c 45 68 00    	cmp    ecx,0x68452c
  44afa8:	75 c0                	jne    0x44af6a
  44afaa:	e9 8d 00 00 00       	jmp    0x44b03c
  44afaf:	0f bf 05 d1 c6 89 00 	movsx  eax,WORD PTR ds:0x89c6d1
  44afb6:	99                   	cdq
  44afb7:	2b c2                	sub    eax,edx
  44afb9:	c1 f8 01             	sar    eax,0x1
  44afbc:	0f bf 2d d1 c6 89 00 	movsx  ebp,WORD PTR ds:0x89c6d1
  44afc3:	0f bf f8             	movsx  edi,ax
  44afc6:	8b 41 43             	mov    eax,DWORD PTR [ecx+0x43]
  44afc9:	0f af c5             	imul   eax,ebp
  44afcc:	03 c7                	add    eax,edi
  44afce:	99                   	cdq
  44afcf:	81 e2 ff ff 00 00    	and    edx,0xffff
  44afd5:	03 c2                	add    eax,edx
  44afd7:	c1 f8 10             	sar    eax,0x10
  44afda:	89 44 24 14          	mov    DWORD PTR [esp+0x14],eax
  44afde:	8b 41 4b             	mov    eax,DWORD PTR [ecx+0x4b]
  44afe1:	03 41 43             	add    eax,DWORD PTR [ecx+0x43]
  44afe4:	0f af c5             	imul   eax,ebp
  44afe7:	03 c7                	add    eax,edi
  44afe9:	99                   	cdq
  44afea:	81 e2 ff ff 00 00    	and    edx,0xffff
  44aff0:	03 c2                	add    eax,edx
  44aff2:	c1 f8 10             	sar    eax,0x10
  44aff5:	89 44 24 1c          	mov    DWORD PTR [esp+0x1c],eax
  44aff9:	8b 41 3f             	mov    eax,DWORD PTR [ecx+0x3f]
  44affc:	0f bf 3d cf c6 89 00 	movsx  edi,WORD PTR ds:0x89c6cf
  44b003:	0f af c7             	imul   eax,edi
  44b006:	99                   	cdq
  44b007:	81 e2 ff ff 00 00    	and    edx,0xffff
  44b00d:	03 c2                	add    eax,edx
  44b00f:	c1 f8 10             	sar    eax,0x10
  44b012:	89 44 24 10          	mov    DWORD PTR [esp+0x10],eax
  44b016:	8b 41 47             	mov    eax,DWORD PTR [ecx+0x47]
  44b019:	03 41 3f             	add    eax,DWORD PTR [ecx+0x3f]
  44b01c:	8d 4c 24 10          	lea    ecx,[esp+0x10]
  44b020:	0f af c7             	imul   eax,edi
  44b023:	99                   	cdq
  44b024:	81 e2 ff ff 00 00    	and    edx,0xffff
  44b02a:	51                   	push   ecx
  44b02b:	03 c2                	add    eax,edx
  44b02d:	c1 f8 10             	sar    eax,0x10
  44b030:	89 44 24 1c          	mov    DWORD PTR [esp+0x1c],eax
  44b034:	e8 97 ab 0d 00       	call   0x525bd0
  44b039:	83 c4 04             	add    esp,0x4
  44b03c:	66 46                	inc    si
  44b03e:	0f bf c6             	movsx  eax,si
  44b041:	3b 05 08 45 68 00    	cmp    eax,DWORD PTR ds:0x684508
  44b047:	0f 8c 0c fe ff ff    	jl     0x44ae59
  44b04d:	5d                   	pop    ebp
  44b04e:	5f                   	pop    edi
  44b04f:	5e                   	pop    esi
  44b050:	5b                   	pop    ebx
  44b051:	83 c4 10             	add    esp,0x10
  44b054:	c3                   	ret
  44b055:	cc                   	int3
  44b056:	cc                   	int3
  44b057:	cc                   	int3
  44b058:	cc                   	int3
  44b059:	cc                   	int3
  44b05a:	cc                   	int3
  44b05b:	cc                   	int3
  44b05c:	cc                   	int3
  44b05d:	cc                   	int3
  44b05e:	cc                   	int3
  44b05f:	cc                   	int3
  44b060:	a1 14 42 68 00       	mov    eax,ds:0x684214
  44b065:	c3                   	ret
  44b066:	cc                   	int3
  44b067:	cc                   	int3
  44b068:	cc                   	int3
  44b069:	cc                   	int3
  44b06a:	cc                   	int3
  44b06b:	cc                   	int3
  44b06c:	cc                   	int3
  44b06d:	cc                   	int3
  44b06e:	cc                   	int3
  44b06f:	cc                   	int3
  44b070:	83 3d 9d b6 68 00 00 	cmp    DWORD PTR ds:0x68b69d,0x0
  44b077:	75 16                	jne    0x44b08f
  44b079:	c7 05 b7 c6 68 00 00 	mov    DWORD PTR ds:0x68c6b7,0x0
  44b080:	00 00 00 
  44b083:	a1 50 a8 5c 00       	mov    eax,ds:0x5ca850
  44b088:	03 c0                	add    eax,eax
  44b08a:	a3 b3 c6 68 00       	mov    ds:0x68c6b3,eax
  44b08f:	c3                   	ret
  44b090:	33 c9                	xor    ecx,ecx
  44b092:	66 39 0d 0c db 98 00 	cmp    WORD PTR ds:0x98db0c,cx
  44b099:	75 58                	jne    0x44b0f3
  44b09b:	66 39 0d 48 db 98 00 	cmp    WORD PTR ds:0x98db48,cx
  44b0a2:	75 4f                	jne    0x44b0f3
  44b0a4:	66 39 0d 44 db 98 00 	cmp    WORD PTR ds:0x98db44,cx
  44b0ab:	75 46                	jne    0x44b0f3
  44b0ad:	66 39 0d 2c db 98 00 	cmp    WORD PTR ds:0x98db2c,cx
  44b0b4:	75 3d                	jne    0x44b0f3
  44b0b6:	66 39 0d 40 db 98 00 	cmp    WORD PTR ds:0x98db40,cx
  44b0bd:	75 34                	jne    0x44b0f3
  44b0bf:	66 89 0d a5 c6 68 00 	mov    WORD PTR ds:0x68c6a5,cx
  44b0c6:	89 0d af c6 68 00    	mov    DWORD PTR ds:0x68c6af,ecx
  44b0cc:	66 89 0d a1 b6 68 00 	mov    WORD PTR ds:0x68b6a1,cx
  44b0d3:	88 0d c0 c6 68 00    	mov    BYTE PTR ds:0x68c6c0,cl
  44b0d9:	66 89 0d bb c6 68 00 	mov    WORD PTR ds:0x68c6bb,cx
  44b0e0:	89 0d a1 c6 68 00    	mov    DWORD PTR ds:0x68c6a1,ecx
  44b0e6:	66 89 0d bd c6 68 00 	mov    WORD PTR ds:0x68c6bd,cx
  44b0ed:	88 0d bf c6 68 00    	mov    BYTE PTR ds:0x68c6bf,cl
  44b0f3:	c3                   	ret
  44b0f4:	cc                   	int3
  44b0f5:	cc                   	int3
  44b0f6:	cc                   	int3
  44b0f7:	cc                   	int3
  44b0f8:	cc                   	int3
  44b0f9:	cc                   	int3
  44b0fa:	cc                   	int3
  44b0fb:	cc                   	int3
  44b0fc:	cc                   	int3
  44b0fd:	cc                   	int3
  44b0fe:	cc                   	int3
  44b0ff:	cc                   	int3
