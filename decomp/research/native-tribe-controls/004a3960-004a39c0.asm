
decomp/research/native-tribe-controls/004a3960-004a39c0.bin:     file format binary


Disassembly of section .data:

004a3960 <.data>:
  4a3960:	56                   	push   esi
  4a3961:	8b 74 24 0c          	mov    esi,DWORD PTR [esp+0xc]
  4a3965:	8a 4e 2f             	mov    cl,BYTE PTR [esi+0x2f]
  4a3968:	80 f9 ff             	cmp    cl,0xff
  4a396b:	74 4f                	je     0x4a39bc
  4a396d:	0f be 05 f0 c6 89 00 	movsx  eax,BYTE PTR ds:0x89c6f0
  4a3974:	8b 54 24 08          	mov    edx,DWORD PTR [esp+0x8]
  4a3978:	3b c2                	cmp    eax,edx
  4a397a:	75 0b                	jne    0x4a3987
  4a397c:	0f be c1             	movsx  eax,cl
  4a397f:	66 ff 04 45 aa 08 96 	inc    WORD PTR [eax*2+0x9608aa]
  4a3986:	00
  4a3987:	8d 0c 92             	lea    ecx,[edx+edx*4]
  4a398a:	0f be 46 2f          	movsx  eax,BYTE PTR [esi+0x2f]
  4a398e:	8d 0c 4a             	lea    ecx,[edx+ecx*2]
  4a3991:	8d 0c c9             	lea    ecx,[ecx+ecx*8]
  4a3994:	8d 0c ca             	lea    ecx,[edx+ecx*8]
  4a3997:	8d 14 8a             	lea    edx,[edx+ecx*4]
  4a399a:	66 ff 84 42 e7 db 89 	inc    WORD PTR [edx+eax*2+0x89dbe7]
  4a39a1:	00
  4a39a2:	0f be 4e 2f          	movsx  ecx,BYTE PTR [esi+0x2f]
  4a39a6:	8b c1                	mov    eax,ecx
  4a39a8:	8d 14 89             	lea    edx,[ecx+ecx*4]
  4a39ab:	8d 0c 50             	lea    ecx,[eax+edx*2]
  4a39ae:	8d 34 c9             	lea    esi,[ecx+ecx*8]
  4a39b1:	8d 14 f0             	lea    edx,[eax+esi*8]
  4a39b4:	c6 84 90 ec dd 89 00 	mov    BYTE PTR [eax+edx*4+0x89ddec],0x28
  4a39bb:	28
  4a39bc:	5e                   	pop    esi
  4a39bd:	c3                   	ret
  4a39be:	cc                   	int3
  4a39bf:	cc                   	int3
