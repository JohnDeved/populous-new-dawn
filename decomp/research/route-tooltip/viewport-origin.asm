
/workspace/scratch/69fd8163d94e/populous-original-inputs-20261020/game/d3dpoptb.exe:     file format pei-i386


Disassembly of section .text:

0046e700 <.text+0x6d700>:
  46e700:	8b 4c 24 04          	mov    ecx,DWORD PTR [esp+0x4]
  46e704:	53                   	push   ebx
  46e705:	66 8b 41 22          	mov    ax,WORD PTR [ecx+0x22]
  46e709:	56                   	push   esi
  46e70a:	66 a3 8c ca 87 00    	mov    ds:0x87ca8c,ax
  46e710:	57                   	push   edi
  46e711:	66 8b 51 24          	mov    dx,WORD PTR [ecx+0x24]
  46e715:	55                   	push   ebp
  46e716:	66 89 15 8e ca 87 00 	mov    WORD PTR ds:0x87ca8e,dx
  46e71d:	66 8b 59 26          	mov    bx,WORD PTR [ecx+0x26]
  46e721:	66 89 1d 90 ca 87 00 	mov    WORD PTR ds:0x87ca90,bx
  46e728:	66 8b 41 28          	mov    ax,WORD PTR [ecx+0x28]
  46e72c:	66 a3 92 ca 87 00    	mov    ds:0x87ca92,ax
  46e732:	8b 51 04             	mov    edx,DWORD PTR [ecx+0x4]
  46e735:	89 15 74 ca 87 00    	mov    DWORD PTR ds:0x87ca74,edx
  46e73b:	8b 19                	mov    ebx,DWORD PTR [ecx]
  46e73d:	89 1d 5c ca 87 00    	mov    DWORD PTR ds:0x87ca5c,ebx
  46e743:	8b 41 14             	mov    eax,DWORD PTR [ecx+0x14]
  46e746:	a3 68 ca 87 00       	mov    ds:0x87ca68,eax
  46e74b:	8b 51 10             	mov    edx,DWORD PTR [ecx+0x10]
  46e74e:	89 15 64 ca 87 00    	mov    DWORD PTR ds:0x87ca64,edx
  46e754:	8b 59 0c             	mov    ebx,DWORD PTR [ecx+0xc]
  46e757:	89 1d 6c ca 87 00    	mov    DWORD PTR ds:0x87ca6c,ebx
  46e75d:	0f bf 41 34          	movsx  eax,WORD PTR [ecx+0x34]
  46e761:	a3 70 ca 87 00       	mov    ds:0x87ca70,eax
  46e766:	0f bf 05 90 ca 87 00 	movsx  eax,WORD PTR ds:0x87ca90
  46e76d:	66 8b 71 2a          	mov    si,WORD PTR [ecx+0x2a]
  46e771:	99                   	cdq
  46e772:	2b c2                	sub    eax,edx
  46e774:	c1 f8 01             	sar    eax,0x1
  46e777:	66 03 f0             	add    si,ax
  46e77a:	0f bf 05 92 ca 87 00 	movsx  eax,WORD PTR ds:0x87ca92
  46e781:	66 89 35 a4 ca 87 00 	mov    WORD PTR ds:0x87caa4,si
  46e788:	99                   	cdq
  46e789:	66 8b 71 2c          	mov    si,WORD PTR [ecx+0x2c]
  46e78d:	2b c2                	sub    eax,edx
  46e78f:	c1 f8 01             	sar    eax,0x1
  46e792:	66 03 f0             	add    si,ax
  46e795:	33 c0                	xor    eax,eax
  46e797:	66 89 35 a6 ca 87 00 	mov    WORD PTR ds:0x87caa6,si
  46e79e:	8b 15 80 45 98 00    	mov    edx,DWORD PTR ds:0x984580
  46e7a4:	66 a3 94 ca 87 00    	mov    ds:0x87ca94,ax
  46e7aa:	8b 1d 84 45 98 00    	mov    ebx,DWORD PTR ds:0x984584
  46e7b0:	66 a3 96 ca 87 00    	mov    ds:0x87ca96,ax
  46e7b6:	66 a3 98 ca 87 00    	mov    ds:0x87ca98,ax
  46e7bc:	66 a3 9a ca 87 00    	mov    ds:0x87ca9a,ax
  46e7c2:	66 8b c2             	mov    ax,dx
  46e7c5:	66 89 15 9c ca 87 00 	mov    WORD PTR ds:0x87ca9c,dx
  46e7cc:	66 2b 05 8c ca 87 00 	sub    ax,WORD PTR ds:0x87ca8c
  46e7d3:	66 89 1d 9e ca 87 00 	mov    WORD PTR ds:0x87ca9e,bx
  46e7da:	66 a3 a0 ca 87 00    	mov    ds:0x87caa0,ax
  46e7e0:	66 8b c3             	mov    ax,bx
  46e7e3:	66 2b 05 8e ca 87 00 	sub    ax,WORD PTR ds:0x87ca8e
  46e7ea:	66 a3 a2 ca 87 00    	mov    ds:0x87caa2,ax
  46e7f0:	f6 05 61 c6 89 00 01 	test   BYTE PTR ds:0x89c661,0x1
  46e7f7:	0f 84 db 00 00 00    	je     0x46e8d8
  46e7fd:	0f bf fa             	movsx  edi,dx
  46e800:	0f bf db             	movsx  ebx,bx
  46e803:	0f bf 2d 8c ca 87 00 	movsx  ebp,WORD PTR ds:0x87ca8c
  46e80a:	8d 57 88             	lea    edx,[edi-0x78]
  46e80d:	8d 73 88             	lea    esi,[ebx-0x78]
  46e810:	83 c7 78             	add    edi,0x78
  46e813:	83 c3 78             	add    ebx,0x78
  46e816:	3b ea                	cmp    ebp,edx
  46e818:	7e 02                	jle    0x46e81c
  46e81a:	8b d5                	mov    edx,ebp
  46e81c:	0f bf 05 90 ca 87 00 	movsx  eax,WORD PTR ds:0x87ca90
  46e823:	03 c5                	add    eax,ebp
  46e825:	3b c2                	cmp    eax,edx
  46e827:	7d 02                	jge    0x46e82b
  46e829:	8b d0                	mov    edx,eax
  46e82b:	3b ef                	cmp    ebp,edi
  46e82d:	7e 02                	jle    0x46e831
  46e82f:	8b fd                	mov    edi,ebp
  46e831:	3b c7                	cmp    eax,edi
  46e833:	7d 02                	jge    0x46e837
  46e835:	8b f8                	mov    edi,eax
  46e837:	0f bf 2d 8e ca 87 00 	movsx  ebp,WORD PTR ds:0x87ca8e
  46e83e:	3b ee                	cmp    ebp,esi
  46e840:	7e 02                	jle    0x46e844
  46e842:	8b f5                	mov    esi,ebp
  46e844:	0f bf 05 92 ca 87 00 	movsx  eax,WORD PTR ds:0x87ca92
  46e84b:	03 c5                	add    eax,ebp
  46e84d:	3b c6                	cmp    eax,esi
  46e84f:	7d 02                	jge    0x46e853
  46e851:	8b f0                	mov    esi,eax
  46e853:	3b eb                	cmp    ebp,ebx
  46e855:	7e 02                	jle    0x46e859
  46e857:	8b dd                	mov    ebx,ebp
  46e859:	3b c3                	cmp    eax,ebx
  46e85b:	7d 02                	jge    0x46e85f
  46e85d:	8b d8                	mov    ebx,eax
  46e85f:	66 2b fa             	sub    di,dx
  46e862:	66 2b de             	sub    bx,si
  46e865:	66 89 15 94 ca 87 00 	mov    WORD PTR ds:0x87ca94,dx
  46e86c:	66                   	data16
  46e86d:	89                   	.byte 0x89
  46e86e:	35                   	.byte 0x35
  46e86f:	96                   	xchg   esi,eax
