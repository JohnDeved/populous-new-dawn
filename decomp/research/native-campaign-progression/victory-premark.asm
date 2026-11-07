
d3dpoptb.exe:     file format pei-i386


Disassembly of section .text:

00419001 <.text+0x18001>:
  419001:	81 25 61 c6 89 00 ff 	and    DWORD PTR ds:0x89c661,0xfdffffff
  419008:	ff ff fd
  41900b:	81 25 61 c6 89 00 ff 	and    DWORD PTR ds:0x89c661,0xfbffffff
  419012:	ff ff fb
  419015:	81 0d 61 c6 89 00 00 	or     DWORD PTR ds:0x89c661,0x2000000
  41901c:	00 00 02
  41901f:	6a 01                	push   0x1
  419021:	e8 9a 61 09 00       	call   0x4af1c0
  419026:	83 c4 04             	add    esp,0x4
  419029:	83 7c 24 10 00       	cmp    DWORD PTR [esp+0x10],0x0
  41902e:	74 0e                	je     0x41903e
  419030:	a0 65 d1 89 00       	mov    al,ds:0x89d165
  419035:	50                   	push   eax
  419036:	e8 d5 25 00 00       	call   0x41b610
  41903b:	83 c4 04             	add    esp,0x4
  41903e:	80 0d b2 08 96 00 01 	or     BYTE PTR ds:0x9608b2,0x1
  419045:	0f bf 05 dd c6 89 00 	movsx  eax,WORD PTR ds:0x89c6dd
  41904c:	48                   	dec    eax
  41904d:	50                   	push   eax
  41904e:	e8 6d d0 06 00       	call   0x4860c0
  419053:	83 c4 04             	add    esp,0x4
  419056:	5d                   	pop    ebp
  419057:	5f                   	pop    edi
  419058:	5e                   	pop    esi
  419059:	5b                   	pop    ebx
  41905a:	83 c4 08             	add    esp,0x8
  41905d:	c3                   	ret
