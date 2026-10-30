
/workspace/scratch/69fd8163d94e/populous-original-inputs-20261020/game/d3dpoptb.exe:     file format pei-i386


Disassembly of section .text:

00480ea0 <.text+0x7fea0>:
  480ea0:	80 7c 24 04 00       	cmp    BYTE PTR [esp+0x4],0x0
  480ea5:	53                   	push   ebx
  480ea6:	56                   	push   esi
  480ea7:	0f 85 97 01 00 00    	jne    0x481044
  480ead:	80 3d 56 5b 98 00 00 	cmp    BYTE PTR ds:0x985b56,0x0
  480eb4:	74 18                	je     0x480ece
  480eb6:	68 48 5b 98 00       	push   0x985b48
  480ebb:	e8 d0 03 00 00       	call   0x481290
  480ec0:	83 c4 04             	add    esp,0x4
  480ec3:	85 c0                	test   eax,eax
  480ec5:	74 07                	je     0x480ece
  480ec7:	c6 05 56 5b 98 00 00 	mov    BYTE PTR ds:0x985b56,0x0
  480ece:	33 db                	xor    ebx,ebx
  480ed0:	38 1d 76 8a 98 00    	cmp    BYTE PTR ds:0x988a76,bl
  480ed6:	0f 84 d0 00 00 00    	je     0x480fac
  480edc:	83 0d 74 a0 5d 00 08 	or     DWORD PTR ds:0x5da074,0x8
  480ee3:	0f bf 05 7f 8a 98 00 	movsx  eax,WORD PTR ds:0x988a7f
  480eea:	c1 e0 0c             	shl    eax,0xc
  480eed:	05 00 f0 87 00       	add    eax,0x87f000
  480ef2:	50                   	push   eax
  480ef3:	e8 78 53 09 00       	call   0x516270
  480ef8:	0f bf 35 7b 8a 98 00 	movsx  esi,WORD PTR ds:0x988a7b
  480eff:	0f bf 0d 77 8a 98 00 	movsx  ecx,WORD PTR ds:0x988a77
  480f06:	83 c4 04             	add    esp,0x4
  480f09:	03 f1                	add    esi,ecx
  480f0b:	c1 e6 03             	shl    esi,0x3
  480f0e:	33 c0                	xor    eax,eax
  480f10:	03 35 14 df 59 00    	add    esi,DWORD PTR ds:0x59df14
  480f16:	66 8b 46 06          	mov    ax,WORD PTR [esi+0x6]
  480f1a:	56                   	push   esi
  480f1b:	8d 14 80             	lea    edx,[eax+eax*4]
  480f1e:	8d 04 50             	lea    eax,[eax+edx*2]
  480f21:	0f bf 0d 6a 8a 98 00 	movsx  ecx,WORD PTR ds:0x988a6a
  480f28:	c1 e0 04             	shl    eax,0x4
  480f2b:	f7 d8                	neg    eax
  480f2d:	99                   	cdq
  480f2e:	81 e2 ff 00 00 00    	and    edx,0xff
  480f34:	03 c2                	add    eax,edx
  480f36:	c1 f8 08             	sar    eax,0x8
  480f39:	03 c1                	add    eax,ecx
  480f3b:	50                   	push   eax
  480f3c:	0f bf 0d 68 8a 98 00 	movsx  ecx,WORD PTR ds:0x988a68
  480f43:	66 8b 46 04          	mov    ax,WORD PTR [esi+0x4]
  480f47:	66 c1 e8 01          	shr    ax,0x1
  480f4b:	0f b7 d0             	movzx  edx,ax
  480f4e:	2b ca                	sub    ecx,edx
  480f50:	51                   	push   ecx
  480f51:	e8 8a 53 09 00       	call   0x5162e0
  480f56:	83 c4 0c             	add    esp,0xc
  480f59:	68 60 45 97 00       	push   0x974560
  480f5e:	e8 0d 53 09 00       	call   0x516270
  480f63:	83 25 74 a0 5d 00 f7 	and    DWORD PTR ds:0x5da074,0xfffffff7
  480f6a:	66 ff 0d 7d 8a 98 00 	dec    WORD PTR ds:0x988a7d
  480f71:	83 c4 04             	add    esp,0x4
  480f74:	66 39 1d 7d 8a 98 00 	cmp    WORD PTR ds:0x988a7d,bx
  480f7b:	7e 1f                	jle    0x480f9c
  480f7d:	66                   	data16
  480f7e:	a1                   	.byte 0xa1
  480f7f:	79                   	.byte 0x79
