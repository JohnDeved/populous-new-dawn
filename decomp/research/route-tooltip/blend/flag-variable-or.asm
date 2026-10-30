
/workspace/scratch/69fd8163d94e/populous-original-inputs-20261020/game/d3dpoptb.exe:     file format pei-i386


Disassembly of section .text:

0041ea17 <.text+0x1da17>:
  41ea17:	bd 08 00 00 00       	mov    ebp,0x8
  41ea1c:	8b 44 24 10          	mov    eax,DWORD PTR [esp+0x10]
  41ea20:	0f bf 70 0a          	movsx  esi,WORD PTR [eax+0xa]
  41ea24:	0f bf 58 0c          	movsx  ebx,WORD PTR [eax+0xc]
  41ea28:	8b 48 06             	mov    ecx,DWORD PTR [eax+0x6]
  41ea2b:	33 c0                	xor    eax,eax
  41ea2d:	8a 41 3a             	mov    al,BYTE PTR [ecx+0x3a]
  41ea30:	8d 3c 80             	lea    edi,[eax+eax*4]
  41ea33:	80 bc 78 f9 6a 5a 00 	cmp    BYTE PTR [eax+edi*2+0x5a6af9],0x1
  41ea3a:	01 
  41ea3b:	7e 14                	jle    0x41ea51
  41ea3d:	66 8b 41 37          	mov    ax,WORD PTR [ecx+0x37]
  41ea41:	0f bf 51 33          	movsx  edx,WORD PTR [ecx+0x33]
  41ea45:	66 c1 e8 02          	shr    ax,0x2
  41ea49:	0f b7 c0             	movzx  eax,ax
  41ea4c:	8d 3c 10             	lea    edi,[eax+edx*1]
  41ea4f:	eb 04                	jmp    0x41ea55
  41ea51:	0f bf 79 33          	movsx  edi,WORD PTR [ecx+0x33]
  41ea55:	81 ff 50 06 00 00    	cmp    edi,0x650
  41ea5b:	0f 84 92 00 00 00    	je     0x41eaf3
  41ea61:	a1 14 df 59 00       	mov    eax,ds:0x59df14
  41ea66:	8d 14 f8             	lea    edx,[eax+edi*8]
  41ea69:	66 8b 42 04          	mov    ax,WORD PTR [edx+0x4]
  41ea6d:	66 c1 e8 01          	shr    ax,0x1
  41ea71:	0f b7 c0             	movzx  eax,ax
  41ea74:	2b f0                	sub    esi,eax
  41ea76:	33 c0                	xor    eax,eax
  41ea78:	66 8b 42 06          	mov    ax,WORD PTR [edx+0x6]
  41ea7c:	2b d8                	sub    ebx,eax
  41ea7e:	f6 41 36 40          	test   BYTE PTR [ecx+0x36],0x40
  41ea82:	74 06                	je     0x41ea8a
  41ea84:	09 2d 74 a0 5d 00    	or     DWORD PTR ds:0x5da074,ebp
  41ea8a:	8a 41 3c             	mov    al,BYTE PTR [ecx+0x3c]
  41ea8d:	3c f1                	cmp    al,0xf1
  41ea8f:	7c 50                	jl     0x41eae1
  41ea91:	3c 0f                	cmp    al,0xf
  41ea93:	7f 57                	jg     0x41eaec
  41ea95:	74 0e                	je     0x41eaa5
  41ea97:	0f be c0             	movsx  eax,al
  41ea9a:	c1 e0 0c             	shl    eax,0xc
  41ea9d:	05 00 f0 87 00       	add    eax,0x87f000
  41eaa2:	50                   	push   eax
  41eaa3:	eb 05                	jmp    0x41eaaa
  41eaa5:	68 00 f0 87 00       	push   0x87f000
  41eaaa:	e8 c1 77 0f 00       	call   0x516270
  41eaaf:	83 c4 04             	add    esp,0x4
  41eab2:	a1 14 df 59 00       	mov    eax,ds:0x59df14
  41eab7:	09 2d 74 a0 5d 00    	or     DWORD PTR ds:0x5da074,ebp
  41eabd:	8d 0c f8             	lea    ecx,[eax+edi*8]
  41eac0:	51                   	push   ecx
  41eac1:	53                   	push   ebx
  41eac2:	56                   	push   esi
  41eac3:	e8 18 78 0f 00       	call   0x5162e0
  41eac8:	83 c4 0c             	add    esp,0xc
  41eacb:	68 60 45 97 00       	push   0x974560
  41ead0:	e8 9b 77 0f 00       	call   0x516270
  41ead5:	83 25 74 a0 5d 00 f7 	and    DWORD PTR ds:0x5da074,0xfffffff7
  41eadc:	83 c4 04             	add    esp,0x4
  41eadf:	eb 0b                	jmp    0x41eaec
  41eae1:	52                   	push   edx
  41eae2:	53                   	push   ebx
  41eae3:	56                   	push   esi
  41eae4:	e8 f7 77 0f 00       	call   0x5162e0
  41eae9:	83 c4 0c             	add    esp,0xc
  41eaec:	83 25 74 a0 5d 00 f7 	and    DWORD PTR ds:0x5da074,0xfffffff7
  41eaf3:	8b 44 24 10          	mov    eax,DWORD PTR [esp+0x10]
  41eaf7:	8b 48 02             	mov    ecx,DWORD PTR [eax+0x2]
  41eafa:	89 4c 24 10          	mov    DWORD PTR [esp+0x10],ecx
  41eafe:	85 c9                	test   ecx,ecx
  41eb00:	0f 85 16 ff ff ff    	jne    0x41ea1c
  41eb06:	a1 1c d5 75 00       	mov    eax,ds:0x75d51c
  41eb0b:	89 44 24 10          	mov    DWORD PTR [esp+0x10],eax
  41eb0f:	85                   	.byte 0x85
