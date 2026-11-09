
decomp/research/native-tribe-controls/004ec6f0-004ec738.bin:     file format binary


Disassembly of section .data:

004ec6f0 <.data>:
  4ec6f0:	f6 05 61 c6 89 00 02 	test   BYTE PTR ds:0x89c661,0x2
  4ec6f7:	53                   	push   ebx
  4ec6f8:	56                   	push   esi
  4ec6f9:	57                   	push   edi
  4ec6fa:	55                   	push   ebp
  4ec6fb:	0f 85 3a 03 00 00    	jne    0x4eca3b
  4ec701:	33 d2                	xor    edx,edx
  4ec703:	ff 05 88 d1 89 00    	inc    DWORD PTR ds:0x89d188
  4ec709:	88 15 67 d1 89 00    	mov    BYTE PTR ds:0x89d167,dl
  4ec70f:	38 15 bf ea 96 00    	cmp    BYTE PTR ds:0x96eabf,dl
  4ec715:	76 21                	jbe    0x4ec738
  4ec717:	b8 ec dd 89 00       	mov    eax,0x89ddec
  4ec71c:	8a 08                	mov    cl,BYTE PTR [eax]
  4ec71e:	84 c9                	test   cl,cl
  4ec720:	74 04                	je     0x4ec726
  4ec722:	fe c9                	dec    cl
  4ec724:	88 08                	mov    BYTE PTR [eax],cl
  4ec726:	05 65 0c 00 00       	add    eax,0xc65
  4ec72b:	42                   	inc    edx
  4ec72c:	33 c9                	xor    ecx,ecx
  4ec72e:	8a 0d bf ea 96 00    	mov    cl,BYTE PTR ds:0x96eabf
  4ec734:	3b ca                	cmp    ecx,edx
  4ec736:	7f e4                	jg     0x4ec71c
