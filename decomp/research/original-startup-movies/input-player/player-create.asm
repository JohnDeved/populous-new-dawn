
INPUT/d3dpoptb.exe:     file format pei-i386


Disassembly of section .text:

00579960 <.text+0x178960>:
  579960:	56                   	push   esi
  579961:	57                   	push   edi
  579962:	68 68 06 00 00       	push   0x668
  579967:	6a 01                	push   0x1
  579969:	e8 d2 44 fe ff       	call   0x55de40
  57996e:	8b f0                	mov    esi,eax
  579970:	83 c4 08             	add    esp,0x8
  579973:	85 f6                	test   esi,esi
  579975:	74 5e                	je     0x5799d5
  579977:	b9 9a 01 00 00       	mov    ecx,0x19a
  57997c:	33 c0                	xor    eax,eax
  57997e:	8b fe                	mov    edi,esi
  579980:	8b d6                	mov    edx,esi
  579982:	f3 ab                	rep stos DWORD PTR es:[edi],eax
  579984:	8b 7c 24 14          	mov    edi,DWORD PTR [esp+0x14]
  579988:	8b 44 24 10          	mov    eax,DWORD PTR [esp+0x10]
  57998c:	8b 4c 24 0c          	mov    ecx,DWORD PTR [esp+0xc]
  579990:	89 3e                	mov    DWORD PTR [esi],edi
  579992:	89 87 a0 00 00 00    	mov    DWORD PTR [edi+0xa0],eax
  579998:	e8 43 00 00 00       	call   0x5799e0
  57999d:	85 c0                	test   eax,eax
  57999f:	74 0e                	je     0x5799af
  5799a1:	56                   	push   esi
  5799a2:	e8 29 24 fe ff       	call   0x55bdd0
  5799a7:	83 c4 04             	add    esp,0x4
  5799aa:	33 c0                	xor    eax,eax
  5799ac:	5f                   	pop    edi
  5799ad:	5e                   	pop    esi
  5799ae:	c3                   	ret
  5799af:	8b ce                	mov    ecx,esi
  5799b1:	89 37                	mov    DWORD PTR [edi],esi
  5799b3:	e8 78 46 00 00       	call   0x57e030
  5799b8:	8b ce                	mov    ecx,esi
  5799ba:	e8 41 1f 00 00       	call   0x57b900
  5799bf:	8b 0e                	mov    ecx,DWORD PTR [esi]
  5799c1:	6a 00                	push   0x0
  5799c3:	81 c1 9c 00 00 00    	add    ecx,0x9c
  5799c9:	51                   	push   ecx
  5799ca:	ff 15 24 c7 d0 00    	call   DWORD PTR ds:0xd0c724
  5799d0:	8b c7                	mov    eax,edi
  5799d2:	5f                   	pop    edi
  5799d3:	5e                   	pop    esi
  5799d4:	c3                   	ret
  5799d5:	5f                   	pop    edi
  5799d6:	33 c0                	xor    eax,eax
  5799d8:	5e                   	pop    esi
  5799d9:	c3                   	ret
  5799da:	90                   	nop
  5799db:	90                   	nop
  5799dc:	90                   	nop
  5799dd:	90                   	nop
  5799de:	90                   	nop
  5799df:	90                   	nop
