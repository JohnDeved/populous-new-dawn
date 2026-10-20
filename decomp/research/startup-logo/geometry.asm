
INPUT/d3dpoptb.exe:     file format pei-i386


Disassembly of section .text:

0057c750 <.text+0x17b750>:
  57c750:	33 c0                	xor    eax,eax
  57c752:	56                   	push   esi
  57c753:	89 41 14             	mov    DWORD PTR [ecx+0x14],eax
  57c756:	89 41 18             	mov    DWORD PTR [ecx+0x18],eax
  57c759:	8b 01                	mov    eax,DWORD PTR [ecx]
  57c75b:	8b 50 64             	mov    edx,DWORD PTR [eax+0x64]
  57c75e:	89 51 0c             	mov    DWORD PTR [ecx+0xc],edx
  57c761:	8b 50 60             	mov    edx,DWORD PTR [eax+0x60]
  57c764:	89 51 10             	mov    DWORD PTR [ecx+0x10],edx
  57c767:	8a 50 04             	mov    dl,BYTE PTR [eax+0x4]
  57c76a:	f6 c2 40             	test   dl,0x40
  57c76d:	74 03                	je     0x57c772
  57c76f:	d1 61 0c             	shl    DWORD PTR [ecx+0xc],1
  57c772:	f6 40 04 30          	test   BYTE PTR [eax+0x4],0x30
  57c776:	74 03                	je     0x57c77b
  57c778:	d1 61 10             	shl    DWORD PTR [ecx+0x10],1
  57c77b:	f6 40 04 04          	test   BYTE PTR [eax+0x4],0x4
  57c77f:	74 0d                	je     0x57c78e
  57c781:	8b 51 04             	mov    edx,DWORD PTR [ecx+0x4]
  57c784:	8b 71 0c             	mov    esi,DWORD PTR [ecx+0xc]
  57c787:	2b d6                	sub    edx,esi
  57c789:	d1 fa                	sar    edx,1
  57c78b:	89 51 14             	mov    DWORD PTR [ecx+0x14],edx
  57c78e:	f6 40 04 08          	test   BYTE PTR [eax+0x4],0x8
  57c792:	74 0d                	je     0x57c7a1
  57c794:	8b 51 08             	mov    edx,DWORD PTR [ecx+0x8]
  57c797:	8b 71 10             	mov    esi,DWORD PTR [ecx+0x10]
  57c79a:	2b d6                	sub    edx,esi
  57c79c:	d1 fa                	sar    edx,1
  57c79e:	89 51 18             	mov    DWORD PTR [ecx+0x18],edx
  57c7a1:	f6 40 04 01          	test   BYTE PTR [eax+0x4],0x1
  57c7a5:	74 0b                	je     0x57c7b2
  57c7a7:	8b 50 68             	mov    edx,DWORD PTR [eax+0x68]
  57c7aa:	8b 71 14             	mov    esi,DWORD PTR [ecx+0x14]
  57c7ad:	03 f2                	add    esi,edx
  57c7af:	89 71 14             	mov    DWORD PTR [ecx+0x14],esi
  57c7b2:	f6 40 04 02          	test   BYTE PTR [eax+0x4],0x2
  57c7b6:	74 0b                	je     0x57c7c3
  57c7b8:	8b 50 6c             	mov    edx,DWORD PTR [eax+0x6c]
  57c7bb:	8b 71 18             	mov    esi,DWORD PTR [ecx+0x18]
  57c7be:	03 f2                	add    esi,edx
  57c7c0:	89 71 18             	mov    DWORD PTR [ecx+0x18],esi
  57c7c3:	f6 40 04 80          	test   BYTE PTR [eax+0x4],0x80
  57c7c7:	74 06                	je     0x57c7cf
  57c7c9:	8b 50 70             	mov    edx,DWORD PTR [eax+0x70]
  57c7cc:	89 51 0c             	mov    DWORD PTR [ecx+0xc],edx
  57c7cf:	8b 50 04             	mov    edx,DWORD PTR [eax+0x4]
  57c7d2:	f6 c6 01             	test   dh,0x1
  57c7d5:	74 06                	je     0x57c7dd
  57c7d7:	8b 40 74             	mov    eax,DWORD PTR [eax+0x74]
  57c7da:	89 41 10             	mov    DWORD PTR [ecx+0x10],eax
  57c7dd:	5e                   	pop    esi
  57c7de:	c3                   	ret
