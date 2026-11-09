
INPUT/d3dpoptb.exe:     file format pei-i386


Disassembly of section .text:

00499800 <.text+0x98800>:
  499800:	83 ec 04             	sub    esp,0x4
  499803:	53                   	push   ebx
  499804:	57                   	push   edi
  499805:	33 db                	xor    ebx,ebx
  499807:	68 18 a4 5c 00       	push   0x5ca418
  49980c:	89 5c 24 0c          	mov    DWORD PTR [esp+0xc],ebx
  499810:	68 b9 57 89 00       	push   0x8957b9
  499815:	88 1d aa 56 89 00    	mov    BYTE PTR ds:0x8956aa,bl
  49981b:	e8 a0 1d 0c 00       	call   0x55b5c0
  499820:	83 c4 08             	add    esp,0x8
  499823:	a1 24 30 97 00       	mov    eax,ds:0x973024
  499828:	bf 2a 4e 89 00       	mov    edi,0x894e2a
  49982d:	50                   	push   eax
  49982e:	68 f9 57 89 00       	push   0x8957f9
  499833:	e8 88 1d 0c 00       	call   0x55b5c0
  499838:	83 c4 08             	add    esp,0x8
  49983b:	33 c0                	xor    eax,eax
  49983d:	b9 20 00 00 00       	mov    ecx,0x20
  499842:	89 1d f5 4c 89 00    	mov    DWORD PTR ds:0x894cf5,ebx
  499848:	88 1d f0 c6 89 00    	mov    BYTE PTR ds:0x89c6f0,bl
  49984e:	f3 ab                	rep stos DWORD PTR es:[edi],eax
  499850:	bf aa 4e 89 00       	mov    edi,0x894eaa
  499855:	b9 80 00 00 00       	mov    ecx,0x80
  49985a:	f3 ab                	rep stos DWORD PTR es:[edi],eax
  49985c:	8d 44 24 08          	lea    eax,[esp+0x8]
  499860:	68 f9 57 89 00       	push   0x8957f9
  499865:	68 b9 57 89 00       	push   0x8957b9
  49986a:	50                   	push   eax
  49986b:	e8 40 a5 f7 ff       	call   0x413db0
  499870:	83 c4 0c             	add    esp,0xc
  499873:	85 c0                	test   eax,eax
  499875:	74 15                	je     0x49988c
  499877:	c6 05 aa 56 89 00 01 	mov    BYTE PTR ds:0x8956aa,0x1
  49987e:	8b 44 24 08          	mov    eax,DWORD PTR [esp+0x8]
  499882:	a3 f5 4c 89 00       	mov    ds:0x894cf5,eax
  499887:	a2 f0 c6 89 00       	mov    ds:0x89c6f0,al
  49988c:	5f                   	pop    edi
  49988d:	5b                   	pop    ebx
  49988e:	83 c4 04             	add    esp,0x4
  499891:	c3                   	ret
