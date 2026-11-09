
INPUT/d3dpoptb.exe:     file format pei-i386


Disassembly of section .text:

0057dfe0 <.text+0x17cfe0>:
  57dfe0:	8b 81 bc 03 00 00    	mov    eax,DWORD PTR [ecx+0x3bc]
  57dfe6:	85 c0                	test   eax,eax
  57dfe8:	74 36                	je     0x57e020
  57dfea:	57                   	push   edi
  57dfeb:	8b 3d 24 c7 d0 00    	mov    edi,DWORD PTR ds:0xd0c724
  57dff1:	56                   	push   esi
  57dff2:	8d b1 b8 03 00 00    	lea    esi,[ecx+0x3b8]
  57dff8:	6a 00                	push   0x0
  57dffa:	56                   	push   esi
  57dffb:	ff d7                	call   edi
  57dffd:	6a 00                	push   0x0
  57dfff:	56                   	push   esi
  57e000:	ff d7                	call   edi
  57e002:	85 c0                	test   eax,eax
  57e004:	75 15                	jne    0x57e01b
  57e006:	53                   	push   ebx
  57e007:	8b 1d e0 c6 d0 00    	mov    ebx,DWORD PTR ds:0xd0c6e0
  57e00d:	6a 0a                	push   0xa
  57e00f:	ff d3                	call   ebx
  57e011:	6a 00                	push   0x0
  57e013:	56                   	push   esi
  57e014:	ff d7                	call   edi
  57e016:	85 c0                	test   eax,eax
  57e018:	74 f3                	je     0x57e00d
  57e01a:	5b                   	pop    ebx
  57e01b:	5e                   	pop    esi
  57e01c:	33 c0                	xor    eax,eax
  57e01e:	5f                   	pop    edi
  57e01f:	c3                   	ret
  57e020:	b8 01 00 00 00       	mov    eax,0x1
  57e025:	c3                   	ret

INPUT/d3dpoptb.exe:     file format pei-i386


Disassembly of section .text:

0057e350 <.text+0x17d350>:
  57e350:	56                   	push   esi
  57e351:	8b f1                	mov    esi,ecx
  57e353:	8b 06                	mov    eax,DWORD PTR [esi]
  57e355:	8b 40 5c             	mov    eax,DWORD PTR [eax+0x5c]
  57e358:	85 c0                	test   eax,eax
  57e35a:	74 0f                	je     0x57e36b
  57e35c:	8b 08                	mov    ecx,DWORD PTR [eax]
  57e35e:	50                   	push   eax
  57e35f:	ff 51 08             	call   DWORD PTR [ecx+0x8]
  57e362:	8b 16                	mov    edx,DWORD PTR [esi]
  57e364:	c7 42 5c 00 00 00 00 	mov    DWORD PTR [edx+0x5c],0x0
  57e36b:	33 c0                	xor    eax,eax
  57e36d:	5e                   	pop    esi
  57e36e:	c3                   	ret

INPUT/d3dpoptb.exe:     file format pei-i386


Disassembly of section .text:

0057ade0 <.text+0x179de0>:
  57ade0:	33 c0                	xor    eax,eax
  57ade2:	c3                   	ret
  57ade3:	90                   	nop
  57ade4:	90                   	nop
  57ade5:	90                   	nop
  57ade6:	90                   	nop
  57ade7:	90                   	nop
  57ade8:	90                   	nop
  57ade9:	90                   	nop
  57adea:	90                   	nop
  57adeb:	90                   	nop
  57adec:	90                   	nop
  57aded:	90                   	nop
  57adee:	90                   	nop
  57adef:	90                   	nop
  57adf0:	33 c0                	xor    eax,eax
  57adf2:	c3                   	ret
