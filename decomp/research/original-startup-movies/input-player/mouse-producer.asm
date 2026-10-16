
INPUT/d3dpoptb.exe:     file format pei-i386


Disassembly of section .text:

0052cd40 <.text+0x12bd40>:
  52cd40:	64 a1 00 00 00 00    	mov    eax,fs:0x0
  52cd46:	55                   	push   ebp
  52cd47:	8b ec                	mov    ebp,esp
  52cd49:	6a ff                	push   0xffffffff
  52cd4b:	68 9f d1 52 00       	push   0x52d19f
  52cd50:	50                   	push   eax
  52cd51:	64 89 25 00 00 00 00 	mov    DWORD PTR fs:0x0,esp
  52cd58:	81 ec 04 01 00 00    	sub    esp,0x104
  52cd5e:	c7 45 ec 00 00 00 00 	mov    DWORD PTR [ebp-0x14],0x0
  52cd65:	c7 45 f0 00 00 00 00 	mov    DWORD PTR [ebp-0x10],0x0
  52cd6c:	56                   	push   esi
  52cd6d:	57                   	push   edi
  52cd6e:	6a 00                	push   0x0
  52cd70:	6a 00                	push   0x0
  52cd72:	6a 00                	push   0x0
  52cd74:	6a 00                	push   0x0
  52cd76:	ff 15 c4 c6 d0 00    	call   DWORD PTR ds:0xd0c6c4
  52cd7c:	89 45 e8             	mov    DWORD PTR [ebp-0x18],eax
  52cd7f:	85 c0                	test   eax,eax
  52cd81:	75 0a                	jne    0x52cd8d
  52cd83:	b8 01 00 00 00       	mov    eax,0x1
  52cd88:	e9 f8 03 00 00       	jmp    0x52d185
  52cd8d:	6a 00                	push   0x0
  52cd8f:	8d 45 ec             	lea    eax,[ebp-0x14]
  52cd92:	50                   	push   eax
  52cd93:	68 00 05 00 00       	push   0x500
  52cd98:	e8 43 d9 ff ff       	call   0x52a6e0
  52cd9d:	50                   	push   eax
  52cd9e:	e8 95 81 05 00       	call   0x584f38
  52cda3:	85 c0                	test   eax,eax
  52cda5:	74 14                	je     0x52cdbb
  52cda7:	8b 45 e8             	mov    eax,DWORD PTR [ebp-0x18]
  52cdaa:	50                   	push   eax
  52cdab:	ff 15 a4 c7 d0 00    	call   DWORD PTR ds:0xd0c7a4
  52cdb1:	b8 01 00 00 00       	mov    eax,0x1
  52cdb6:	e9 ca 03 00 00       	jmp    0x52d185
  52cdbb:	6a 00                	push   0x0
  52cdbd:	8d 45 f0             	lea    eax,[ebp-0x10]
  52cdc0:	50                   	push   eax
  52cdc1:	8b 4d ec             	mov    ecx,DWORD PTR [ebp-0x14]
  52cdc4:	8b 01                	mov    eax,DWORD PTR [ecx]
  52cdc6:	68 38 09 59 00       	push   0x590938
  52cdcb:	51                   	push   ecx
  52cdcc:	ff 50 0c             	call   DWORD PTR [eax+0xc]
  52cdcf:	85 c0                	test   eax,eax
  52cdd1:	74 1d                	je     0x52cdf0
  52cdd3:	8b 45 e8             	mov    eax,DWORD PTR [ebp-0x18]
  52cdd6:	50                   	push   eax
  52cdd7:	ff 15 a4 c7 d0 00    	call   DWORD PTR ds:0xd0c7a4
  52cddd:	8b 4d ec             	mov    ecx,DWORD PTR [ebp-0x14]
  52cde0:	51                   	push   ecx
  52cde1:	8b 01                	mov    eax,DWORD PTR [ecx]
  52cde3:	ff 50 08             	call   DWORD PTR [eax+0x8]
  52cde6:	b8 01 00 00 00       	mov    eax,0x1
  52cdeb:	e9 95 03 00 00       	jmp    0x52d185
  52cdf0:	68 b0 4f 58 00       	push   0x584fb0
  52cdf5:	8b 45 f0             	mov    eax,DWORD PTR [ebp-0x10]
  52cdf8:	50                   	push   eax
  52cdf9:	8b 30                	mov    esi,DWORD PTR [eax]
  52cdfb:	ff 56 2c             	call   DWORD PTR [esi+0x2c]
  52cdfe:	6a 05                	push   0x5
  52ce00:	e8 fb d8 ff ff       	call   0x52a700
  52ce05:	50                   	push   eax
  52ce06:	8b 4d f0             	mov    ecx,DWORD PTR [ebp-0x10]
  52ce09:	51                   	push   ecx
  52ce0a:	8b 01                	mov    eax,DWORD PTR [ecx]
  52ce0c:	ff 50 34             	call   DWORD PTR [eax+0x34]
  52ce0f:	8b 4d e8             	mov    ecx,DWORD PTR [ebp-0x18]
  52ce12:	8b 55 f0             	mov    edx,DWORD PTR [ebp-0x10]
  52ce15:	8b 02                	mov    eax,DWORD PTR [edx]
  52ce17:	51                   	push   ecx
  52ce18:	52                   	push   edx
  52ce19:	ff 50 30             	call   DWORD PTR [eax+0x30]
  52ce1c:	85 c0                	test   eax,eax
  52ce1e:	74 26                	je     0x52ce46
  52ce20:	8b 45 e8             	mov    eax,DWORD PTR [ebp-0x18]
  52ce23:	50                   	push   eax
  52ce24:	ff 15 a4 c7 d0 00    	call   DWORD PTR ds:0xd0c7a4
  52ce2a:	8b 4d f0             	mov    ecx,DWORD PTR [ebp-0x10]
  52ce2d:	51                   	push   ecx
  52ce2e:	8b 01                	mov    eax,DWORD PTR [ecx]
  52ce30:	ff 50 08             	call   DWORD PTR [eax+0x8]
  52ce33:	8b 4d ec             	mov    ecx,DWORD PTR [ebp-0x14]
  52ce36:	51                   	push   ecx
  52ce37:	8b 01                	mov    eax,DWORD PTR [ecx]
  52ce39:	ff 50 08             	call   DWORD PTR [eax+0x8]
  52ce3c:	b8 01 00 00 00       	mov    eax,0x1
  52ce41:	e9 3f 03 00 00       	jmp    0x52d185
  52ce46:	c7 45 90 14 00 00 00 	mov    DWORD PTR [ebp-0x70],0x14
  52ce4d:	c7 45 94 10 00 00 00 	mov    DWORD PTR [ebp-0x6c],0x10
  52ce54:	8d 45 90             	lea    eax,[ebp-0x70]
  52ce57:	8b 4d f0             	mov    ecx,DWORD PTR [ebp-0x10]
  52ce5a:	c7 45 98 00 00 00 00 	mov    DWORD PTR [ebp-0x68],0x0
  52ce61:	c7 45 9c 00 00 00 00 	mov    DWORD PTR [ebp-0x64],0x0
  52ce68:	c7 45 a0 20 00 00 00 	mov    DWORD PTR [ebp-0x60],0x20
  52ce6f:	50                   	push   eax
  52ce70:	6a 01                	push   0x1
  52ce72:	51                   	push   ecx
  52ce73:	8b 01                	mov    eax,DWORD PTR [ecx]
  52ce75:	ff 50 18             	call   DWORD PTR [eax+0x18]
  52ce78:	8b 4d f0             	mov    ecx,DWORD PTR [ebp-0x10]
  52ce7b:	51                   	push   ecx
  52ce7c:	68 d0 cc 52 00       	push   0x52ccd0
  52ce81:	6a 06                	push   0x6
  52ce83:	b9 58 5e d0 00       	mov    ecx,0xd05e58
  52ce88:	e8 23 f1 ff ff       	call   0x52bfb0
  52ce8d:	8b 4d f0             	mov    ecx,DWORD PTR [ebp-0x10]
  52ce90:	51                   	push   ecx
  52ce91:	68 d0 cc 52 00       	push   0x52ccd0
  52ce96:	6a 07                	push   0x7
  52ce98:	b9 58 5e d0 00       	mov    ecx,0xd05e58
  52ce9d:	e8 0e f1 ff ff       	call   0x52bfb0
  52cea2:	6a 01                	push   0x1
  52cea4:	8b 4d 08             	mov    ecx,DWORD PTR [ebp+0x8]
  52cea7:	8d bd f0 fe ff ff    	lea    edi,[ebp-0x110]
  52cead:	e8 de 07 00 00       	call   0x52d690
  52ceb2:	8b 4d f0             	mov    ecx,DWORD PTR [ebp-0x10]
  52ceb5:	51                   	push   ecx
  52ceb6:	8b 01                	mov    eax,DWORD PTR [ecx]
  52ceb8:	ff 50 1c             	call   DWORD PTR [eax+0x1c]
  52cebb:	33 c0                	xor    eax,eax
  52cebd:	b9 28 00 00 00       	mov    ecx,0x28
  52cec2:	f3 ab                	rep stos DWORD PTR es:[edi],eax
  52cec4:	8b 4d 08             	mov    ecx,DWORD PTR [ebp+0x8]
  52cec7:	89 45 c8             	mov    DWORD PTR [ebp-0x38],eax
  52ceca:	89 45 cc             	mov    DWORD PTR [ebp-0x34],eax
  52cecd:	e8 ae 07 00 00       	call   0x52d680
  52ced2:	85 c0                	test   eax,eax
  52ced4:	0f 85 45 02 00 00    	jne    0x52d11f
  52ceda:	68 c8 00 00 00       	push   0xc8
  52cedf:	8b 45 e8             	mov    eax,DWORD PTR [ebp-0x18]
  52cee2:	50                   	push   eax
  52cee3:	ff 15 cc c6 d0 00    	call   DWORD PTR ds:0xd0c6cc
  52cee9:	85 c0                	test   eax,eax
  52ceeb:	0f 85 1e 02 00 00    	jne    0x52d10f
  52cef1:	8d bd f0 fe ff ff    	lea    edi,[ebp-0x110]
  52cef7:	33 c0                	xor    eax,eax
  52cef9:	b9 28 00 00 00       	mov    ecx,0x28
  52cefe:	50                   	push   eax
  52ceff:	f3 ab                	rep stos DWORD PTR es:[edi],eax
  52cf01:	8d 45 d0             	lea    eax,[ebp-0x30]
  52cf04:	8d 8d f0 fe ff ff    	lea    ecx,[ebp-0x110]
  52cf0a:	50                   	push   eax
  52cf0b:	8b 55 f0             	mov    edx,DWORD PTR [ebp-0x10]
  52cf0e:	c7 45 d0 0a 00 00 00 	mov    DWORD PTR [ebp-0x30],0xa
  52cf15:	51                   	push   ecx
  52cf16:	8b 02                	mov    eax,DWORD PTR [edx]
  52cf18:	6a 10                	push   0x10
  52cf1a:	52                   	push   edx
  52cf1b:	ff 50 28             	call   DWORD PTR [eax+0x28]
  52cf1e:	3d 1e 00 07 80       	cmp    eax,0x8007001e
  52cf23:	75 0e                	jne    0x52cf33
  52cf25:	8b 45 f0             	mov    eax,DWORD PTR [ebp-0x10]
  52cf28:	50                   	push   eax
  52cf29:	8b 30                	mov    esi,DWORD PTR [eax]
  52cf2b:	ff 56 1c             	call   DWORD PTR [esi+0x1c]
  52cf2e:	e9 dc 01 00 00       	jmp    0x52d10f
  52cf33:	85 c0                	test   eax,eax
  52cf35:	74 09                	je     0x52cf40
  52cf37:	83 f8 01             	cmp    eax,0x1
  52cf3a:	0f 85 cf 01 00 00    	jne    0x52d10f
  52cf40:	c7 45 d4 00 00 00 00 	mov    DWORD PTR [ebp-0x2c],0x0
  52cf47:	c7 45 cc 00 00 00 00 	mov    DWORD PTR [ebp-0x34],0x0
  52cf4e:	c7 45 c8 00 00 00 00 	mov    DWORD PTR [ebp-0x38],0x0
  52cf55:	c7 45 c4 00 00 00 00 	mov    DWORD PTR [ebp-0x3c],0x0
  52cf5c:	83 7d d0 00          	cmp    DWORD PTR [ebp-0x30],0x0
  52cf60:	0f 8e 52 01 00 00    	jle    0x52d0b8
  52cf66:	8d 85 f0 fe ff ff    	lea    eax,[ebp-0x110]
  52cf6c:	89 45 e4             	mov    DWORD PTR [ebp-0x1c],eax
  52cf6f:	8b 45 e4             	mov    eax,DWORD PTR [ebp-0x1c]
  52cf72:	8b 08                	mov    ecx,DWORD PTR [eax]
  52cf74:	83 f9 0f             	cmp    ecx,0xf
  52cf77:	0f 87 28 01 00 00    	ja     0x52d0a5
  52cf7d:	33 c0                	xor    eax,eax
  52cf7f:	8a 81 c4 d1 52 00    	mov    al,BYTE PTR [ecx+0x52d1c4]
  52cf85:	ff 24 85 b4 d1 52 00 	jmp    DWORD PTR [eax*4+0x52d1b4]
  52cf8c:	85 c9                	test   ecx,ecx
  52cf8e:	75 09                	jne    0x52cf99
  52cf90:	8b 45 e4             	mov    eax,DWORD PTR [ebp-0x1c]
  52cf93:	8b 50 04             	mov    edx,DWORD PTR [eax+0x4]
  52cf96:	01 55 c8             	add    DWORD PTR [ebp-0x38],edx
  52cf99:	83 f9 04             	cmp    ecx,0x4
  52cf9c:	75 09                	jne    0x52cfa7
  52cf9e:	8b 45 e4             	mov    eax,DWORD PTR [ebp-0x1c]
  52cfa1:	8b 48 04             	mov    ecx,DWORD PTR [eax+0x4]
  52cfa4:	01 4d cc             	add    DWORD PTR [ebp-0x34],ecx
  52cfa7:	8d 45 c8             	lea    eax,[ebp-0x38]
  52cfaa:	89 45 d4             	mov    DWORD PTR [ebp-0x2c],eax
  52cfad:	e9 f3 00 00 00       	jmp    0x52d0a5
  52cfb2:	8d 45 bc             	lea    eax,[ebp-0x44]
  52cfb5:	8b 4d 08             	mov    ecx,DWORD PTR [ebp+0x8]
  52cfb8:	c6 45 d8 02          	mov    BYTE PTR [ebp-0x28],0x2
  52cfbc:	c7 45 bc 00 00 00 00 	mov    DWORD PTR [ebp-0x44],0x0
  52cfc3:	c7 45 c0 00 00 00 00 	mov    DWORD PTR [ebp-0x40],0x0
  52cfca:	50                   	push   eax
  52cfcb:	e8 60 04 00 00       	call   0x52d430
  52cfd0:	8b 45 bc             	mov    eax,DWORD PTR [ebp-0x44]
  52cfd3:	8b 4d c0             	mov    ecx,DWORD PTR [ebp-0x40]
  52cfd6:	66 89 45 dc          	mov    WORD PTR [ebp-0x24],ax
  52cfda:	8b 55 e4             	mov    edx,DWORD PTR [ebp-0x1c]
  52cfdd:	66 89 4d de          	mov    WORD PTR [ebp-0x22],cx
  52cfe1:	8b 42 04             	mov    eax,DWORD PTR [edx+0x4]
  52cfe4:	25 80 00 00 00       	and    eax,0x80
  52cfe9:	c1 e8 07             	shr    eax,0x7
  52cfec:	83 7d 08 00          	cmp    DWORD PTR [ebp+0x8],0x0
  52cff0:	88 45 db             	mov    BYTE PTR [ebp-0x25],al
  52cff3:	b8 00 00 00 00       	mov    eax,0x0
  52cff8:	74 06                	je     0x52d000
  52cffa:	8b 45 08             	mov    eax,DWORD PTR [ebp+0x8]
  52cffd:	83 c0 04             	add    eax,0x4
  52d000:	6a 00                	push   0x0
  52d002:	8d 4d a4             	lea    ecx,[ebp-0x5c]
  52d005:	50                   	push   eax
  52d006:	e8 95 ed ff ff       	call   0x52bda0
  52d00b:	6a 01                	push   0x1
  52d00d:	8d 4d a4             	lea    ecx,[ebp-0x5c]
  52d010:	c7 45 fc 00 00 00 00 	mov    DWORD PTR [ebp-0x4],0x0
  52d017:	e8 b4 ed ff ff       	call   0x52bdd0
  52d01c:	85 c0                	test   eax,eax
  52d01e:	74 5b                	je     0x52d07b
  52d020:	8b 45 e4             	mov    eax,DWORD PTR [ebp-0x1c]
  52d023:	83 38 0c             	cmp    DWORD PTR [eax],0xc
  52d026:	75 14                	jne    0x52d03c
  52d028:	33 c0                	xor    eax,eax
  52d02a:	8b 4d 08             	mov    ecx,DWORD PTR [ebp+0x8]
  52d02d:	c6 45 da f0          	mov    BYTE PTR [ebp-0x26],0xf0
  52d031:	8a 45 db             	mov    al,BYTE PTR [ebp-0x25]
  52d034:	50                   	push   eax
  52d035:	6a 00                	push   0x0
  52d037:	e8 84 03 00 00       	call   0x52d3c0
  52d03c:	8b 45 e4             	mov    eax,DWORD PTR [ebp-0x1c]
  52d03f:	83 38 0d             	cmp    DWORD PTR [eax],0xd
  52d042:	75 14                	jne    0x52d058
  52d044:	33 c0                	xor    eax,eax
  52d046:	8b 4d 08             	mov    ecx,DWORD PTR [ebp+0x8]
  52d049:	c6 45 da f1          	mov    BYTE PTR [ebp-0x26],0xf1
  52d04d:	8a 45 db             	mov    al,BYTE PTR [ebp-0x25]
  52d050:	50                   	push   eax
  52d051:	6a 01                	push   0x1
  52d053:	e8 68 03 00 00       	call   0x52d3c0
  52d058:	8b 45 e4             	mov    eax,DWORD PTR [ebp-0x1c]
  52d05b:	8b 00                	mov    eax,DWORD PTR [eax]
  52d05d:	83 f8 0e             	cmp    eax,0xe
  52d060:	74 05                	je     0x52d067
  52d062:	83 f8 0f             	cmp    eax,0xf
  52d065:	75 14                	jne    0x52d07b
  52d067:	33 c0                	xor    eax,eax
  52d069:	8b 4d 08             	mov    ecx,DWORD PTR [ebp+0x8]
  52d06c:	c6 45 da f2          	mov    BYTE PTR [ebp-0x26],0xf2
  52d070:	8a 45 db             	mov    al,BYTE PTR [ebp-0x25]
  52d073:	50                   	push   eax
  52d074:	6a 02                	push   0x2
  52d076:	e8 45 03 00 00       	call   0x52d3c0
  52d07b:	8d 4d a4             	lea    ecx,[ebp-0x5c]
  52d07e:	e8 9d ed ff ff       	call   0x52be20
  52d083:	e8 98 99 ff ff       	call   0x526a20
  52d088:	b9 40 59 d0 00       	mov    ecx,0xd05940
  52d08d:	88 45 d9             	mov    BYTE PTR [ebp-0x27],al
  52d090:	8d 45 d8             	lea    eax,[ebp-0x28]
  52d093:	50                   	push   eax
  52d094:	e8 17 f5 ff ff       	call   0x52c5b0
  52d099:	c7 45 fc ff ff ff ff 	mov    DWORD PTR [ebp-0x4],0xffffffff
  52d0a0:	e8 f2 00 00 00       	call   0x52d197
  52d0a5:	83 45 e4 10          	add    DWORD PTR [ebp-0x1c],0x10
  52d0a9:	ff 45 c4             	inc    DWORD PTR [ebp-0x3c]
  52d0ac:	8b 45 c4             	mov    eax,DWORD PTR [ebp-0x3c]
  52d0af:	39 45 d0             	cmp    DWORD PTR [ebp-0x30],eax
  52d0b2:	0f 8f b7 fe ff ff    	jg     0x52cf6f
  52d0b8:	83 7d d4 00          	cmp    DWORD PTR [ebp-0x2c],0x0
  52d0bc:	74 51                	je     0x52d10f
  52d0be:	83 7d 08 00          	cmp    DWORD PTR [ebp+0x8],0x0
  52d0c2:	b8 00 00 00 00       	mov    eax,0x0
  52d0c7:	74 06                	je     0x52d0cf
  52d0c9:	8b 45 08             	mov    eax,DWORD PTR [ebp+0x8]
  52d0cc:	83 c0 04             	add    eax,0x4
  52d0cf:	6a 00                	push   0x0
  52d0d1:	8d 4d b0             	lea    ecx,[ebp-0x50]
  52d0d4:	50                   	push   eax
  52d0d5:	e8 c6 ec ff ff       	call   0x52bda0
  52d0da:	6a 00                	push   0x0
  52d0dc:	8d 4d b0             	lea    ecx,[ebp-0x50]
  52d0df:	c7 45 fc 01 00 00 00 	mov    DWORD PTR [ebp-0x4],0x1
  52d0e6:	e8 e5 ec ff ff       	call   0x52bdd0
  52d0eb:	85 c0                	test   eax,eax
  52d0ed:	74 0c                	je     0x52d0fb
  52d0ef:	8b 45 d4             	mov    eax,DWORD PTR [ebp-0x2c]
  52d0f2:	8b 4d 08             	mov    ecx,DWORD PTR [ebp+0x8]
  52d0f5:	50                   	push   eax
  52d0f6:	e8 e5 00 00 00       	call   0x52d1e0
  52d0fb:	8d 4d b0             	lea    ecx,[ebp-0x50]
  52d0fe:	e8 1d ed ff ff       	call   0x52be20
  52d103:	c7 45 fc ff ff ff ff 	mov    DWORD PTR [ebp-0x4],0xffffffff
  52d10a:	e8 9a 00 00 00       	call   0x52d1a9
  52d10f:	8b 4d 08             	mov    ecx,DWORD PTR [ebp+0x8]
  52d112:	e8 69 05 00 00       	call   0x52d680
