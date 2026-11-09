
game/d3dpoptb.exe:     file format pei-i386


Disassembly of section .text:

0049cc80 <.text+0x9bc80>:
  49cc80:	81 ec 28 02 00 00    	sub    esp,0x228
  49cc86:	53                   	push   ebx
  49cc87:	56                   	push   esi
  49cc88:	57                   	push   edi
  49cc89:	55                   	push   ebp
  49cc8a:	e8 41 a3 08 00       	call   0x526fd0
  49cc8f:	6a 00                	push   0x0
  49cc91:	6a 00                	push   0x0
  49cc93:	6a 00                	push   0x0
  49cc95:	e8 66 fd 05 00       	call   0x4fca00
  49cc9a:	83 c4 0c             	add    esp,0xc
  49cc9d:	6a 00                	push   0x0
  49cc9f:	e8 1c 65 08 00       	call   0x5231c0
  49cca4:	83 c4 04             	add    esp,0x4
  49cca7:	e8 24 ec fe ff       	call   0x48b8d0
  49ccac:	8d 84 24 28 01 00 00 	lea    eax,[esp+0x128]
  49ccb3:	6a 01                	push   0x1
  49ccb5:	6a 00                	push   0x0
  49ccb7:	50                   	push   eax
  49ccb8:	e8 23 33 06 00       	call   0x4fffe0
  49ccbd:	8b bc 24 48 02 00 00 	mov    edi,DWORD PTR [esp+0x248]
  49ccc4:	8d 84 24 34 01 00 00 	lea    eax,[esp+0x134]
  49cccb:	8d 8c 24 b4 00 00 00 	lea    ecx,[esp+0xb4]
  49ccd2:	83 c4 0c             	add    esp,0xc
  49ccd5:	57                   	push   edi
  49ccd6:	50                   	push   eax
  49ccd7:	68 34 9b 59 00       	push   0x599b34
  49ccdc:	51                   	push   ecx
  49ccdd:	e8 6e e7 0b 00       	call   0x55b450
  49cce2:	8d 8c 24 b8 00 00 00 	lea    ecx,[esp+0xb8]
  49cce9:	83 c4 10             	add    esp,0x10
  49ccec:	51                   	push   ecx
  49cced:	e8 8e 97 08 00       	call   0x526480
  49ccf2:	83 c4 04             	add    esp,0x4
  49ccf5:	83 f8 01             	cmp    eax,0x1
  49ccf8:	74 24                	je     0x49cd1e
  49ccfa:	b9 ff ff ff ff       	mov    ecx,0xffffffff
  49ccff:	2b c0                	sub    eax,eax
  49cd01:	f2 ae                	repnz scas al,BYTE PTR es:[edi]
  49cd03:	f7 d1                	not    ecx
  49cd05:	2b f9                	sub    edi,ecx
  49cd07:	8b c1                	mov    eax,ecx
  49cd09:	c1 e9 02             	shr    ecx,0x2
  49cd0c:	8b f7                	mov    esi,edi
  49cd0e:	8d bc 24 a8 00 00 00 	lea    edi,[esp+0xa8]
  49cd15:	f3 a5                	rep movs DWORD PTR es:[edi],DWORD PTR ds:[esi]
  49cd17:	8b c8                	mov    ecx,eax
  49cd19:	83 e1 03             	and    ecx,0x3
  49cd1c:	f3 a4                	rep movs BYTE PTR es:[edi],BYTE PTR ds:[esi]
  49cd1e:	bf 50 d3 98 00       	mov    edi,0x98d350
  49cd23:	33 c0                	xor    eax,eax
  49cd25:	b9 ed 01 00 00       	mov    ecx,0x1ed
  49cd2a:	f3 ab                	rep stos DWORD PTR es:[edi],eax
  49cd2c:	c7 05 54 d3 98 00 0c 	mov    DWORD PTR ds:0x98d354,0xba4260c
  49cd33:	26 a4 0b 
  49cd36:	39 84 24 40 02 00 00 	cmp    DWORD PTR [esp+0x240],eax
  49cd3d:	74 0a                	je     0x49cd49
  49cd3f:	c7 05 54 d3 98 00 4c 	mov    DWORD PTR ds:0x98d354,0xba4264c
  49cd46:	26 a4 0b 
  49cd49:	83 bc 24 44 02 00 00 	cmp    DWORD PTR [esp+0x244],0x0
  49cd50:	00 
  49cd51:	74 07                	je     0x49cd5a
  49cd53:	83 0d 54 d3 98 00 10 	or     DWORD PTR ds:0x98d354,0x10
  49cd5a:	8b 84 24 48 02 00 00 	mov    eax,DWORD PTR [esp+0x248]
  49cd61:	85 c0                	test   eax,eax
  49cd63:	74 0f                	je     0x49cd74
  49cd65:	81 0d 54 d3 98 00 00 	or     DWORD PTR ds:0x98d354,0x4000
  49cd6c:	40 00 00 
  49cd6f:	a3 cc d3 98 00       	mov    ds:0x98d3cc,eax
  49cd74:	0f bf 05 6f d1 89 00 	movsx  eax,WORD PTR ds:0x89d16f
  49cd7b:	c1 e0 02             	shl    eax,0x2
  49cd7e:	c7 05 58 d3 98 00 07 	mov    DWORD PTR ds:0x98d358,0x7
  49cd85:	00 00 00 
  49cd88:	8d 0c 80             	lea    ecx,[eax+eax*4]
  49cd8b:	c7 05 dc d3 98 00 00 	mov    DWORD PTR ds:0x98d3dc,0x0
  49cd92:	00 00 00 
  49cd95:	8d 04 89             	lea    eax,[ecx+ecx*4]
  49cd98:	8d 4c 24 10          	lea    ecx,[esp+0x10]
  49cd9c:	c1 f8 08             	sar    eax,0x8
  49cd9f:	a3 c8 d3 98 00       	mov    ds:0x98d3c8,eax
  49cda4:	e8 c7 12 0d 00       	call   0x56e070
  49cda9:	c7 44 24 1c 04 00 00 	mov    DWORD PTR [esp+0x1c],0x4
  49cdb0:	00 
  49cdb1:	8d 4c 24 10          	lea    ecx,[esp+0x10]
  49cdb5:	51                   	push   ecx
  49cdb6:	8b 0d 71 ce 89 00    	mov    ecx,DWORD PTR ds:0x89ce71
  49cdbc:	e8 af 03 0d 00       	call   0x56d170
  49cdc1:	85 c0                	test   eax,eax
  49cdc3:	75 09                	jne    0x49cdce
  49cdc5:	8b 44 24 14          	mov    eax,DWORD PTR [esp+0x14]
  49cdc9:	a3 a4 d3 98 00       	mov    ds:0x98d3a4,eax
  49cdce:	c7 05 00 d4 98 00 50 	mov    DWORD PTR ds:0x98d400,0x49cc50
  49cdd5:	cc 49 00 
  49cdd8:	e8 13 82 01 00       	call   0x4b4ff0
  49cddd:	6a 00                	push   0x0
  49cddf:	e8 0c 54 01 00       	call   0x4b21f0
  49cde4:	83 c4 04             	add    esp,0x4
  49cde7:	68 50 db 98 00       	push   0x98db50
  49cdec:	6a 02                	push   0x2
  49cdee:	6a 10                	push   0x10
  49cdf0:	68 e0 01 00 00       	push   0x1e0
  49cdf5:	68 80 02 00 00       	push   0x280
  49cdfa:	e8 11 55 01 00       	call   0x4b2310
  49cdff:	83 c4 14             	add    esp,0x14
  49ce02:	6a 00                	push   0x0
  49ce04:	e8 b7 63 08 00       	call   0x5231c0
  49ce09:	83 c4 04             	add    esp,0x4
  49ce0c:	a1 f4 c2 af 00       	mov    eax,ds:0xafc2f4
  49ce11:	8b 48 04             	mov    ecx,DWORD PTR [eax+0x4]
  49ce14:	68 64 d3 98 00       	push   0x98d364
  49ce19:	a1 28 ea 98 00       	mov    eax,ds:0x98ea28
  49ce1e:	68 18 ff 58 00       	push   0x58ff18
  49ce23:	50                   	push   eax
  49ce24:	89 0d 5c d3 98 00    	mov    DWORD PTR ds:0x98d35c,ecx
  49ce2a:	8b 18                	mov    ebx,DWORD PTR [eax]
  49ce2c:	ff 13                	call   DWORD PTR [ebx]
  49ce2e:	a1 3c f1 98 00       	mov    eax,ds:0x98f13c
  49ce33:	68 68 d3 98 00       	push   0x98d368
  49ce38:	8b 18                	mov    ebx,DWORD PTR [eax]
  49ce3a:	68 18 ff 58 00       	push   0x58ff18
  49ce3f:	50                   	push   eax
  49ce40:	ff 13                	call   DWORD PTR [ebx]
  49ce42:	8b 3d 4c dc 5c 00    	mov    edi,DWORD PTR ds:0x5cdc4c
  49ce48:	85 ff                	test   edi,edi
  49ce4a:	74 36                	je     0x49ce82
  49ce4c:	ff 15 70 c6 d0 00    	call   DWORD PTR ds:0xd0c670
  49ce52:	50                   	push   eax
  49ce53:	8b d8                	mov    ebx,eax
  49ce55:	ff 15 74 c6 d0 00    	call   DWORD PTR ds:0xd0c674
  49ce5b:	8b e8                	mov    ebp,eax
  49ce5d:	6a 01                	push   0x1
  49ce5f:	53                   	push   ebx
  49ce60:	8b 35 78 c6 d0 00    	mov    esi,DWORD PTR ds:0xd0c678
  49ce66:	ff d6                	call   esi
  49ce68:	8d 84 24 a8 00 00 00 	lea    eax,[esp+0xa8]
  49ce6f:	68 50 d3 98 00       	push   0x98d350
  49ce74:	57                   	push   edi
  49ce75:	50                   	push   eax
  49ce76:	e8 85 df 0d 00       	call   0x57ae00
  49ce7b:	83 c4 0c             	add    esp,0xc
  49ce7e:	55                   	push   ebp
  49ce7f:	53                   	push   ebx
  49ce80:	ff d6                	call   esi
  49ce82:	a1 64 d3 98 00       	mov    eax,ds:0x98d364
  49ce87:	50                   	push   eax
  49ce88:	8b 18                	mov    ebx,DWORD PTR [eax]
  49ce8a:	be 00 02 00 00       	mov    esi,0x200
  49ce8f:	ff 53 08             	call   DWORD PTR [ebx+0x8]
  49ce92:	8b 0d 68 d3 98 00    	mov    ecx,DWORD PTR ds:0x98d368
  49ce98:	51                   	push   ecx
  49ce99:	8b 01                	mov    eax,DWORD PTR [ecx]
  49ce9b:	ff 50 08             	call   DWORD PTR [eax+0x8]
  49ce9e:	0f bf 05 d3 c6 89 00 	movsx  eax,WORD PTR ds:0x89c6d3
  49cea5:	0f bf 0d d1 c6 89 00 	movsx  ecx,WORD PTR ds:0x89c6d1
  49ceac:	0f bf 15 cf c6 89 00 	movsx  edx,WORD PTR ds:0x89c6cf
  49ceb3:	68 50 db 98 00       	push   0x98db50
  49ceb8:	6a 01                	push   0x1
  49ceba:	50                   	push   eax
  49cebb:	33 ff                	xor    edi,edi
  49cebd:	51                   	push   ecx
  49cebe:	52                   	push   edx
  49cebf:	e8 4c 54 01 00       	call   0x4b2310
  49cec4:	83 c4 14             	add    esp,0x14
  49cec7:	89 3d d8 5a d0 00    	mov    DWORD PTR ds:0xd05ad8,edi
  49cecd:	c7 05 0c 5b d0 00 e0 	mov    DWORD PTR ds:0xd05b0c,0x96eae0
  49ced4:	ea 96 00 
  49ced7:	68 60 45 97 00       	push   0x974560
  49cedc:	e8 8f 93 07 00       	call   0x516270
  49cee1:	83 c4 04             	add    esp,0x4
  49cee4:	e8 77 57 01 00       	call   0x4b2660
  49cee9:	89 7c 24 10          	mov    DWORD PTR [esp+0x10],edi
  49ceed:	89 7c 24 14          	mov    DWORD PTR [esp+0x14],edi
  49cef1:	8b 48 1c             	mov    ecx,DWORD PTR [eax+0x1c]
  49cef4:	89 4c 24 18          	mov    DWORD PTR [esp+0x18],ecx
  49cef8:	8b 50 20             	mov    edx,DWORD PTR [eax+0x20]
  49cefb:	8d 44 24 10          	lea    eax,[esp+0x10]
  49ceff:	89 54 24 1c          	mov    DWORD PTR [esp+0x1c],edx
  49cf03:	50                   	push   eax
  49cf04:	e8 f7 a0 08 00       	call   0x527000
  49cf09:	83 c4 04             	add    esp,0x4
  49cf0c:	57                   	push   edi
  49cf0d:	e8 ae 62 08 00       	call   0x5231c0
  49cf12:	83 c4 04             	add    esp,0x4
  49cf15:	e8 16 66 00 00       	call   0x4a3530
  49cf1a:	39 3d 7c a8 5c 00    	cmp    DWORD PTR ds:0x5ca87c,edi
  49cf20:	75 05                	jne    0x49cf27
  49cf22:	e8 d9 e5 fe ff       	call   0x48b500
  49cf27:	c7 05 7c a8 5c 00 00 	mov    DWORD PTR ds:0x5ca87c,0x0
  49cf2e:	00 00 00 
  49cf31:	5d                   	pop    ebp
  49cf32:	5f                   	pop    edi
  49cf33:	5e                   	pop    esi
  49cf34:	5b                   	pop    ebx
  49cf35:	81 c4 28 02 00 00    	add    esp,0x228
  49cf3b:	c3                   	ret
